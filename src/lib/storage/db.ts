import type { PetState, UserProgress, ContentItem, AchievementProgress } from '$lib/types/index.js';

export const DB_NAME = 'feed-n-type-db';
export const DB_VERSION = 1;

export interface DatabaseSchema {
	pet_states: PetState;
	user_progress: UserProgress;
	content_cache: ContentItem;
	achievements: AchievementProgress;
}

export type StoreNames = keyof DatabaseSchema;

export class DatabaseManager {
	private db: IDBDatabase | null = null;
	private dbPromise: Promise<IDBDatabase> | null = null;

	async getDatabase(): Promise<IDBDatabase> {
		if (this.db) {
			return this.db;
		}

		if (this.dbPromise) {
			return this.dbPromise;
		}

		this.dbPromise = new Promise((resolve, reject) => {
			const request = indexedDB.open(DB_NAME, DB_VERSION);

			request.onerror = () => {
				reject(new Error(`Failed to open database: ${request.error?.message}`));
			};

			request.onsuccess = () => {
				this.db = request.result;
				resolve(this.db);
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;

				if (!db.objectStoreNames.contains('pet_states')) {
					const petStore = db.createObjectStore('pet_states', { keyPath: 'id' });
					petStore.createIndex('lastFeedTime', 'lastFeedTime', { unique: false });
				}

				if (!db.objectStoreNames.contains('user_progress')) {
					const progressStore = db.createObjectStore('user_progress', { keyPath: 'sessionId' });
					progressStore.createIndex('date', 'date', { unique: false });
					progressStore.createIndex('contentSource', 'contentSource', { unique: false });
				}

				if (!db.objectStoreNames.contains('content_cache')) {
					const contentStore = db.createObjectStore('content_cache', { keyPath: 'id' });
					contentStore.createIndex('source', 'source', { unique: false });
					contentStore.createIndex('difficulty', 'difficulty', { unique: false });
					contentStore.createIndex('theme', 'theme', { unique: false });
				}

				if (!db.objectStoreNames.contains('achievements')) {
					const achievementStore = db.createObjectStore('achievements', { keyPath: 'userId' });
				}
			};
		});

		return this.dbPromise;
	}

	async get<T extends StoreNames>(
		storeName: T,
		key: string
	): Promise<DatabaseSchema[T] | undefined> {
		const db = await this.getDatabase();
		const transaction = db.transaction([storeName], 'readonly');
		const store = transaction.objectStore(storeName);

		return new Promise((resolve, reject) => {
			const request = store.get(key);
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	}

	async put<T extends StoreNames>(storeName: T, data: DatabaseSchema[T]): Promise<void> {
		const db = await this.getDatabase();
		const transaction = db.transaction([storeName], 'readwrite');
		const store = transaction.objectStore(storeName);

		return new Promise((resolve, reject) => {
			const request = store.put(data);
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	async delete<T extends StoreNames>(storeName: T, key: string): Promise<void> {
		const db = await this.getDatabase();
		const transaction = db.transaction([storeName], 'readwrite');
		const store = transaction.objectStore(storeName);

		return new Promise((resolve, reject) => {
			const request = store.delete(key);
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	async getAll<T extends StoreNames>(storeName: T): Promise<DatabaseSchema[T][]> {
		const db = await this.getDatabase();
		const transaction = db.transaction([storeName], 'readonly');
		const store = transaction.objectStore(storeName);

		return new Promise((resolve, reject) => {
			const request = store.getAll();
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	}

	async getByIndex<T extends StoreNames>(
		storeName: T,
		indexName: string,
		indexValue: string | number | Date
	): Promise<DatabaseSchema[T][]> {
		const db = await this.getDatabase();
		const transaction = db.transaction([storeName], 'readonly');
		const store = transaction.objectStore(storeName);
		const index = store.index(indexName);

		return new Promise((resolve, reject) => {
			const request = index.getAll(indexValue);
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	}

	async clear<T extends StoreNames>(storeName: T): Promise<void> {
		const db = await this.getDatabase();
		const transaction = db.transaction([storeName], 'readwrite');
		const store = transaction.objectStore(storeName);

		return new Promise((resolve, reject) => {
			const request = store.clear();
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	async cleanup(): Promise<void> {
		const sixMonthsAgo = new Date();
		sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

		try {
			const oldSessions = await this.getByIndex('user_progress', 'date', sixMonthsAgo);

			for (const session of oldSessions) {
				if (session.date < sixMonthsAgo) {
					await this.delete('user_progress', session.sessionId);
				}
			}
		} catch (error) {
			console.warn('Failed to cleanup old progress data:', error);
		}
	}

	close(): void {
		if (this.db) {
			this.db.close();
			this.db = null;
			this.dbPromise = null;
		}
	}
}

export const dbManager = new DatabaseManager();

export async function initializeDatabase(): Promise<void> {
	try {
		await dbManager.getDatabase();
		await dbManager.cleanup();
	} catch (error) {
		console.error('Failed to initialize database:', error);
		throw error;
	}
}
