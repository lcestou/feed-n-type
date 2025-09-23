/**
 * @module LocalStorage
 * @description Local storage utilities for the gamified typing trainer.
 * Manages app preferences, streak data, session persistence, and debug settings
 * with automatic serialization/deserialization and graceful fallbacks.
 *
 * All data is stored locally in the browser with no external transmission,
 * ensuring privacy and offline functionality for kids' typing practice.
 *
 * @since 1.0.0
 * @performance Implements efficient serialization with Date object support
 */

import type { StreakData } from '$lib/types/index.js';

/**
 * @constant {object} STORAGE_KEYS
 * @description Centralized storage keys for all localStorage operations
 * with consistent naming convention to prevent conflicts.
 *
 * @property {string} STREAK_DATA - Key for typing streak data and forgiveness credits
 * @property {string} APP_PREFERENCES - Key for user interface preferences
 * @property {string} LAST_SESSION - Key for session recovery data
 * @property {string} DEBUG_SETTINGS - Key for development and debugging options
 *
 * @since 1.0.0
 */
export const STORAGE_KEYS = {
	STREAK_DATA: 'feed-n-type:streak-data',
	APP_PREFERENCES: 'feed-n-type:app-preferences',
	LAST_SESSION: 'feed-n-type:last-session',
	DEBUG_SETTINGS: 'feed-n-type:debug-settings'
} as const;

/**
 * @interface AppPreferences
 * @description User interface preferences and accessibility settings
 *
 * @property {'light' | 'dark' | 'auto'} theme - Visual theme preference
 * @property {boolean} soundEnabled - Whether to play sound effects and music
 * @property {boolean} animationsEnabled - Whether to show pet and achievement animations
 * @property {boolean} keyboardHints - Whether to show keyboard key highlights
 * @property {'auto' | 'beginner' | 'intermediate' | 'advanced'} difficultyPreference - Preferred typing difficulty
 * @property {'all' | 'pokemon' | 'nintendo' | 'roblox'} contentSourcePreference - Preferred content theme
 * @property {string} [parentDashboardPin] - Optional PIN for parent dashboard access
 *
 * @example
 * // Kid-friendly preferences for optimal learning
 * const preferences: AppPreferences = {
 *   theme: 'auto',
 *   soundEnabled: true,
 *   animationsEnabled: true,
 *   keyboardHints: true,
 *   difficultyPreference: 'beginner',
 *   contentSourcePreference: 'pokemon'
 * };
 *
 * @since 1.0.0
 */
export interface AppPreferences {
	theme: 'light' | 'dark' | 'auto';
	soundEnabled: boolean;
	animationsEnabled: boolean;
	keyboardHints: boolean;
	difficultyPreference: 'auto' | 'beginner' | 'intermediate' | 'advanced';
	contentSourcePreference: 'all' | 'pokemon' | 'nintendo' | 'roblox';
	parentDashboardPin?: string;
}

/**
 * @interface LastSession
 * @description Session recovery data for resuming interrupted typing practice
 *
 * @property {string} sessionId - Unique identifier of the interrupted session
 * @property {Date} timestamp - When the session was last saved
 * @property {string} contentId - ID of the content being typed
 * @property {number} progress - Overall completion percentage (0-100)
 * @property {number} wordIndex - Index of the current word being typed
 * @property {number} characterIndex - Index of the current character within the word
 *
 * @example
 * // Session recovery after browser refresh
 * const lastSession: LastSession = {
 *   sessionId: 'session-123',
 *   timestamp: new Date(),
 *   contentId: 'pokemon-story-001',
 *   progress: 45,
 *   wordIndex: 12,
 *   characterIndex: 3
 * };
 *
 * @since 1.0.0
 */
export interface LastSession {
	sessionId: string;
	timestamp: Date;
	contentId: string;
	progress: number;
	wordIndex: number;
	characterIndex: number;
}

/**
 * @interface DebugSettings
 * @description Development and debugging configuration options
 *
 * @property {boolean} enableLogging - Whether to output debug logs to console
 * @property {'error' | 'warn' | 'info' | 'debug'} logLevel - Minimum log level to display
 * @property {boolean} mockEvolutions - Whether to trigger fake pet evolutions for testing
 * @property {boolean} fastAnimations - Whether to speed up animations for testing
 * @property {boolean} skipCelebrations - Whether to skip celebration animations
 *
 * @example
 * // Debug settings for development
 * const debugSettings: DebugSettings = {
 *   enableLogging: true,
 *   logLevel: 'debug',
 *   mockEvolutions: false,
 *   fastAnimations: true,
 *   skipCelebrations: false
 * };
 *
 * @since 1.0.0
 */
