/**
 * @module AchievementService
 * @description Manages achievement unlocking, milestone tracking, celebration events, and
 * accessory management for the gamified typing trainer. Provides intelligent
 * achievement detection, personal best tracking, and priority-based celebration
 * queue management with performance optimization.
 *
 * This service is designed for kids aged 7-12 and focuses on encouraging
 * typing practice through gamification elements like virtual pet accessories
 * and achievement celebrations.
 *
 * @since 1.0.0
 * @performance Implements efficient queue management and lazy loading of achievement data
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

/**
 * @interface AchievementDefinition
 * @description Defines the structure for achievement configurations
 * including unlock conditions and rewards
 *
 * @property {string} id - Unique identifier for the achievement
 * @property {string} title - Display title for the achievement (kid-friendly)
 * @property {string} description - Explanation of how to unlock the achievement
 * @property {string} icon - Icon identifier for visual representation
 * @property {number} points - Points awarded when achievement is unlocked
 * @property {'common' | 'rare' | 'epic' | 'legendary'} rarity - Achievement difficulty level
 * @property {Function} checkCondition - Function to test if achievement criteria are met
 * @property {string[]} [accessoryRewards] - Optional pet accessories unlocked with achievement
 *
 * @example
 * // Speed achievement that unlocks a hat for the virtual pet
 * const speedAchievement: AchievementDefinition = {
 *   id: 'fast-typer',
 *   title: 'Fast Typer',
 *   description: 'Type 20 words per minute',
 *   icon: 'speed-icon',
 *   points: 50,
 *   rarity: 'common',
 *   checkCondition: (session) => session.wordsPerMinute >= 20,
 *   accessoryRewards: ['speed-hat']
 * };
 *
 * @since 1.0.0
 */
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
	 * Checks for newly unlocked achievements based on current session performance data.
	 * Evaluates all achievement conditions and returns any newly earned achievements.
	 *
	 * @param {SessionSummary} sessionData - Current typing session performance metrics
	 * @returns {Promise<Achievement[]>} Array of newly unlocked achievements
	 * @throws {Error} If session data is invalid or corrupted
	 *
	 * @example
	 * // Check achievements after a kid completes a typing session
	 * const sessionData = {
	 *   wordsPerMinute: 25,
	 *   accuracyPercentage: 92,
	 *   duration: 300000, // 5 minutes
	 *   totalCharacters: 500,
	 *   improvementFromLastSession: 3
	 * };
	 * const newAchievements = await achievementService.checkAchievements(sessionData);
	 * // Returns achievements like 'Speedy Fingers' if criteria met
	 *
	 * @performance Optimized to skip already unlocked achievements
	 * @since 1.0.0
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
	 * Unlocks a specific achievement and triggers associated rewards and celebrations.
	 * Handles accessory unlocks, celebration queuing, and progress persistence.
	 *
	 * @param {string} achievementId - Unique identifier of the achievement to unlock
	 * @returns {Promise<UnlockResult>} Detailed result including success status, rewards, and celebration info
	 * @throws {Error} If achievement ID is not found in definitions
	 *
	 * @example
	 * // Manually unlock an achievement (typically called by checkAchievements)
	 * const result = await achievementService.unlockAchievement('speedy-fingers');
	 * if (result.success) {
	 *   console.log(`Earned ${result.pointsAwarded} points!`);
	 *   console.log(`Unlocked ${result.accessoriesUnlocked.length} new accessories!`);
	 * }
	 *
	 * @performance Batches database operations for efficiency
	 * @since 1.0.0
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
	 * Retrieves all achievements that have been unlocked by the user.
	 * Used for displaying achievement galleries and progress summaries.
	 *
	 * @returns {Promise<Achievement[]>} Array of all unlocked achievements with metadata
	 *
	 * @example
	 * // Display all achievements earned by the kid
	 * const achievements = await achievementService.getUnlockedAchievements();
	 * achievements.forEach(achievement => {
	 *   console.log(`${achievement.title}: ${achievement.description}`);
	 *   console.log(`Earned on: ${achievement.dateEarned.toLocaleDateString()}`);
	 * });
	 *
	 * @performance Cached in memory after first load
	 * @since 1.0.0
	 */
	async getUnlockedAchievements(): Promise<Achievement[]> {
		await this.ensureModelLoaded();
		return this.model!.milestonesReached;
	}

	/**
	 * Queues a celebration event with automatic priority ordering and queue management.
	 * Maintains a maximum queue size and removes low-priority events when needed.
	 *
	 * @param {Omit<CelebrationEvent, 'id'>} celebration - Celebration event without ID (auto-generated)
	 * @returns {Promise<void>}
	 *
	 * @example
	 * // Queue a celebration for a new achievement
	 * await achievementService.queueCelebration({
	 *   type: 'milestone',
	 *   title: 'Well Done!',
	 *   message: 'You typed super fast!',
	 *   animation: 'sparkle',
	 *   duration: 3000,
	 *   soundEffect: 'cheer.mp3',
	 *   priority: 'high',
	 *   autoTrigger: true
	 * });
	 *
	 * @performance Limited queue size prevents memory bloat
	 * @since 1.0.0
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
	 * Retrieves the next highest-priority celebration event from the queue.
	 * Returns null if no celebrations are pending.
	 *
	 * @returns {Promise<CelebrationEvent | null>} Next celebration to display or null if queue is empty
	 *
	 * @example
	 * // Check for pending celebrations to show to the kid
	 * const nextCelebration = await achievementService.getNextCelebration();
	 * if (nextCelebration) {
	 *   displayCelebration(nextCelebration);
	 *   await achievementService.markCelebrationShown(nextCelebration.id);
	 * }
	 *
	 * @performance O(1) operation - uses pre-sorted queue
	 * @since 1.0.0
	 */
	async getNextCelebration(): Promise<CelebrationEvent | null> {
		return this.celebrationQueue.length > 0 ? this.celebrationQueue[0] : null;
	}

	/**
	 * Marks a celebration as displayed and removes it from the queue.
	 * Call this after showing a celebration to the user.
	 *
	 * @param {string} celebrationId - Unique identifier of the shown celebration
	 * @returns {Promise<void>}
	 *
	 * @example
	 * // After showing celebration animation to the kid
	 * const celebration = await achievementService.getNextCelebration();
	 * if (celebration) {
	 *   showCelebrationAnimation(celebration);
	 *   await achievementService.markCelebrationShown(celebration.id);
	 * }
	 *
	 * @performance O(n) operation but typically small queue size
	 * @since 1.0.0
	 */
	async markCelebrationShown(celebrationId: string): Promise<void> {
		const index = this.celebrationQueue.findIndex((c) => c.id === celebrationId);
		if (index !== -1) {
			this.celebrationQueue.splice(index, 1);
		}
	}

	/**
	 * Unlocks a virtual pet accessory with validation and celebration handling.
	 * Accessories enhance the visual appearance of the typing companion pet.
	 *
	 * @param {string} accessoryId - Unique identifier of the accessory to unlock
	 * @param {string} reason - Explanation for why the accessory was unlocked
	 * @returns {Promise<boolean>} True if accessory was successfully unlocked, false if already owned or invalid
	 *
	 * @example
	 * // Unlock a hat for the virtual pet when kid achieves speed milestone
	 * const unlocked = await achievementService.unlockAccessory(
	 *   'speed-hat',
	 *   'Achieved 25 WPM typing speed'
	 * );
	 * if (unlocked) {
	 *   console.log('New hat available for your typing pet!');
	 * }
	 *
	 * @performance Includes validation to prevent duplicate unlocks
	 * @since 1.0.0
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
	 * Retrieves all accessories that have been unlocked and are available for the virtual pet.
	 * Used for displaying accessory selection menus.
	 *
	 * @returns {Promise<Accessory[]>} Array of unlocked accessories with metadata
	 *
	 * @example
	 * // Show all available accessories for the kid to choose from
	 * const accessories = await achievementService.getAvailableAccessories();
	 * accessories.forEach(accessory => {
	 *   console.log(`${accessory.name} (${accessory.category})`);
	 *   console.log(`Unlocked: ${accessory.dateUnlocked.toLocaleDateString()}`);
	 * });
	 *
	 * @performance Returns cached data from memory model
	 * @since 1.0.0
	 */
	async getAvailableAccessories(): Promise<Accessory[]> {
		await this.ensureModelLoaded();
		return this.model!.unlockedAccessories;
	}

	/**
	 * Equips an accessory on the virtual pet after validating availability.
	 * Only one accessory per category can be equipped at a time.
	 *
	 * @param {string} accessoryId - Unique identifier of the accessory to equip
	 * @returns {Promise<void>}
	 * @throws {Error} If accessory is not available or not unlocked
	 *
	 * @example
	 * // Let the kid equip a hat on their virtual pet
	 * try {
	 *   await achievementService.equipAccessory('rainbow-hat');
	 *   console.log('Rainbow hat equipped on your typing pet!');
	 * } catch (error) {
	 *   console.log('That accessory is not available yet. Keep typing to unlock it!');
	 * }
	 *
	 * @performance Direct model operation with persistence
	 * @since 1.0.0
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
	 * Checks for milestone achievements based on cumulative user progress.
	 * Milestones are special achievements for reaching round number goals.
	 *
	 * @param {UserProgress} progress - Cumulative user progress data
	 * @returns {Promise<MilestoneData[]>} Array of newly reached milestones
	 * @throws {Error} If progress data is corrupted or invalid
	 *
	 * @example
	 * // Check if kid reached any typing speed milestones
	 * const progress = {
	 *   wordsPerMinute: 25,
	 *   accuracyPercentage: 95,
	 *   duration: 1800000, // 30 minutes
	 *   totalSessions: 15
	 * };
	 * const milestones = await achievementService.checkMilestones(progress);
	 * // Might return milestones for 25 WPM, 95% accuracy, or 30-minute session
	 *
	 * @performance Efficient modulo checks for round number milestones
	 * @since 1.0.0
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
	 * Retrieves all personal best records across different typing categories.
	 * Used for displaying progress summaries and encouraging improvement.
	 *
	 * @returns {Promise<PersonalBest[]>} Array of personal best records
	 *
	 * @example
	 * // Show the kid their best typing achievements
	 * const personalBests = await achievementService.getPersonalBests();
	 * personalBests.forEach(best => {
	 *   console.log(`Best ${best.category}: ${best.value}`);
	 *   console.log(`Achieved on: ${best.dateAchieved.toLocaleDateString()}`);
	 * });
	 *
	 * @performance Returns cached data from achievement model
	 * @since 1.0.0
	 */
	async getPersonalBests(): Promise<PersonalBest[]> {
		await this.ensureModelLoaded();
		return this.model!.personalBests;
	}

	/**
	 * Updates a personal best record if the new value is an improvement.
	 * Automatically triggers celebration if a new record is set.
	 *
	 * @param {string} category - Category of the personal best (wpm, accuracy, streak, etc.)
	 * @param {number} value - New value to compare against current best
	 * @returns {Promise<boolean>} True if a new personal best was set, false otherwise
	 *
	 * @example
	 * // Update typing speed personal best after a session
	 * const isNewRecord = await achievementService.updatePersonalBest('wpm', 28);
	 * if (isNewRecord) {
	 *   console.log('Congratulations! You set a new typing speed record!');
	 * } else {
	 *   console.log('Good job! Keep practicing to beat your best of 30 WPM.');
	 * }
	 *
	 * @performance Only saves to database if improvement detected
	 * @since 1.0.0
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
