/**
 * AchievementService Implementation
 *
 * Manages achievement unlocking, milestone tracking, celebration events, and
 * accessory management for the gamified typing trainer. Provides intelligent
 * achievement detection, personal best tracking, and priority-based celebration
 * queue management with performance optimization.
 */

import type {
	AchievementService as IAchievementService,
	Achievement,
	UnlockResult,
	CelebrationEvent,
	Accessory,
	AccessoryCategory,
	AnimationType,
	MilestoneData,
	PersonalBest,
	SessionSummary,
	UserProgress
} from '$lib/types/index.js';
import { AchievementProgressModel } from '$lib/models/AchievementProgress.js';
import { dbManager } from '$lib/storage/db.js';

interface AchievementDefinition {
	id: string;
	title: string;
	description: string;
	icon: string;
	points: number;
	rarity: 'common' | 'rare' | 'epic' | 'legendary';
	checkCondition: (session: SessionSummary, progress?: unknown) => boolean;
	accessoryRewards?: string[];
}

export class AchievementService implements IAchievementService {
	private celebrationQueue: CelebrationEvent[] = [];
	private readonly MAX_QUEUE_SIZE = 5;
	private model: AchievementProgressModel | null = null;

	// Achievement definitions with unlock conditions
	private readonly ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
		// Speed Achievements
		{
			id: 'speedy-fingers',
			title: 'Speedy Fingers',
			description: 'Reached 25 WPM',
			icon: 'speed-icon',
			points: 100,
			rarity: 'common',
			checkCondition: (session) => session.wordsPerMinute >= 25,
			accessoryRewards: ['speed-hat']
		},
		{
			id: 'fast-typer',
			title: 'Fast Typer',
			description: 'Reached 20 WPM',
			icon: 'fast-icon',
			points: 50,
			rarity: 'common',
			checkCondition: (session) => session.wordsPerMinute >= 20,
			accessoryRewards: ['speed-hat']
		},
		{
			id: 'lightning-hands',
			title: 'Lightning Hands',
			description: 'Reached 30 WPM',
			icon: 'lightning-icon',
			points: 200,
			rarity: 'rare',
			checkCondition: (session) => session.wordsPerMinute >= 30
		},
		{
			id: 'speed-demon',
			title: 'Speed Demon',
			description: 'Reached 40 WPM',
			icon: 'demon-icon',
			points: 500,
			rarity: 'epic',
			checkCondition: (session) => session.wordsPerMinute >= 40
		},

		// Accuracy Achievements
		{
			id: 'careful-typer',
			title: 'Careful Typer',
			description: 'Achieved 90% accuracy',
			icon: 'careful-icon',
			points: 75,
			rarity: 'common',
			checkCondition: (session) => session.accuracyPercentage >= 90,
			accessoryRewards: ['smart-glasses']
		},
		{
			id: 'precision-master',
			title: 'Precision Master',
			description: 'Achieved 95% accuracy',
			icon: 'precision-icon',
			points: 150,
			rarity: 'rare',
			checkCondition: (session) => session.accuracyPercentage >= 95
		},
		{
			id: 'perfect-practice',
			title: 'Perfect Practice',
			description: 'Achieved 100% accuracy',
			icon: 'perfect-icon',
			points: 300,
			rarity: 'epic',
			checkCondition: (session) => session.accuracyPercentage >= 100
		},

		// Session Achievements
		{
			id: 'persistent-student',
			title: 'Persistent Student',
			description: 'Completed 10-minute session',
			icon: 'time-icon',
			points: 30,
			rarity: 'common',
			checkCondition: (session) => session.duration >= 10 * 60 * 1000
		},
		{
			id: 'dedicated-learner',
			title: 'Dedicated Learner',
			description: 'Completed 30-minute session',
			icon: 'dedication-icon',
			points: 100,
			rarity: 'rare',
			checkCondition: (session) => session.duration >= 30 * 60 * 1000
		},