export interface DebugSettings {
	enableLogging: boolean;
	logLevel: 'error' | 'warn' | 'info' | 'debug';
	mockEvolutions: boolean;
	fastAnimations: boolean;
	skipCelebrations: boolean;
}

/**
 * @class LocalStorageManager
 * @description Manages localStorage operations with graceful fallbacks and type safety.
 * Provides automatic serialization for complex objects including Date instances.
 *
 * @example
 * // Get app preferences
 * const preferences = localStorageManager.getAppPreferences();
 *
 * // Save streak data
 * localStorageManager.setStreakData(streakData);
 *
 * @since 1.0.0
 */
export class LocalStorageManager {
	/**
	 * Checks if localStorage is available and functional.
	 * Some browsers may block localStorage in private/incognito mode.
	 *
	 * @private
	 * @returns {boolean} True if localStorage is available, false otherwise
	 *
	 * @since 1.0.0
	 */
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

	/**
	 * Serializes data to JSON string with Date object support.
	 * Preserves Date objects by converting them to a special format.
	 *
	 * @private
	 * @template T
	 * @param {T} data - Data to serialize
	 * @returns {string} Serialized JSON string
	 *
	 * @since 1.0.0
	 */
	private serialize<T>(data: T): string {
		return JSON.stringify(data, (key, value) => {
			if (value instanceof Date) {
				return { __type: 'Date', value: value.toISOString() };
			}
			return value;
		});
	}

	/**
	 * Deserializes JSON string with Date object restoration.
	 * Automatically converts special Date format back to Date objects.
	 *
	 * @private
	 * @template T
	 * @param {string} data - JSON string to deserialize
	 * @returns {T} Deserialized data with proper types
	 *
	 * @since 1.0.0
	 */
	private deserialize<T>(data: string): T {
		return JSON.parse(data, (key, value) => {
			if (value && typeof value === 'object' && value.__type === 'Date') {
				return new Date(value.value);
			}
			return value;
		});
	}

	/**
	 * Retrieves and deserializes data from localStorage.
	 * Returns default value if key doesn't exist or localStorage is unavailable.
	 *
	 * @template T
	 * @param {string} key - Storage key to retrieve
	 * @param {T} [defaultValue] - Value to return if key not found
	 * @returns {T | undefined} Retrieved data or default value
	 *
	 * @example
	 * // Get with default value
	 * const theme = localStorageManager.get('theme', 'auto');
	 *
	 * // Get complex object
	 * const preferences = localStorageManager.get<AppPreferences>('preferences');
	 *
	 * @since 1.0.0
	 */
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

	/**
	 * Serializes and stores data in localStorage.
	 * Handles complex objects and Date instances automatically.
	 *
	 * @template T
	 * @param {string} key - Storage key to use
	 * @param {T} value - Data to store
	 * @returns {boolean} True if storage was successful, false otherwise
	 *
	 * @example
	 * // Store simple value
	 * const success = localStorageManager.set('theme', 'dark');
	 *
	 * // Store complex object with Date
	 * const streakData = { currentStreak: 5, lastPracticeDate: new Date() };
	 * localStorageManager.set('streak', streakData);
	 *
	 * @since 1.0.0
	 */
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

	/**
	 * Removes data from localStorage.
	 * Safely handles cases where localStorage is unavailable.
	 *
	 * @param {string} key - Storage key to remove
	 * @returns {boolean} True if removal was successful, false otherwise
	 *
	 * @example
	 * // Clear last session data
	 * const removed = localStorageManager.remove('last-session');
	 *
	 * @since 1.0.0
	 */
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

	/**
	 * Clears all app-related data from localStorage.
	 * Only removes keys defined in STORAGE_KEYS to avoid affecting other apps.
	 *
	 * @returns {boolean} True if clearing was successful, false otherwise
	 *
	 * @example
	 * // Reset all app data
	 * const cleared = localStorageManager.clear();
	 * if (cleared) {
	 *   console.log('All typing trainer data cleared');
	 * }
	 *
	 * @since 1.0.0
	 */
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

