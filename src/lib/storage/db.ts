/**
 * @module DatabaseStorage
 * @description IndexedDB management for the gamified typing trainer.
 * Provides persistent storage for pet states, user progress, content cache,
 * and achievement data with automatic cleanup and performance optimization.
 *
 * This module ensures all typing practice data is safely stored locally
 * without any external data transmission, maintaining privacy for kids.
 *
 * @since 1.0.0
 * @performance Implements connection pooling and automatic cleanup
 */

import type { PetState, UserProgress, ContentItem, AchievementProgress } from '$lib/types/index.js';

/**
 * @constant {string} DB_NAME
 * @description Name of the IndexedDB database for the typing trainer
 * @since 1.0.0
 */
export const DB_NAME = 'feed-n-type-db';

/**
 * @constant {number} DB_VERSION
 * @description Current database schema version for migration handling
 * @since 1.0.0
 */
export const DB_VERSION = 1;

/**
 * @interface DatabaseSchema
 * @description Type mapping for IndexedDB object stores and their data types
 *
 * @property {PetState} pet_states - Virtual pet state and accessories data
 * @property {UserProgress} user_progress - Typing session progress and metrics
 * @property {ContentItem} content_cache - Cached typing practice content
 * @property {AchievementProgress} achievements - Achievement unlock progress
 *
 * @since 1.0.0
 */
export interface DatabaseSchema {
	pet_states: PetState;
	user_progress: UserProgress;
	content_cache: ContentItem;
	achievements: AchievementProgress;
}

/**
 * @typedef {keyof DatabaseSchema} StoreNames
 * @description Union type of all available object store names
 * @since 1.0.0
 */
export type StoreNames = keyof DatabaseSchema;

/**
 * @class DatabaseManager
 * @description Manages IndexedDB operations with connection pooling and error handling.
 * Provides type-safe CRUD operations for all typing trainer data stores.
 *
 * @example
 * // Get user progress data
 * const progress = await dbManager.get('user_progress', 'session-123');
 *
 * // Save pet state
 * await dbManager.put('pet_states', petStateData);
 *
 * @since 1.0.0
 */
export class DatabaseManager {
	/**
	 * @private
	 * @description Current database connection instance
	 */
	private db: IDBDatabase | null = null;

	/**
	 * @private
	 * @description Promise for database connection to prevent duplicate opens
	 */
	private dbPromise: Promise<IDBDatabase> | null = null;