		// Improvement Achievements
		{
			id: 'improving-fast',
			title: 'Improving Fast',
			description: 'Improved by 5+ WPM in one session',
			icon: 'improvement-icon',
			points: 80,
			rarity: 'common',
			checkCondition: (session) => session.improvementFromLastSession >= 5
		},
		{
			id: 'breakthrough',
			title: 'Breakthrough',
			description: 'Improved by 10+ WPM in one session',
			icon: 'breakthrough-icon',
			points: 200,
			rarity: 'rare',
			checkCondition: (session) => session.improvementFromLastSession >= 10
		}
	];

	/**
	 * Check for newly unlocked achievements based on session data
	 */
	async checkAchievements(sessionData: SessionSummary): Promise<Achievement[]> {
		// Validate session data
		if (!this.validateSessionData(sessionData)) {
			throw new Error('Invalid achievement criteria');
		}

		await this.ensureModelLoaded();

		const newAchievements: Achievement[] = [];
		const unlockedIds = this.model!.milestonesReached.map((a) => a.id);

		// Check each achievement definition
		for (const definition of this.ACHIEVEMENT_DEFINITIONS) {
			// Skip if already unlocked
			if (unlockedIds.includes(definition.id)) {
				continue;
			}

			// Check unlock condition
			if (definition.checkCondition(sessionData)) {
				const achievement: Achievement = {
					id: definition.id,
					title: definition.title,
					description: definition.description,
					icon: definition.icon,
					points: definition.points,
					rarity: definition.rarity,
					dateEarned: new Date()
				};

				newAchievements.push(achievement);

				// Unlock the achievement
				await this.unlockAchievement(definition.id);
			}
		}

		return newAchievements;
	}

	/**
	 * Unlock specific achievement and return unlock result
	 */
	async unlockAchievement(achievementId: string): Promise<UnlockResult> {
		await this.ensureModelLoaded();

		const definition = this.ACHIEVEMENT_DEFINITIONS.find((def) => def.id === achievementId);
		if (!definition) {
			throw new Error(`Achievement ${achievementId} not found`);
		}

		// Check if already unlocked
		const unlockedIds = this.model!.milestonesReached.map((a) => a.id);
		if (unlockedIds.includes(achievementId)) {
			return {
				success: false,
				achievement: {
					id: achievementId,
					title: definition.title,
					description: definition.description,
					icon: definition.icon,
					points: 0,
					rarity: definition.rarity,
					dateEarned: new Date()
				},
				accessoriesUnlocked: [],
				celebrationTriggered: false,
				pointsAwarded: 0
			};
		}

		// Unlock the achievement
		const achievement: Achievement = {
			id: achievementId,
			title: definition.title,
			description: definition.description,
			icon: definition.icon,
			points: definition.points,
			rarity: definition.rarity,
			dateEarned: new Date()
		};

		this.model!.unlockAchievement(achievementId);

		// Unlock associated accessories
		const accessoriesUnlocked: Accessory[] = [];
		if (definition.accessoryRewards) {
			for (const accessoryId of definition.accessoryRewards) {
				const accessoryUnlocked = await this.unlockAccessory(
					accessoryId,
					`Unlocked with achievement: ${definition.title}`
				);

				if (accessoryUnlocked) {
					// Get accessory details (simplified)
					accessoriesUnlocked.push({
						id: accessoryId,
						name: this.getAccessoryName(accessoryId),
						category: this.getAccessoryCategory(accessoryId) as AccessoryCategory,
						unlockCondition: `Achievement: ${definition.title}`,
						dateUnlocked: new Date(),
						equipped: false
					});
				}
			}
		}

		// Queue celebration
		await this.queueCelebration({
			type: 'milestone',
			title: `Achievement Unlocked!`,
			message: definition.title,
			animation: this.getAnimationForRarity(definition.rarity) as AnimationType,
			duration: this.getDurationForRarity(definition.rarity),
			soundEffect: this.getSoundForRarity(definition.rarity),
			priority: this.getPriorityForRarity(definition.rarity),
			autoTrigger: true
		});

		// Save progress
		await this.saveProgress();

		return {
			success: true,
			achievement,
			accessoriesUnlocked,
			celebrationTriggered: true,
			pointsAwarded: definition.points
		};
	}

	/**
	 * Get all unlocked achievements
	 */
	async getUnlockedAchievements(): Promise<Achievement[]> {
		await this.ensureModelLoaded();
		return this.model!.milestonesReached;
	}

	/**
	 * Queue celebration event with priority ordering
	 */
	async queueCelebration(celebration: Omit<CelebrationEvent, 'id'>): Promise<void> {
		// Check queue size limit
		if (this.celebrationQueue.length >= this.MAX_QUEUE_SIZE) {
			// Remove lowest priority item to make room
			const lowestPriorityIndex = this.findLowestPriorityIndex();
			this.celebrationQueue.splice(lowestPriorityIndex, 1);
		}

		// Generate ID and create full celebration event
		const fullCelebration: CelebrationEvent = {
			id: `celebration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			...celebration
		};

		// Add to queue and sort by priority
		this.celebrationQueue.push(fullCelebration);
		this.celebrationQueue.sort((a, b) => {
			const priorityOrder = { high: 3, medium: 2, low: 1 };
			return priorityOrder[b.priority] - priorityOrder[a.priority];
		});
	}

	/**
	 * Get next celebration from priority queue
	 */
	async getNextCelebration(): Promise<CelebrationEvent | null> {
		return this.celebrationQueue.length > 0 ? this.celebrationQueue[0] : null;
	}

	/**
	 * Mark celebration as shown and remove from queue
	 */
	async markCelebrationShown(celebrationId: string): Promise<void> {
		const index = this.celebrationQueue.findIndex((c) => c.id === celebrationId);
		if (index !== -1) {
			this.celebrationQueue.splice(index, 1);
		}
	}

	/**
	 * Unlock accessory with reason validation
	 */
	async unlockAccessory(accessoryId: string, reason: string): Promise<boolean> {
		await this.ensureModelLoaded();

		// Basic validation for accessory unlock
		if (!this.validateAccessoryUnlock(accessoryId, reason)) {
			return false;
		}

		const success = this.model!.unlockAccessory(accessoryId, reason);

		if (success) {
			// Queue accessory unlock celebration
			await this.queueCelebration({
				type: 'accessory',
				title: 'New Accessory!',
				message: `${this.getAccessoryName(accessoryId)} unlocked!`,
				animation: 'glow',
				duration: 2000,
				soundEffect: 'unlock.mp3',
				priority: 'medium',
				autoTrigger: true
			});

			await this.saveProgress();
		}

		return success;
	}

	/**
	 * Get available (unlocked) accessories
	 */
	async getAvailableAccessories(): Promise<Accessory[]> {
		await this.ensureModelLoaded();
		return this.model!.unlockedAccessories;
	}

	/**
	 * Equip accessory with validation
	 */
	async equipAccessory(accessoryId: string): Promise<void> {
		await this.ensureModelLoaded();

		const available = this.model!.unlockedAccessories;
		const accessory = available.find((acc) => acc.id === accessoryId);

		if (!accessory) {
			throw new Error('Accessory not available');
		}

		this.model!.equipAccessory(accessoryId);
		await this.saveProgress();
	}

	/**
	 * Check milestone achievements for progress data
	 */
	async checkMilestones(progress: UserProgress): Promise<MilestoneData[]> {
		// Validate progress data
		if (!this.validateProgressData(progress)) {
			throw new Error('Progress data corrupted');
		}

		const milestones: MilestoneData[] = [];

		// WPM milestones
		if (progress.wordsPerMinute >= 25 && progress.wordsPerMinute % 5 === 0) {
			milestones.push({
				type: 'wpm',
				value: progress.wordsPerMinute,
				timestamp: new Date(),
				celebrated: false
			});
		}

		// Accuracy milestones
		if (progress.accuracyPercentage >= 95 && progress.accuracyPercentage % 5 === 0) {
			milestones.push({
				type: 'accuracy',
				value: progress.accuracyPercentage,
				timestamp: new Date(),
				celebrated: false
			});
		}

		// Session duration milestones (10, 20, 30 minutes)
		const sessionMinutes = progress.duration / (1000 * 60);
		if (sessionMinutes >= 10 && sessionMinutes % 10 === 0) {
			milestones.push({
				type: 'words',
				value: sessionMinutes,
				timestamp: new Date(),
				celebrated: false
			});
		}

		return milestones;
	}

	/**
	 * Get personal best records
	 */
	async getPersonalBests(): Promise<PersonalBest[]> {
		await this.ensureModelLoaded();
		return this.model!.personalBests;
	}

	/**
	 * Update personal best if improved
	 */
	async updatePersonalBest(category: string, value: number): Promise<boolean> {
		await this.ensureModelLoaded();

		const updated = this.model!.updatePersonalBest(
			category as 'wpm' | 'accuracy' | 'streak' | 'session_time' | 'words_total',
			value
		);

		if (updated) {
			// Queue personal best celebration
			await this.queueCelebration({
				type: 'personal_best',
				title: 'Personal Best!',
				message: `New ${category} record: ${value}`,
				animation: 'bounce',
				duration: 3000,
				soundEffect: 'fanfare.mp3',
				priority: 'high',
				autoTrigger: true
			});

			await this.saveProgress();
		}

		return updated;
	}

	// Private helper methods

	private async ensureModelLoaded(): Promise<void> {
		if (this.model) return;

		try {
			const saved = await dbManager.get('achievements', 'main-user');
			if (saved) {
				this.model = AchievementProgressModel.fromJSON(saved);
			} else {
				this.model = new AchievementProgressModel({ userId: 'main-user' });
				await this.saveProgress();
			}
		} catch (error) {
			console.error('Failed to load achievement progress:', error);
			this.model = new AchievementProgressModel({ userId: 'main-user' });
		}
	}

	private async saveProgress(): Promise<void> {
		if (!this.model) return;

		try {
			await dbManager.put('achievements', this.model.toJSON());
		} catch (error) {
			console.error('Failed to save achievement progress:', error);
		}
	}

	private validateSessionData(sessionData: SessionSummary): boolean {
		return (
			sessionData.duration >= 0 &&
			sessionData.wordsPerMinute >= 0 &&
			sessionData.wordsPerMinute <= 300 &&
			sessionData.accuracyPercentage >= 0 &&
			sessionData.accuracyPercentage <= 100 &&
			sessionData.totalCharacters >= 0
		);
	}

	private validateProgressData(progress: UserProgress): boolean {
		return (
			progress &&
			typeof progress.wordsPerMinute === 'number' &&
			typeof progress.accuracyPercentage === 'number' &&
			typeof progress.duration === 'number' &&
			progress.wordsPerMinute >= 0 &&
			progress.accuracyPercentage >= 0 &&
			progress.duration >= 0
		);
	}

	private validateAccessoryUnlock(accessoryId: string, reason: string): boolean {
		// Simplified validation - in real implementation would check actual conditions
		const validAccessories = [
			'speed-hat',
			'smart-glasses',
			'rainbow-hat',
			'cool-hat',
			'premium-hat'
		];
		return validAccessories.includes(accessoryId) && reason.length > 0;
	}

	private findLowestPriorityIndex(): number {
		const priorityOrder = { high: 3, medium: 2, low: 1 };
		let lowestIndex = 0;
		let lowestPriority = priorityOrder[this.celebrationQueue[0].priority];

		for (let i = 1; i < this.celebrationQueue.length; i++) {
			const priority = priorityOrder[this.celebrationQueue[i].priority];
			if (priority < lowestPriority) {
				lowestPriority = priority;
				lowestIndex = i;
			}
		}

		return lowestIndex;
	}

	private getAccessoryName(accessoryId: string): string {
		const names: { [key: string]: string } = {
			'speed-hat': 'Speed Hat',
			'smart-glasses': 'Smart Glasses',
			'rainbow-hat': 'Rainbow Hat',
			'cool-hat': 'Cool Hat',
			'premium-hat': 'Premium Hat'
		};
		return names[accessoryId] || 'Unknown Accessory';
	}

	private getAccessoryCategory(accessoryId: string): 'hat' | 'glasses' | 'bow' {
		if (accessoryId.includes('hat')) return 'hat';
		if (accessoryId.includes('glasses')) return 'glasses';
		return 'bow';
	}

	private getAnimationForRarity(rarity: string): string {
		const animations: { [key: string]: string } = {
			common: 'bounce',
			rare: 'glow',
			epic: 'sparkle',
			legendary: 'explosion'
		};
		return animations[rarity] || 'bounce';
	}

	private getDurationForRarity(rarity: string): number {
		const durations: { [key: string]: number } = {
			common: 2000,
			rare: 3000,
			epic: 4000,
			legendary: 5000
		};
		return durations[rarity] || 2000;
	}

	private getSoundForRarity(rarity: string): string {
		const sounds: { [key: string]: string } = {
			common: 'ding.mp3',
			rare: 'chime.mp3',
			epic: 'fanfare.mp3',
			legendary: 'triumph.mp3'
		};
		return sounds[rarity] || 'ding.mp3';
	}

	private getPriorityForRarity(rarity: string): 'high' | 'medium' | 'low' {
		const priorities: { [key: string]: 'high' | 'medium' | 'low' } = {
			common: 'low',
			rare: 'medium',
			epic: 'high',
			legendary: 'high'
		};
		return priorities[rarity] || 'medium';
	}
}

// Export singleton instance
export const achievementService = new AchievementService();