	/**
	 * Calculates the total storage size used by the app.
	 * Useful for monitoring storage usage and optimization.
	 *
	 * @returns {number} Total size in characters of all stored data
	 *
	 * @example
	 * // Check storage usage
	 * const size = localStorageManager.getSize();
	 * console.log(`App using ${size} characters of localStorage`);
	 *
	 * @performance Iterates through all app keys to calculate size
	 * @since 1.0.0
	 */
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

	/**
	 * Retrieves typing practice streak data with intelligent defaults.
	 * Provides forgiveness credits and streak recovery features for kids.
	 *
	 * @returns {StreakData | undefined} Current streak data or undefined if none exists
	 *
	 * @example
	 * // Get current typing streak
	 * const streak = localStorageManager.getStreakData();
	 * if (streak) {
	 *   console.log(`Current streak: ${streak.currentStreak} days`);
	 *   console.log(`Longest streak: ${streak.longestStreak} days`);
	 *   console.log(`Forgiveness credits: ${streak.forgivenessCredits}`);
	 * }
	 *
	 * @since 1.0.0
	 */
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

	/**
	 * Saves typing practice streak data to localStorage.
	 * Updates streak progress and forgiveness credit usage.
	 *
	 * @param {StreakData} data - Complete streak data to save
	 * @returns {boolean} True if save was successful, false otherwise
	 *
	 * @example
	 * // Update streak after practice session
	 * const updatedStreak = {
	 *   currentStreak: 7,
	 *   longestStreak: 12,
	 *   lastPracticeDate: new Date(),
	 *   forgivenessCredits: 2,
	 *   totalPracticeDays: 45,
	 *   streakStartDate: new Date('2023-11-01'),
	 *   weekendBonusUsed: false,
	 *   catchUpDeadline: null
	 * };
	 * localStorageManager.setStreakData(updatedStreak);
	 *
	 * @since 1.0.0
	 */
	setStreakData(data: StreakData): boolean {
		return this.set(STORAGE_KEYS.STREAK_DATA, data);
	}

	/**
	 * Retrieves user interface preferences with kid-friendly defaults.
	 * Ensures the app always has valid preferences even for new users.
	 *
	 * @returns {AppPreferences} Current preferences or default kid-friendly settings
	 *
	 * @example
	 * // Get current app preferences
	 * const prefs = localStorageManager.getAppPreferences();
	 * console.log(`Theme: ${prefs.theme}`);
	 * console.log(`Sound enabled: ${prefs.soundEnabled}`);
	 * console.log(`Animations: ${prefs.animationsEnabled}`);
	 * console.log(`Keyboard hints: ${prefs.keyboardHints}`);
	 * console.log(`Difficulty: ${prefs.difficultyPreference}`);
	 * console.log(`Content source: ${prefs.contentSourcePreference}`);
	 *
	 * @since 1.0.0
	 */
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

	/**
	 * Saves user interface preferences to localStorage.
	 * Updates app behavior based on user or parent preferences.
	 *
	 * @param {AppPreferences} preferences - Complete preferences object to save
	 * @returns {boolean} True if save was successful, false otherwise
	 *
	 * @example
	 * // Save updated preferences
	 * const newPrefs: AppPreferences = {
	 *   theme: 'dark',
	 *   soundEnabled: false,
	 *   animationsEnabled: true,
	 *   keyboardHints: true,
	 *   difficultyPreference: 'intermediate',
	 *   contentSourcePreference: 'pokemon',
	 *   parentDashboardPin: '1234'
	 * };
	 * localStorageManager.setAppPreferences(newPrefs);
	 *
	 * @since 1.0.0
	 */
	setAppPreferences(preferences: AppPreferences): boolean {
		return this.set(STORAGE_KEYS.APP_PREFERENCES, preferences);
	}

	/**
	 * Retrieves the last interrupted typing session for recovery.
	 * Allows kids to continue where they left off after browser refresh.
	 *
	 * @returns {LastSession | undefined} Last session data or undefined if none exists
	 *
	 * @example
	 * // Check for interrupted session
	 * const lastSession = localStorageManager.getLastSession();
	 * if (lastSession) {
	 *   console.log(`Found interrupted session: ${lastSession.sessionId}`);
	 *   console.log(`Progress: ${lastSession.progress}%`);
	 *   console.log(`At word ${lastSession.wordIndex}, character ${lastSession.characterIndex}`);
	 *   // Offer to resume the session
	 * }
	 *
	 * @since 1.0.0
	 */
	getLastSession(): LastSession | undefined {
		return this.get<LastSession>(STORAGE_KEYS.LAST_SESSION);
	}