	/**
	 * Gets or creates database connection with automatic schema setup.
	 * Implements connection pooling to prevent multiple database opens.
	 *
	 * @returns {Promise<IDBDatabase>} Connected IndexedDB database instance
	 * @throws {Error} If database cannot be opened or upgraded
	 *
	 * @example
	 * // Internal usage - gets database connection
	 * const db = await this.getDatabase();
	 *
	 * @performance Uses connection pooling to reuse existing connections
	 * @since 1.0.0
	 */
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
					db.createObjectStore('achievements', { keyPath: 'userId' });
				}
			};
		});

		return this.dbPromise;
	}

	/**
	 * Retrieves a single record from the specified store by primary key.
	 * Type-safe operation that returns the correct data type for each store.
	 *
	 * @template T
	 * @param {T} storeName - Name of the object store to query
	 * @param {string} key - Primary key of the record to retrieve
	 * @returns {Promise<DatabaseSchema[T] | undefined>} Record data or undefined if not found
	 *
	 * @example
	 * // Get pet state for main pet
	 * const petState = await dbManager.get('pet_states', 'main-pet');
	 * if (petState) {
	 *   console.log(`Pet happiness: ${petState.happiness}`);
	 * }
	 *
	 * // Get user progress for specific session
	 * const progress = await dbManager.get('user_progress', 'session-123');
	 *
	 * @since 1.0.0
	 */
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

	/**
	 * Stores or updates a record in the specified store.
	 * Creates new record or overwrites existing record with same primary key.
	 *
	 * @template T
	 * @param {T} storeName - Name of the object store to write to
	 * @param {DatabaseSchema[T]} data - Data to store (must include primary key)
	 * @returns {Promise<void>}
	 * @throws {Error} If storage operation fails
	 *
	 * @example
	 * // Save updated pet state
	 * await dbManager.put('pet_states', {
	 *   id: 'main-pet',
	 *   name: 'Typingotchi',
	 *   happiness: 85,
	 *   evolutionForm: 'intermediate'
	 * });
	 *
	 * // Save session progress
	 * await dbManager.put('user_progress', sessionData);
	 *
	 * @performance Single transaction operation for optimal speed
	 * @since 1.0.0
	 */
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

	/**
	 * Deletes a record from the specified store by primary key.
	 * Silently succeeds if the record doesn't exist.
	 *
	 * @template T
	 * @param {T} storeName - Name of the object store to delete from
	 * @param {string} key - Primary key of the record to delete
	 * @returns {Promise<void>}
	 * @throws {Error} If delete operation fails
	 *
	 * @example
	 * // Delete old session data
	 * await dbManager.delete('user_progress', 'old-session-id');
	 *
	 * // Remove expired content
	 * await dbManager.delete('content_cache', 'expired-content-id');
	 *
	 * @since 1.0.0
	 */
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

	/**
	 * Retrieves all records from the specified store.
	 * Use with caution on large stores as it loads all data into memory.
	 *
	 * @template T
	 * @param {T} storeName - Name of the object store to query
	 * @returns {Promise<DatabaseSchema[T][]>} Array of all records in the store
	 *
	 * @example
	 * // Get all user progress sessions
	 * const allSessions = await dbManager.getAll('user_progress');
	 * console.log(`Total sessions: ${allSessions.length}`);
	 *
	 * // Get all cached content
	 * const allContent = await dbManager.getAll('content_cache');
	 *
	 * @performance Consider using getByIndex for large datasets
	 * @since 1.0.0
	 */
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

	/**
	 * Retrieves records using an index for efficient querying.
	 * Much faster than getAll when filtering by indexed fields.
	 *
	 * @template T
	 * @param {T} storeName - Name of the object store to query
	 * @param {string} indexName - Name of the index to use for querying
	 * @param {string | number | Date} indexValue - Value to match in the index
	 * @returns {Promise<DatabaseSchema[T][]>} Array of records matching the index value
	 *
	 * @example
	 * // Get sessions from specific date
	 * const todaySessions = await dbManager.getByIndex(
	 *   'user_progress',
	 *   'date',
	 *   new Date('2023-12-01')
	 * );
	 *
	 * // Get content by source
	 * const pokemonContent = await dbManager.getByIndex(
	 *   'content_cache',
	 *   'source',
	 *   'pokemon'
	 * );
	 *
	 * @performance Optimized query using database indexes
	 * @since 1.0.0
	 */
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

	/**
	 * Removes all records from the specified store.
	 * Use with extreme caution as this operation cannot be undone.
	 *
	 * @template T
	 * @param {T} storeName - Name of the object store to clear
	 * @returns {Promise<void>}
	 * @throws {Error} If clear operation fails
	 *
	 * @example
	 * // Clear expired content cache
	 * await dbManager.clear('content_cache');
	 *
	 * // Reset all progress (use carefully!)
	 * // await dbManager.clear('user_progress');
	 *
	 * @since 1.0.0
	 */
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

	/**
	 * Performs automatic cleanup of old data to maintain database performance.
	 * Removes user progress sessions older than 6 months to prevent storage bloat.
	 *
	 * @returns {Promise<void>}
	 *
	 * @example
	 * // Run cleanup (typically called during app initialization)
	 * await dbManager.cleanup();
	 * console.log('Old session data cleaned up');
	 *
	 * @performance Maintains optimal database size by removing old data
	 * @since 1.0.0
	 */
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

	/**
	 * Closes the database connection and clears cached references.
	 * Call this when the application is shutting down or database is no longer needed.
	 *
	 * @returns {void}
	 *
	 * @example
	 * // Close database connection on app shutdown
	 * window.addEventListener('beforeunload', () => {
	 *   dbManager.close();
	 * });
	 *
	 * @since 1.0.0
	 */
	close(): void {
		if (this.db) {
			this.db.close();
			this.db = null;
			this.dbPromise = null;
		}
	}
}

/**
 * @constant {DatabaseManager} dbManager
 * @description Singleton instance of the database manager for app-wide use
 * @since 1.0.0
 */
export const dbManager = new DatabaseManager();

/**
 * Initializes the database and performs startup cleanup.
 * Call this during app initialization to ensure database is ready.
 *
 * @returns {Promise<void>}
 * @throws {Error} If database initialization fails
 *
 * @example
 * // Initialize database during app startup
 * try {
 *   await initializeDatabase();
 *   console.log('Database ready for typing practice data!');
 * } catch (error) {
 *   console.error('Database setup failed:', error);
 * }
 *
 * @performance Runs cleanup automatically to maintain optimal performance
 * @since 1.0.0
 */
export async function initializeDatabase(): Promise<void> {
	try {
		await dbManager.getDatabase();
		await dbManager.cleanup();
	} catch (error) {
		console.error('Failed to initialize database:', error);
		throw error;
	}
}
