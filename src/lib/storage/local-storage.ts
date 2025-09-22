import type { StreakData } from '$lib/types/index.js';

export const STORAGE_KEYS = {
	STREAK_DATA: 'feed-n-type:streak-data',
	APP_PREFERENCES: 'feed-n-type:app-preferences',
	LAST_SESSION: 'feed-n-type:last-session',
	DEBUG_SETTINGS: 'feed-n-type:debug-settings'
} as const;

export interface AppPreferences {
	theme: 'light' | 'dark' | 'auto';
	soundEnabled: boolean;
	animationsEnabled: boolean;
	keyboardHints: boolean;
	difficultyPreference: 'auto' | 'beginner' | 'intermediate' | 'advanced';
	contentSourcePreference: 'all' | 'pokemon' | 'nintendo' | 'roblox';
	parentDashboardPin?: string;
}

export interface LastSession {
	sessionId: string;
	timestamp: Date;
	contentId: string;
	progress: number;
	wordIndex: number;
	characterIndex: number;
}

export interface DebugSettings {
	enableLogging: boolean;
	logLevel: 'error' | 'warn' | 'info' | 'debug';
	mockEvolutions: boolean;
	fastAnimations: boolean;
	skipCelebrations: boolean;
}

export class LocalStorageManager {
	private isAvailable(): boolean {
		try {
			const test = '__localStorage_test__';
			localStorage.setItem(test, test);
			localStorage.removeItem(test);
			return true;
		} catch {
			return false;
		}
	}

	private serialize<T>(data: T): string {
		return JSON.stringify(data, (key, value) => {
			if (value instanceof Date) {
				return { __type: 'Date', value: value.toISOString() };
			}
			return value;
		});
	}

	private deserialize<T>(data: string): T {
		return JSON.parse(data, (key, value) => {
			if (value && typeof value === 'object' && value.__type === 'Date') {
				return new Date(value.value);
			}
			return value;
		});
	}

	get<T>(key: string, defaultValue?: T): T | undefined {
		if (!this.isAvailable()) {
			console.warn('localStorage not available, returning default value');
			return defaultValue;
		}

		try {
			const item = localStorage.getItem(key);
			if (item === null) {
				return defaultValue;
			}
			return this.deserialize<T>(item);
		} catch (error) {
			console.error(`Failed to get ${key} from localStorage:`, error);
			return defaultValue;
		}
	}

	set<T>(key: string, value: T): boolean {
		if (!this.isAvailable()) {
			console.warn('localStorage not available, cannot save data');
			return false;
		}

		try {
			const serialized = this.serialize(value);
			localStorage.setItem(key, serialized);
			return true;
		} catch (error) {
			console.error(`Failed to set ${key} in localStorage:`, error);
			return false;
		}
	}

	remove(key: string): boolean {
		if (!this.isAvailable()) {
			console.warn('localStorage not available');
			return false;
		}

		try {
			localStorage.removeItem(key);
			return true;
		} catch (error) {
			console.error(`Failed to remove ${key} from localStorage:`, error);
			return false;
		}
	}

	clear(): boolean {
		if (!this.isAvailable()) {
			console.warn('localStorage not available');
			return false;
		}

		try {
			const keys = Object.values(STORAGE_KEYS);
			keys.forEach((key) => localStorage.removeItem(key));
			return true;
		} catch (error) {
			console.error('Failed to clear localStorage:', error);
			return false;
		}
	}

	getSize(): number {
		if (!this.isAvailable()) {
			return 0;
		}

		let totalSize = 0;
		const keys = Object.values(STORAGE_KEYS);

		keys.forEach((key) => {
			const item = localStorage.getItem(key);
			if (item) {
				totalSize += item.length;
			}
		});

		return totalSize;
	}

	getStreakData(): StreakData | undefined {
		const defaultStreak: StreakData = {
			currentStreak: 0,
			longestStreak: 0,
			lastPracticeDate: new Date(),
			forgivenessCredits: 3,
			totalPracticeDays: 0,
			streakStartDate: new Date(),
			weekendBonusUsed: false,
			catchUpDeadline: null
		};

		return this.get<StreakData>(STORAGE_KEYS.STREAK_DATA, defaultStreak);
	}

	setStreakData(data: StreakData): boolean {
		return this.set(STORAGE_KEYS.STREAK_DATA, data);
	}

	getAppPreferences(): AppPreferences {
		const defaultPreferences: AppPreferences = {
			theme: 'auto',
			soundEnabled: true,
			animationsEnabled: true,
			keyboardHints: true,
			difficultyPreference: 'auto',
			contentSourcePreference: 'all'
		};

		return (
			this.get<AppPreferences>(STORAGE_KEYS.APP_PREFERENCES, defaultPreferences) ||
			defaultPreferences
		);
	}

	setAppPreferences(preferences: AppPreferences): boolean {
		return this.set(STORAGE_KEYS.APP_PREFERENCES, preferences);
	}

	getLastSession(): LastSession | undefined {
		return this.get<LastSession>(STORAGE_KEYS.LAST_SESSION);
	}

	setLastSession(session: LastSession): boolean {
		return this.set(STORAGE_KEYS.LAST_SESSION, session);
	}

	clearLastSession(): boolean {
		return this.remove(STORAGE_KEYS.LAST_SESSION);
	}

	getDebugSettings(): DebugSettings {
		const defaultDebug: DebugSettings = {
			enableLogging: false,
			logLevel: 'error',
			mockEvolutions: false,
			fastAnimations: false,
			skipCelebrations: false
		};

		return this.get<DebugSettings>(STORAGE_KEYS.DEBUG_SETTINGS, defaultDebug) || defaultDebug;
	}

	setDebugSettings(settings: DebugSettings): boolean {
		return this.set(STORAGE_KEYS.DEBUG_SETTINGS, settings);
	}

	migrate(): boolean {
		try {
			const streakData = this.getStreakData();
			if (streakData && !streakData.forgivenessCredits) {
				streakData.forgivenessCredits = 3;
				this.setStreakData(streakData);
			}

			const preferences = this.getAppPreferences();
			if (!preferences.contentSourcePreference) {
				preferences.contentSourcePreference = 'all';
				this.setAppPreferences(preferences);
			}

			return true;
		} catch (error) {
			console.error('Failed to migrate localStorage data:', error);
			return false;
		}
	}

	export(): Record<string, unknown> {
		const data: Record<string, unknown> = {};

		Object.values(STORAGE_KEYS).forEach((key) => {
			const item = localStorage.getItem(key);
			if (item) {
				try {
					data[key] = this.deserialize(item);
				} catch (error) {
					console.warn(`Failed to export ${key}:`, error);
				}
			}
		});

		return data;
	}

	import(data: Record<string, unknown>): boolean {
		try {
			Object.entries(data).forEach(([key, value]) => {
				if ((Object.values(STORAGE_KEYS) as string[]).includes(key)) {
					this.set(key as keyof typeof STORAGE_KEYS, value);
				}
			});
			return true;
		} catch (error) {
			console.error('Failed to import localStorage data:', error);
			return false;
		}
	}
}

export const localStorageManager = new LocalStorageManager();