	/**
	 * Saves current session state for potential recovery.
	 * Called periodically during typing to enable session resumption.
	 *
	 * @param {LastSession} session - Current session state to save
	 * @returns {boolean} True if save was successful, false otherwise
	 *
	 * @example
	 * // Save session progress during typing
	 * const sessionState: LastSession = {
	 *   sessionId: 'current-session-id',
	 *   timestamp: new Date(),
	 *   contentId: 'pokemon-story-001',
	 *   progress: 67,
	 *   wordIndex: 45,
	 *   characterIndex: 2
	 * };
	 * localStorageManager.setLastSession(sessionState);
	 *
	 * @since 1.0.0
	 */
	setLastSession(session: LastSession): boolean {
		return this.set(STORAGE_KEYS.LAST_SESSION, session);
	}

	/**
	 * Removes saved session data after successful completion.
	 * Called when a typing session is completed normally.
	 *
	 * @returns {boolean} True if clearing was successful, false otherwise
	 *
	 * @example
	 * // Clear session data after completion
	 * const cleared = localStorageManager.clearLastSession();
	 * if (cleared) {
	 *   console.log('Session completed, recovery data cleared');
	 * }
	 *
	 * @since 1.0.0
	 */
	clearLastSession(): boolean {
		return this.remove(STORAGE_KEYS.LAST_SESSION);
	}

	/**
	 * Retrieves development and debugging configuration.
	 * Provides safe defaults for production use.
	 *
	 * @returns {DebugSettings} Current debug settings or safe defaults
	 *
	 * @example
	 * // Get debug settings for development
	 * const debug = localStorageManager.getDebugSettings();
	 * if (debug.enableLogging) {
	 *   console.log(`Log level: ${debug.logLevel}`);
	 * }
	 * if (debug.fastAnimations) {
	 *   console.log('Fast animations enabled for testing');
	 * }
	 *
	 * @since 1.0.0
	 */
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

	/**
	 * Saves debug and development configuration.
	 * Used for enabling testing features and debugging output.
	 *
	 * @param {DebugSettings} settings - Debug configuration to save
	 * @returns {boolean} True if save was successful, false otherwise
	 *
	 * @example
	 * // Enable debug mode for development
	 * const debugConfig: DebugSettings = {
	 *   enableLogging: true,
	 *   logLevel: 'debug',
	 *   mockEvolutions: false,
	 *   fastAnimations: true,
	 *   skipCelebrations: false
	 * };
	 * localStorageManager.setDebugSettings(debugConfig);
	 *
	 * @since 1.0.0
	 */
	setDebugSettings(settings: DebugSettings): boolean {
		return this.set(STORAGE_KEYS.DEBUG_SETTINGS, settings);
	}

	/**
	 * Performs data migration for localStorage schema updates.
	 * Ensures existing user data is compatible with new app versions.
	 *
	 * @returns {boolean} True if migration was successful, false otherwise
	 *
	 * @example
	 * // Run migration during app startup
	 * const migrated = localStorageManager.migrate();
	 * if (migrated) {
	 *   console.log('User data migrated to latest version');
	 * } else {
	 *   console.warn('Migration failed, using defaults');
	 * }
	 *
	 * @since 1.0.0
	 */
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

	/**
	 * Exports all app data for backup or transfer purposes.
	 * Creates a complete snapshot of user preferences and progress.
	 *
	 * @returns {Record<string, unknown>} Object containing all stored app data
	 *
	 * @example
	 * // Create backup of all user data
	 * const backup = localStorageManager.export();
	 * console.log('Exported data:', Object.keys(backup));
	 * // Save backup to file or cloud storage
	 *
	 * @since 1.0.0
	 */
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

	/**
	 * Imports app data from backup or transfer source.
	 * Restores user preferences and progress from exported data.
	 *
	 * @param {Record<string, unknown>} data - Data object to import
	 * @returns {boolean} True if import was successful, false otherwise
	 *
	 * @example
	 * // Restore from backup data
	 * const backupData = { }; // exported data object
	 * const restored = localStorageManager.import(backupData);
	 * if (restored) {
	 *   console.log('User data restored successfully');
	 * } else {
	 *   console.error('Failed to restore user data');
	 * }
	 *
	 * @since 1.0.0
	 */
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

/**
 * @constant {LocalStorageManager} localStorageManager
 * @description Singleton instance of the local storage manager for app-wide use
 * @since 1.0.0
 */
export const localStorageManager = new LocalStorageManager();
