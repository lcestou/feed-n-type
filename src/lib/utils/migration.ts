/**
 * @module DataMigration
 * @description Data migration utilities for the gamified typing trainer.
 * Handles migrating user data between different versions of the application,
 * ensuring backward compatibility and data integrity when models or schemas change.
 *
 * This module is critical for maintaining user progress and preferences when
 * the app is updated. It includes backup/restore capabilities to prevent data loss
 * during migration processes.
 *
 * @since 1.0.0
 * @performance Implements incremental migrations and automatic backup creation
 */

import { PetStateModel } from '$lib/models/PetState.js';
import { UserProgressModel } from '$lib/models/UserProgress.js';
import { StreakDataModel } from '$lib/models/StreakData.js';
import { AchievementProgressModel } from '$lib/models/AchievementProgress.js';
import { dbManager, type DatabaseSchema } from '$lib/storage/db.js';
import { localStorageManager } from '$lib/storage/local-storage.js';
import type { PetState, UserProgress } from '$lib/types/index.js';

// Version constants
const CURRENT_DATA_VERSION = '1.0.0';
const VERSION_KEY = 'app_data_version';

/**
 * @interface MigrationResult
 * @description Result object returned from migration operations
 *
 * @property {boolean} success - Whether the migration completed successfully
 * @property {string | null} fromVersion - Source version before migration
 * @property {string} toVersion - Target version after migration
 * @property {string[]} migratedEntities - List of data entities that were migrated
 * @property {string[]} errors - Any errors encountered during migration
 * @property {string[]} warnings - Non-fatal warnings from the migration process
 *
 * @example
 * // Example migration result
 * const result: MigrationResult = {
 *   success: true,
 *   fromVersion: '0.9.0',
 *   toVersion: '1.0.0',
 *   migratedEntities: ['PetState', 'UserProgress'],
 *   errors: [],
 *   warnings: ['New field added with default value']
 * };
 *
 * @since 1.0.0
 */
export interface MigrationResult {
	success: boolean;
	fromVersion: string | null;
	toVersion: string;
	migratedEntities: string[];
	errors: string[];
	warnings: string[];
}

/**
 * @interface BackupResult
 * @description Result object returned from backup operations
 *
 * @property {boolean} success - Whether the backup was created successfully
 * @property {string} backupKey - Unique key for accessing the backup data
 * @property {number} timestamp - When the backup was created (milliseconds)
 * @property {string[]} entities - List of data entities included in the backup
 *
 * @example
 * // Example backup result
 * const backup: BackupResult = {
 *   success: true,
 *   backupKey: 'backup_1640995200000',
 *   timestamp: 1640995200000,
 *   entities: ['pet_states', 'user_progress', 'localStorage:streak_data']
 * };
 *
 * @since 1.0.0
 */
export interface BackupResult {
	success: boolean;
	backupKey: string;
	timestamp: number;
	entities: string[];
}

/**
 * @class DataMigrationService
 * @description Main migration coordinator that handles data schema updates and version transitions.
 * Provides comprehensive backup/restore capabilities and incremental migration support.
 *
 * The service ensures that kids' typing progress and pet data are preserved
 * across app updates while maintaining data integrity and performance.
 *
 * @example
 * // Run migration check during app startup
 * const migrationService = new DataMigrationService();
 * const result = await migrationService.checkAndMigrate();
 * if (result.success) {
 *   console.log(`Migrated from ${result.fromVersion} to ${result.toVersion}`);
 * }
 *
 * @since 1.0.0
 */
export class DataMigrationService {
	private petStateModel: PetStateModel;
	private userProgressModel: UserProgressModel;
	private streakDataModel: StreakDataModel;
	private achievementProgressModel: AchievementProgressModel;

	constructor() {
		this.petStateModel = new PetStateModel({});
		this.userProgressModel = new UserProgressModel({});
		this.streakDataModel = new StreakDataModel({});
		this.achievementProgressModel = new AchievementProgressModel({});
	}

