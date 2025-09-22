/**
 * Data Migration Utilities
 *
 * Handles migrating user data between different versions of the application.
 * Ensures backward compatibility and data integrity when models or schemas change.
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

// Migration result types
export interface MigrationResult {
	success: boolean;
	fromVersion: string | null;
	toVersion: string;
	migratedEntities: string[];
	errors: string[];
	warnings: string[];
}

export interface BackupResult {
	success: boolean;
	backupKey: string;
	timestamp: number;
	entities: string[];
}

/**
 * Main migration coordinator
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
	 * Check if migration is needed and execute if required
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
	 * Execute migrations based on version ranges
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
	 * Migration to version 1.0.0 (current baseline)
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
	 * Migrate PetState data structure
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
	 * Migrate individual PetState record
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
	 * Migrate UserProgress data structure
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
	 * Migrate individual UserProgress record
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
	 * Migrate StreakData structure
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
	 * Migrate StreakData record
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
	 * Migrate AchievementProgress data
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
	 * Migrate AchievementProgress record
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
	 * Create backup of current data
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
	 * Restore data from backup
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
					await dbManager.put(storeName as keyof DatabaseSchema, record as any);
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
	 * Clean up old backups
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
	 * Helper: Check if version A is less than version B
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
	 * Helper: Map old stage values to new EvolutionForm enum
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
 * Convenience function to run migration check
 */
export async function runMigrationCheck(): Promise<MigrationResult> {
	const migrationService = new DataMigrationService();
	return await migrationService.checkAndMigrate();
}

/**
 * Convenience function to create data backup
 */
export async function createDataBackup(): Promise<BackupResult> {
	const migrationService = new DataMigrationService();
	return await migrationService.createBackup();
}

/**
 * Convenience function to clean up old backups
 */
export async function cleanupDataBackups(maxAgeDays: number = 7): Promise<number> {
	const migrationService = new DataMigrationService();
	const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
	return await migrationService.cleanupOldBackups(maxAge);
}