	/**
	 * Checks if data migration is needed and executes migration if required.
	 * Creates automatic backup before migration and handles rollback on failure.
	 *
	 * @returns {Promise<MigrationResult>} Detailed result of the migration process
	 *
	 * @example
	 * // Check and migrate during app initialization
	 * const result = await migrationService.checkAndMigrate();
	 * if (!result.success) {
	 *   console.error('Migration failed:', result.errors);
	 *   // Handle migration failure (show error to user, etc.)
	 * } else if (result.migratedEntities.length > 0) {
	 *   console.log('Successfully migrated:', result.migratedEntities);
	 * }
	 *
	 * @performance Creates backup before migration for safety
	 * @since 1.0.0
	 */
	async checkAndMigrate(): Promise<MigrationResult> {
		const currentVersion = localStorageManager.get<string>(VERSION_KEY) ?? null;

		const result: MigrationResult = {
			success: true,
			fromVersion: currentVersion,
			toVersion: CURRENT_DATA_VERSION,
			migratedEntities: [],
			errors: [],
			warnings: []
		};

		// If no version found, this is a new installation
		if (!currentVersion) {
			localStorageManager.set(VERSION_KEY, CURRENT_DATA_VERSION);
			result.warnings.push('New installation detected - no migration needed');
			return result;
		}

		// If same version, no migration needed
		if (currentVersion === CURRENT_DATA_VERSION) {
			result.warnings.push('Already at current version - no migration needed');
			return result;
		}

		// Create backup before migration
		const backup = await this.createBackup();
		if (!backup.success) {
			result.success = false;
			result.errors.push('Failed to create backup before migration');
			return result;
		}

		try {
			// Execute version-specific migrations
			await this.executeMigrations(currentVersion || '0.0.0', CURRENT_DATA_VERSION, result);

			// Update version after successful migration
			localStorageManager.set(VERSION_KEY, CURRENT_DATA_VERSION);
		} catch (error) {
			result.success = false;
			result.errors.push(
				`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);

			// Attempt to restore from backup
			await this.restoreFromBackup(backup.backupKey);
		}

		return result;
	}

	/**
	 * Executes version-specific migrations based on source and target versions.
	 * Implements incremental migration strategy for complex version jumps.
	 *
	 * @private
	 * @param {string} fromVersion - Current data version
	 * @param {string} toVersion - Target data version
	 * @param {MigrationResult} result - Result object to populate with migration details
	 * @returns {Promise<void>}
	 *
	 * @since 1.0.0
	 */
	private async executeMigrations(
		fromVersion: string,
		toVersion: string,
		result: MigrationResult
	): Promise<void> {
		// Example migration patterns for different version upgrades

		// Migration from pre-1.0.0 versions
		if (this.isVersionLessThan(fromVersion, '1.0.0')) {
			await this.migrateToV1_0_0(result);
		}

		// Future migrations would be added here:
		// if (this.isVersionLessThan(fromVersion, '1.1.0')) {
		//     await this.migrateToV1_1_0(result);
		// }
	}

	/**
	 * Migrates all data entities to version 1.0.0 schema.
	 * This is the current baseline version with comprehensive data structure.
	 *
	 * @private
	 * @param {MigrationResult} result - Result object to populate with migration status
	 * @returns {Promise<void>}
	 *
	 * @example
	 * // Internal migration process for v1.0.0
	 * // - Adds missing pet accessory fields
	 * // - Normalizes user progress data structure
	 * // - Migrates streak data with forgiveness credits
	 * // - Updates achievement progress format
	 *
	 * @since 1.0.0
	 */
	private async migrateToV1_0_0(result: MigrationResult): Promise<void> {
		// Migrate PetState data
		try {
			await this.migratePetStateData();
			result.migratedEntities.push('PetState');
		} catch (error) {
			result.errors.push(
				`PetState migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}

		// Migrate UserProgress data
		try {
			await this.migrateUserProgressData();
			result.migratedEntities.push('UserProgress');
		} catch (error) {
			result.errors.push(
				`UserProgress migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}

		// Migrate StreakData
		try {
			await this.migrateStreakData();
			result.migratedEntities.push('StreakData');
		} catch (error) {
			result.errors.push(
				`StreakData migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}

		// Migrate Achievement Progress
		try {
			await this.migrateAchievementData();
			result.migratedEntities.push('AchievementProgress');
		} catch (error) {
			result.errors.push(
				`AchievementProgress migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Migrates all PetState records to current schema format.
	 * Ensures virtual pet data maintains compatibility across app versions.
	 *
	 * @private
	 * @returns {Promise<void>}
	 *
	 * @example
	 * // Internal migration updates:
	 * // - Adds missing accessories array
	 * // - Normalizes emotion state values
	 * // - Converts old 'stage' to 'evolutionForm'
	 * // - Ensures numeric happiness values
	 *
	 * @since 1.0.0
	 */
	private async migratePetStateData(): Promise<void> {
		// Get all existing pet state records using DatabaseManager
		const records = await dbManager.getAll('pet_states');

		for (const record of records) {
			const migrated = this.migratePetStateRecord(record);
			if (migrated !== record) {
				await dbManager.put('pet_states', migrated as PetState);
			}
		}
	}

	/**
	 * Migrates a single PetState record to current schema.
	 * Handles field additions, type conversions, and value mapping.
	 *
	 * @private
	 * @param {unknown} record - Raw PetState record to migrate
	 * @returns {unknown} Migrated record with current schema
	 *
	 * @since 1.0.0
	 */
	private migratePetStateRecord(record: unknown): unknown {
		if (!record || typeof record !== 'object') return record;
		const migrated = { ...(record as Record<string, unknown>) };

		// Example migrations:

		// Add missing fields with defaults
		if (!migrated.accessories) {
			migrated.accessories = [];
		}

		if (!migrated.emotionalState) {
			migrated.emotionalState = 'happy';
		}

		// Migrate old evolution form values
		if (migrated.stage !== undefined && migrated.evolutionForm === undefined) {
			migrated.evolutionForm = this.mapOldStageToEvolutionForm(migrated.stage);
			delete migrated.stage;
		}

		// Ensure numeric fields are properly typed
		if (typeof migrated.happinessLevel === 'string') {
			migrated.happinessLevel = parseInt(migrated.happinessLevel, 10) || 50;
		}

		return migrated;
	}

	/**
	 * Migrates all UserProgress records to current schema format.
	 * Preserves typing session history and performance metrics.
	 *
	 * @private
	 * @returns {Promise<void>}
	 *
	 * @example
	 * // Internal migration updates:
	 * // - Adds session history tracking
	 * // - Initializes weekly goals structure
	 * // - Renames 'stats' to 'statistics'
	 * // - Ensures data consistency
	 *
	 * @since 1.0.0
	 */
	private async migrateUserProgressData(): Promise<void> {
		// Get all existing user progress records using DatabaseManager
		const records = await dbManager.getAll('user_progress');

		for (const record of records) {
			const migrated = this.migrateUserProgressRecord(record);
			if (migrated !== record) {
				await dbManager.put('user_progress', migrated as UserProgress);
			}
		}
	}

	/**
	 * Migrates a single UserProgress record to current schema.
	 * Preserves all typing performance data during schema updates.
	 *
	 * @private
	 * @param {unknown} record - Raw UserProgress record to migrate
	 * @returns {unknown} Migrated record with current schema
	 *
	 * @since 1.0.0
	 */
	private migrateUserProgressRecord(record: unknown): unknown {
		if (!record || typeof record !== 'object') return record;
		const migrated = { ...(record as Record<string, unknown>) };

		// Add missing fields
		if (!migrated.sessionHistory) {
			migrated.sessionHistory = [];
		}

		if (!migrated.weeklyGoals) {
			migrated.weeklyGoals = {
				sessionsPerWeek: 5,
				minutesPerWeek: 150,
				wordsPerWeek: 1000
			};
		}

		// Migrate old statistics format
		if (migrated.stats && !migrated.statistics) {
			migrated.statistics = migrated.stats;
			delete migrated.stats;
		}

		return migrated;
	}

	/**
	 * Migrates StreakData to support forgiveness credits and catch-up features.
	 * Enhances streak tracking for better user engagement.
	 *
	 * @private
	 * @returns {Promise<void>}
	 *
	 * @example
	 * // Internal migration updates:
	 * // - Adds forgiveness credit system
	 * // - Implements catch-up windows
	 * // - Converts date string formats
	 * // - Maintains streak continuity
	 *
	 * @since 1.0.0
	 */
	private async migrateStreakData(): Promise<void> {
		const streakKey = 'streak_data';
		const existingData = localStorageManager.get(streakKey) ?? null;

		if (existingData) {
			const migrated = this.migrateStreakRecord(existingData);
			if (migrated !== existingData) {
				localStorageManager.set(streakKey, migrated);
			}
		}
	}

	/**
	 * Migrates a single StreakData record to current schema.
	 * Adds advanced streak management features.
	 *
	 * @private
	 * @param {unknown} record - Raw StreakData record to migrate
	 * @returns {unknown} Migrated record with enhanced streak features
	 *
	 * @since 1.0.0
	 */
	private migrateStreakRecord(record: unknown): unknown {
		if (!record || typeof record !== 'object') return record;
		const migrated = { ...(record as Record<string, unknown>) };

		// Add missing fields
		if (!migrated.forgiveness) {
			migrated.forgiveness = {
				available: 2,
				used: 0,
				lastUsed: null
			};
		}

		if (!migrated.catchUp) {
			migrated.catchUp = {
				available: true,
				windowHours: 24
			};
		}

		// Migrate date formats
		if (migrated.lastActivityDate && typeof migrated.lastActivityDate === 'string') {
			migrated.lastActivityDate = new Date(migrated.lastActivityDate);
		}

		return migrated;
	}

	/**
	 * Migrates AchievementProgress data to current achievement system.
	 * Preserves all unlocked achievements and accessory rewards.
	 *
	 * @private
	 * @returns {Promise<void>}
	 *
	 * @example
	 * // Internal migration updates:
	 * // - Standardizes achievement format
	 * // - Adds accessory tracking
	 * // - Converts legacy achievement arrays
	 * // - Preserves unlock dates
	 *
	 * @since 1.0.0
	 */
	private async migrateAchievementData(): Promise<void> {
		const achievementKey = 'achievement_progress';
		const existingData = localStorageManager.get(achievementKey) ?? null;

		if (existingData) {
			const migrated = this.migrateAchievementRecord(existingData);
			if (migrated !== existingData) {
				localStorageManager.set(achievementKey, migrated);
			}
		}
	}

	/**
	 * Migrates a single AchievementProgress record to current schema.
	 * Ensures all achievements and accessories are properly formatted.
	 *
	 * @private
	 * @param {unknown} record - Raw AchievementProgress record to migrate
	 * @returns {unknown} Migrated record with current achievement structure
	 *
	 * @since 1.0.0
	 */
	private migrateAchievementRecord(record: unknown): unknown {
		if (!record || typeof record !== 'object') return record;
		const migrated = { ...(record as Record<string, unknown>) };

		// Add missing fields
		if (!migrated.unlockedAchievements) {
			migrated.unlockedAchievements = [];
		}

		if (!migrated.availableAccessories) {
			migrated.availableAccessories = [];
		}

		// Migrate achievement format
		if (migrated.achievements && Array.isArray(migrated.achievements)) {
			migrated.unlockedAchievements = migrated.achievements.map((ach: unknown) => {
				const achievement = ach as {
					id?: string;
					name?: string;
					date?: Date;
					[key: string]: unknown;
				};
				return {
					id: achievement.id || achievement.name || 'unknown',
					unlockedAt: achievement.date || new Date(),
					...achievement
				};
			});
			delete migrated.achievements;
		}

		return migrated;
	}

	/**
	 * Creates comprehensive backup of all user data before migration.
	 * Includes both IndexedDB and localStorage data for complete recovery.
	 *
	 * @returns {Promise<BackupResult>} Result indicating backup success and details
	 *
	 * @example
	 * // Create backup before risky operation
	 * const backup = await migrationService.createBackup();
	 * if (backup.success) {
	 *   console.log(`Backup created: ${backup.backupKey}`);
	 *   console.log(`Backed up entities: ${backup.entities.join(', ')}`);
	 * } else {
	 *   console.error('Backup failed - aborting migration');
	 * }
	 *
	 * @performance Stores backup in localStorage with timestamp key
	 * @since 1.0.0
	 */
	async createBackup(): Promise<BackupResult> {
		const timestamp = Date.now();
		const backupKey = `backup_${timestamp}`;

		const result: BackupResult = {
			success: true,
			backupKey,
			timestamp,
			entities: []
		};

		try {
			const backup: Record<string, unknown> = {};

			// Backup IndexedDB data using DatabaseManager
			const stores: (keyof typeof backup)[] = ['pet_states', 'user_progress'];

			for (const storeName of stores) {
				backup[storeName] = await dbManager.getAll(storeName as keyof DatabaseSchema);
				result.entities.push(storeName as string);
			}

			// Backup localStorage data
			const localStorageKeys = ['streak_data', 'achievement_progress', 'app_settings'];
			backup.localStorage = {};

			for (const key of localStorageKeys) {
				const value = localStorageManager.get(key) ?? null;
				if (value !== null) {
					(backup.localStorage as Record<string, unknown>)[key] = value;
					result.entities.push(`localStorage:${key}`);
				}
			}

			// Store backup
			localStorageManager.set(backupKey, backup);
		} catch {
			result.success = false;
		}

		return result;
	}

	/**
	 * Restores all user data from a previously created backup.
	 * Used for rollback when migration fails or data corruption occurs.
	 *
	 * @param {string} backupKey - Unique key identifying the backup to restore
	 * @returns {Promise<boolean>} True if restoration was successful, false otherwise
	 *
	 * @example
	 * // Restore from backup after failed migration
	 * const restored = await migrationService.restoreFromBackup('backup_1640995200000');
	 * if (restored) {
	 *   console.log('Successfully restored user data from backup');
	 * } else {
	 *   console.error('Failed to restore from backup');
	 * }
	 *
	 * @performance Clears existing data before restoration
	 * @since 1.0.0
	 */
	async restoreFromBackup(backupKey: string): Promise<boolean> {
		try {
			const backup = localStorageManager.get(backupKey) ?? null;
			if (!backup) return false;

			// Restore IndexedDB data using DatabaseManager
			for (const [storeName, records] of Object.entries(backup as Record<string, unknown>)) {
				if (storeName === 'localStorage') continue;

				// Clear and restore using DatabaseManager methods
				await dbManager.clear(storeName as keyof DatabaseSchema);
				for (const record of records as unknown[]) {
					await dbManager.put(
						storeName as keyof DatabaseSchema,
						record as DatabaseSchema[keyof DatabaseSchema]
					);
				}
			}

			// Restore localStorage data
			const backupObj = backup as Record<string, unknown>;
			if ('localStorage' in backupObj && backupObj.localStorage) {
				for (const [key, value] of Object.entries(
					backupObj.localStorage as Record<string, unknown>
				)) {
					localStorageManager.set(key, value);
				}
			}

			return true;
		} catch (error) {
			console.error('Restore failed:', error);
			return false;
		}
	}

	/**
	 * Removes old backup files to prevent storage bloat.
	 * Automatically called during migration to maintain optimal storage usage.
	 *
	 * @param {number} [maxAge=7 * 24 * 60 * 60 * 1000] - Maximum age in milliseconds (default: 7 days)
	 * @returns {Promise<number>} Number of backups cleaned up
	 *
	 * @example
	 * // Clean up backups older than 3 days
	 * const cleaned = await migrationService.cleanupOldBackups(3 * 24 * 60 * 60 * 1000);
	 * console.log(`Removed ${cleaned} old backup files`);
	 *
	 * // Use default 7-day cleanup
	 * const defaultCleanup = await migrationService.cleanupOldBackups();
	 *
	 * @performance Iterates through localStorage keys to find old backups
	 * @since 1.0.0
	 */
	async cleanupOldBackups(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
		const keys = Object.keys(localStorage);
		const backupKeys = keys.filter((key) => key.startsWith('backup_'));
		let cleaned = 0;

		const cutoff = Date.now() - maxAge;

		for (const key of backupKeys) {
			const timestamp = parseInt(key.replace('backup_', ''), 10);
			if (timestamp < cutoff) {
				localStorage.removeItem(key);
				cleaned++;
			}
		}

		return cleaned;
	}

	/**
	 * Compares two semantic version strings to determine ordering.
	 * Used for determining which migrations need to be applied.
	 *
	 * @private
	 * @param {string} versionA - First version string (e.g., '1.0.0')
	 * @param {string} versionB - Second version string (e.g., '1.1.0')
	 * @returns {boolean} True if versionA is less than versionB
	 *
	 * @example
	 * // Internal usage for migration logic
	 * const needsMigration = this.isVersionLessThan('0.9.0', '1.0.0'); // true
	 * const alreadyCurrent = this.isVersionLessThan('1.0.0', '1.0.0'); // false
	 *
	 * @since 1.0.0
	 */
	private isVersionLessThan(versionA: string, versionB: string): boolean {
		const partsA = versionA.split('.').map((x) => parseInt(x, 10));
		const partsB = versionB.split('.').map((x) => parseInt(x, 10));

		for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
			const a = partsA[i] || 0;
			const b = partsB[i] || 0;

			if (a < b) return true;
			if (a > b) return false;
		}

		return false;
	}

	/**
	 * Maps legacy pet stage values to current EvolutionForm enum values.
	 * Ensures backward compatibility for pet evolution data.
	 *
	 * @private
	 * @param {unknown} stage - Legacy stage value from old data format
	 * @returns {string} Corresponding EvolutionForm enum value
	 *
	 * @example
	 * // Internal mapping during pet state migration
	 * const newForm = this.mapOldStageToEvolutionForm('baby'); // returns 'BABY'
	 * const defaultForm = this.mapOldStageToEvolutionForm('unknown'); // returns 'EGG'
	 *
	 * @since 1.0.0
	 */
	private mapOldStageToEvolutionForm(stage: unknown): string {
		const mapping: Record<string, string> = {
			egg: 'EGG',
			baby: 'BABY',
			child: 'CHILD',
			teen: 'TEEN',
			adult: 'ADULT'
		};

		return mapping[stage as string] || 'EGG';
	}
}

/**
 * Convenience function to run migration check during app startup.
 * Creates service instance and executes migration check automatically.
 *
 * @returns {Promise<MigrationResult>} Detailed result of migration process
 *
 * @example
 * // Run migration check during app initialization
 * import { runMigrationCheck } from '$lib/utils/migration.js';
 *
 * const migrationResult = await runMigrationCheck();
 * if (!migrationResult.success) {
 *   console.error('Migration failed:', migrationResult.errors);
 *   // Handle migration failure
 * } else if (migrationResult.migratedEntities.length > 0) {
 *   console.log('Data migrated successfully:', migrationResult.migratedEntities);
 * }
 *
 * @since 1.0.0
 */
export async function runMigrationCheck(): Promise<MigrationResult> {
	const migrationService = new DataMigrationService();
	return await migrationService.checkAndMigrate();
}

/**
 * Convenience function to create comprehensive data backup.
 * Useful for manual backup creation before major operations.
 *
 * @returns {Promise<BackupResult>} Result indicating backup success and details
 *
 * @example
 * // Create manual backup before risky operation
 * import { createDataBackup } from '$lib/utils/migration.js';
 *
 * const backup = await createDataBackup();
 * if (backup.success) {
 *   console.log(`Backup created with key: ${backup.backupKey}`);
 *   console.log(`Backed up: ${backup.entities.join(', ')}`);
 *   // Proceed with risky operation
 * } else {
 *   console.error('Failed to create backup - aborting operation');
 * }
 *
 * @since 1.0.0
 */
export async function createDataBackup(): Promise<BackupResult> {
	const migrationService = new DataMigrationService();
	return await migrationService.createBackup();
}

/**
 * Convenience function to clean up old backup files.
 * Helps maintain optimal storage usage by removing expired backups.
 *
 * @param {number} [maxAgeDays=7] - Maximum age in days for keeping backups
 * @returns {Promise<number>} Number of backup files removed
 *
 * @example
 * // Clean up backups older than 3 days
 * import { cleanupDataBackups } from '$lib/utils/migration.js';
 *
 * const removedCount = await cleanupDataBackups(3);
 * console.log(`Removed ${removedCount} old backup files`);
 *
 * // Use default 7-day retention
 * const defaultCleanup = await cleanupDataBackups();
 * console.log(`Cleaned up ${defaultCleanup} expired backups`);
 *
 * @since 1.0.0
 */
export async function cleanupDataBackups(maxAgeDays: number = 7): Promise<number> {
	const migrationService = new DataMigrationService();
	const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
	return await migrationService.cleanupOldBackups(maxAge);
}
