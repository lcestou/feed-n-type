/**
 * @fileoverview AchievementProgress Model with Unlock Logic
 *
 * Manages achievement progress, accessory unlocks, and celebration events
 * for the gamified typing trainer. Tracks all player accomplishments
 * and provides unlock logic for virtual pet accessories.
 *
 * @module AchievementProgressModel
 * @since 1.0.0
 */

import type {
	AchievementProgress,
	Achievement,
	Accessory,
	AccessoryCategory,
	CelebrationEvent,
	WeeklyGoal,
	PersonalBest,
	UnlockResult
} from '$lib/types/index.js';

/**
 * Configuration settings for the achievement system.
 * Controls celebration queues, goal limits, and point values.
 *
 * @constant ACHIEVEMENT_SETTINGS
 * @property {number} maxCelebrationQueue - Maximum number of celebrations in queue (10)
 * @property {number} maxWeeklyGoals - Maximum weekly goals per user (5)
 * @property {number} maxPersonalBests - Maximum personal best records (20)
 * @property {number} weeklyGoalResetDay - Day of week for goal reset (1 = Monday)
 * @property {number} celebrationCooldown - Cooldown between celebrations (5000ms)
 * @property {object} achievementPointValues - Point values by rarity
 * @property {number} achievementPointValues.common - Points for common achievements (10)
 * @property {number} achievementPointValues.rare - Points for rare achievements (25)
 * @property {number} achievementPointValues.epic - Points for epic achievements (50)
 * @property {number} achievementPointValues.legendary - Points for legendary achievements (100)
 * @example
 * const pointsForEpic = ACHIEVEMENT_SETTINGS.achievementPointValues.epic; // 50
 * @since 1.0.0
 */
export const ACHIEVEMENT_SETTINGS = {
	maxCelebrationQueue: 10,
	maxWeeklyGoals: 5,
	maxPersonalBests: 20,
	weeklyGoalResetDay: 1, // Monday
	celebrationCooldown: 5000, // 5 seconds between celebrations
	achievementPointValues: {
		common: 10,
		rare: 25,
		epic: 50,
		legendary: 100
	}
} as const;

/**
 * Predefined achievement definitions for the typing game.
 * Each achievement has unlock conditions based on typing performance.
 *
 * @constant ACHIEVEMENT_DEFINITIONS
 * @property {object} speed_demon - Epic achievement for 50+ WPM
 * @property {object} lightning_fingers - Rare achievement for 30+ WPM
 * @property {object} perfectionist - Legendary achievement for 99% accuracy
 * @property {object} sharp_shooter - Epic achievement for 95% accuracy
 * @property {object} week_warrior - Rare achievement for 7-day streak
 * @property {object} month_master - Legendary achievement for 30-day streak
 * @property {object} word_collector - Common achievement for 1000 total words
 * @property {object} typing_champion - Legendary achievement for 10000 total words
 * @example
 * const speedAchievement = ACHIEVEMENT_DEFINITIONS.speed_demon;
 * console.log(speedAchievement.title); // 'Speed Demon'
 * @see {@link Achievement} for achievement structure
 * @since 1.0.0
 */
export const ACHIEVEMENT_DEFINITIONS = {
	// Speed achievements
	speed_demon: {
		id: 'speed_demon',
		title: 'Speed Demon',
		description: 'Type 50+ WPM',
		rarity: 'epic' as const,
		unlockCondition: 'wpm_50'
	},
	lightning_fingers: {
		id: 'lightning_fingers',
		title: 'Lightning Fingers',
		description: 'Type 30+ WPM',
		rarity: 'rare' as const,
		unlockCondition: 'wpm_30'
	},

	// Accuracy achievements
	perfectionist: {
		id: 'perfectionist',
		title: 'Perfectionist',
		description: 'Achieve 99% accuracy',
		rarity: 'legendary' as const,
		unlockCondition: 'accuracy_99'
	},
	sharp_shooter: {
		id: 'sharp_shooter',
		title: 'Sharp Shooter',
		description: 'Achieve 95% accuracy',
		rarity: 'epic' as const,
		unlockCondition: 'accuracy_95'
	},

	// Streak achievements
	week_warrior: {
		id: 'week_warrior',
		title: 'Week Warrior',
		description: 'Practice for 7 days straight',
		rarity: 'rare' as const,
		unlockCondition: 'streak_7'
	},
	month_master: {
		id: 'month_master',
		title: 'Month Master',
		description: 'Practice for 30 days straight',
		rarity: 'legendary' as const,
		unlockCondition: 'streak_30'
	},

	// Volume achievements
	word_collector: {
		id: 'word_collector',
		title: 'Word Collector',
		description: 'Type 1000 words total',
		rarity: 'common' as const,
		unlockCondition: 'words_1000'
	},
	typing_champion: {
		id: 'typing_champion',
		title: 'Typing Champion',
		description: 'Type 10000 words total',
		rarity: 'legendary' as const,
		unlockCondition: 'words_10000'
	}
} as const;

/**
 * Predefined accessory definitions for the virtual pet Typingotchi.
 * Accessories are unlocked based on various achievement milestones.
 *
 * @constant ACCESSORY_DEFINITIONS
 * @property {object} starter_cap - Basic hat for new players
 * @property {object} speed_helmet - Hat unlocked at 25+ WPM
 * @property {object} crown_of_accuracy - Premium hat for 95%+ accuracy
 * @property {object} basic_collar - Collar for 3-day practice streak
 * @property {object} golden_collar - Premium collar for 14-day streak
 * @property {object} keyboard_toy - Toy unlocked at 500 words typed
 * @property {object} trophy_toy - Toy for achieving 10 accomplishments
 * @property {object} pokemon_bg - Background for Pokemon content completion
 * @property {object} nintendo_bg - Background for Nintendo content completion
 * @example
 * const starterHat = ACCESSORY_DEFINITIONS.starter_cap;
 * console.log(starterHat.category); // 'hat'
 * @see {@link Accessory} for accessory structure
 * @see {@link AccessoryCategory} for available categories
 * @since 1.0.0
 */
export const ACCESSORY_DEFINITIONS = {
	// Hats
	starter_cap: {
		id: 'starter_cap',
		name: 'Starter Cap',
		category: 'hat' as AccessoryCategory,
		unlockCondition: 'first_session',
		description: 'A basic cap for new typists'
	},
	speed_helmet: {
		id: 'speed_helmet',
		name: 'Speed Helmet',
		category: 'hat' as AccessoryCategory,
		unlockCondition: 'wpm_25',
		description: 'For fast typists who need protection'
	},
	crown_of_accuracy: {
		id: 'crown_of_accuracy',
		name: 'Crown of Accuracy',
		category: 'hat' as AccessoryCategory,
		unlockCondition: 'accuracy_95',
		description: 'Worn by the most precise typists'
	},

	// Collars
	basic_collar: {
		id: 'basic_collar',
		name: 'Basic Collar',
		category: 'collar' as AccessoryCategory,
		unlockCondition: 'streak_3',
		description: 'Shows dedication to practice'
	},
	golden_collar: {
		id: 'golden_collar',
		name: 'Golden Collar',
		category: 'collar' as AccessoryCategory,
		unlockCondition: 'streak_14',
		description: 'For consistent practice champions'
	},

	// Toys
	keyboard_toy: {
		id: 'keyboard_toy',
		name: 'Mini Keyboard',
		category: 'toy' as AccessoryCategory,
		unlockCondition: 'words_500',
		description: 'A tiny keyboard to play with'
	},
	trophy_toy: {
		id: 'trophy_toy',
		name: 'Trophy',
		category: 'toy' as AccessoryCategory,
		unlockCondition: 'achievement_10',
		description: 'A symbol of typing excellence'
	},

	// Backgrounds
	pokemon_bg: {
		id: 'pokemon_bg',
		name: 'Pokemon Forest',
		category: 'background' as AccessoryCategory,
		unlockCondition: 'pokemon_content_10',
		description: 'A lush forest from the Pokemon world'
	},
	nintendo_bg: {
		id: 'nintendo_bg',
		name: 'Nintendo Castle',
		category: 'background' as AccessoryCategory,
		unlockCondition: 'nintendo_content_10',
		description: 'A magical castle from Nintendo games'
	}
} as const;

/**
 * Model class for managing achievement progress and unlocks in the gamified typing trainer.
 * Handles achievements, accessories, celebrations, weekly goals, and personal bests.
 * Designed for kids aged 7-12 with engaging progression systems.
 *
 * @class AchievementProgressModel
 * @example
 * const progress = new AchievementProgressModel({
 *   userId: 'user123',
 *   unlockedAccessories: [],
 *   milestonesReached: []
 * });
 *
 * // Check for new achievements
 * const newAchievements = progress.checkAchievements({
 *   wpm: 35,
 *   accuracy: 96,
 *   streak: 5,
 *   totalWords: 1200,
 *   sessionsCompleted: 10,
 *   contentBySource: { pokemon: 5 }
 * });
 * @since 1.0.0
 */
export class AchievementProgressModel {
	private _progress: AchievementProgress;

	constructor(progress: Partial<AchievementProgress> = {}) {
		this._progress = this.validateAndNormalize(progress);
	}

	/**
	 * Get a deep copy of the current achievement progress.
	 * Returns immutable copy to prevent external modifications.
	 *
	 * @returns {AchievementProgress} Complete progress data with all collections
	 * @example
	 * const currentProgress = model.progress;
	 * console.log(currentProgress.totalRewards); // Current reward points
	 * @since 1.0.0
	 */
	get progress(): AchievementProgress {
		return {
			...this._progress,
			unlockedAccessories: [...this._progress.unlockedAccessories],
			milestonesReached: [...this._progress.milestonesReached],
			celebrationsPending: [...this._progress.celebrationsPending],
			weeklyGoals: [...this._progress.weeklyGoals],
			personalBests: [...this._progress.personalBests]
		};
	}

	/**
	 * Get the unique identifier for the user whose progress is tracked.
	 *
	 * @returns {string} User ID
	 * @example
	 * const id = model.userId; // 'user-1234567890'
	 * @since 1.0.0
	 */
	get userId(): string {
		return this._progress.userId;
	}

	/**
	 * Get a copy of all unlocked Typingotchi accessories.
	 * Includes hats, collars, toys, backgrounds, and other customization items.
	 *
	 * @returns {Accessory[]} Array of unlocked accessories
	 * @example
	 * const accessories = model.unlockedAccessories;
	 * const hats = accessories.filter(acc => acc.category === 'hat');
	 * @see {@link Accessory} for accessory structure
	 * @since 1.0.0
	 */
	get unlockedAccessories(): Accessory[] {
		return [...this._progress.unlockedAccessories];
	}

	/**
	 * Get a copy of all earned achievements and milestones.
	 * Achievements are earned through typing performance and consistency.
	 *
	 * @returns {Achievement[]} Array of earned achievements
	 * @example
	 * const achievements = model.milestonesReached;
	 * const epicAchievements = achievements.filter(a => a.rarity === 'epic');
	 * @see {@link Achievement} for achievement structure
	 * @since 1.0.0
	 */
	get milestonesReached(): Achievement[] {
		return [...this._progress.milestonesReached];
	}

	/**
	 * Get a copy of all queued celebration events waiting to be displayed.
	 * Celebrations are triggered when achievements are unlocked or goals completed.
	 *
	 * @returns {CelebrationEvent[]} Array of pending celebrations
	 * @example
	 * const pending = model.celebrationsPending;
	 * if (pending.length > 0) {
	 *   showCelebration(pending[0]);
	 * }
	 * @see {@link CelebrationEvent} for event structure
	 * @since 1.0.0
	 */
	get celebrationsPending(): CelebrationEvent[] {
		return [...this._progress.celebrationsPending];
	}

	/**
	 * Get a copy of all weekly goals (current and past).
	 * Weekly goals provide short-term objectives to maintain engagement.
	 *
	 * @returns {WeeklyGoal[]} Array of weekly goals
	 * @example
	 * const goals = model.weeklyGoals;
	 * const currentGoals = model.getCurrentWeeklyGoals();
	 * @see {@link WeeklyGoal} for goal structure
	 * @since 1.0.0
	 */
	get weeklyGoals(): WeeklyGoal[] {
		return [...this._progress.weeklyGoals];
	}

	/**
	 * Get a copy of all personal best records.
	 * Tracks highest achievements in WPM, accuracy, streaks, and other metrics.
	 *
	 * @returns {PersonalBest[]} Array of personal best records
	 * @example
	 * const bests = model.personalBests;
	 * const wpmRecord = bests.find(pb => pb.category === 'wpm');
	 * @see {@link PersonalBest} for record structure
	 * @since 1.0.0
	 */
	get personalBests(): PersonalBest[] {
		return [...this._progress.personalBests];
	}

	/**
	 * Get the total reward points earned across all achievements.
	 * Points are used to measure overall player progress and engagement.
	 *
	 * @returns {number} Total reward points
	 * @example
	 * const points = model.totalRewards; // 250
	 * console.log(`You have ${points} total points!`);
	 * @since 1.0.0
	 */
	get totalRewards(): number {
		return this._progress.totalRewards;
	}

	/**
	 * Validate and normalize achievement progress data to ensure data integrity.
	 * Fills in missing properties with safe defaults and creates defensive copies.
	 *
	 * @private
	 * @param {Partial<AchievementProgress>} progress - Partial progress data to normalize
	 * @returns {AchievementProgress} Validated and normalized progress data
	 * @example
	 * // Internal use only - called by constructor
	 * const normalized = this.validateAndNormalize({ userId: 'test' });
	 * @since 1.0.0
	 */
	private validateAndNormalize(progress: Partial<AchievementProgress>): AchievementProgress {
		const userId = progress.userId || `user-${Date.now()}`;

		return {
			userId,
			unlockedAccessories: Array.isArray(progress.unlockedAccessories)
				? [...progress.unlockedAccessories]
				: [],
			milestonesReached: Array.isArray(progress.milestonesReached)
				? [...progress.milestonesReached]
				: [],
			celebrationsPending: Array.isArray(progress.celebrationsPending)
				? [...progress.celebrationsPending]
				: [],
			weeklyGoals: Array.isArray(progress.weeklyGoals) ? [...progress.weeklyGoals] : [],
			personalBests: Array.isArray(progress.personalBests) ? [...progress.personalBests] : [],
			totalRewards: Math.max(0, progress.totalRewards || 0)
		};
	}

	/**
	 * Check for new achievements based on current typing performance statistics.
	 * Compares stats against achievement unlock conditions and awards new achievements.
	 *
	 * @param {object} stats - Current typing performance statistics
	 * @param {number} stats.wpm - Words per minute typing speed
	 * @param {number} stats.accuracy - Typing accuracy percentage (0-100)
	 * @param {number} stats.streak - Current daily practice streak
	 * @param {number} stats.totalWords - Total words typed across all sessions
	 * @param {number} stats.sessionsCompleted - Number of completed typing sessions
	 * @param {Record<string, number>} stats.contentBySource - Words typed by content source
	 * @returns {Achievement[]} Array of newly unlocked achievements
	 * @example
	 * const newAchievements = model.checkAchievements({
	 *   wpm: 35,
	 *   accuracy: 96,
	 *   streak: 8,
	 *   totalWords: 1500,
	 *   sessionsCompleted: 12,
	 *   contentBySource: { pokemon: 5, nintendo: 3 }
	 * });
	 *
	 * if (newAchievements.length > 0) {
	 *   console.log(`Unlocked ${newAchievements.length} new achievements!`);
	 * }
	 * @see {@link Achievement} for achievement structure
	 * @since 1.0.0
	 */
	checkAchievements(stats: {
		wpm: number;
		accuracy: number;
		streak: number;
		totalWords: number;
		sessionsCompleted: number;
		contentBySource: Record<string, number>;
	}): Achievement[] {
		const newAchievements: Achievement[] = [];
		const existingIds = new Set(this._progress.milestonesReached.map((a) => a.id));

		// Check WPM achievements
		if (stats.wpm >= 50 && !existingIds.has('speed_demon')) {
			newAchievements.push(this.createAchievement('speed_demon'));
		}
		if (stats.wpm >= 30 && !existingIds.has('lightning_fingers')) {
			newAchievements.push(this.createAchievement('lightning_fingers'));
		}

		// Check accuracy achievements
		if (stats.accuracy >= 99 && !existingIds.has('perfectionist')) {
			newAchievements.push(this.createAchievement('perfectionist'));
		}
		if (stats.accuracy >= 95 && !existingIds.has('sharp_shooter')) {
			newAchievements.push(this.createAchievement('sharp_shooter'));
		}

		// Check streak achievements
		if (stats.streak >= 30 && !existingIds.has('month_master')) {
			newAchievements.push(this.createAchievement('month_master'));
		}
		if (stats.streak >= 7 && !existingIds.has('week_warrior')) {
			newAchievements.push(this.createAchievement('week_warrior'));
		}

		// Check word count achievements
		if (stats.totalWords >= 10000 && !existingIds.has('typing_champion')) {
			newAchievements.push(this.createAchievement('typing_champion'));
		}
		if (stats.totalWords >= 1000 && !existingIds.has('word_collector')) {
			newAchievements.push(this.createAchievement('word_collector'));
		}

		// Add new achievements
		this._progress.milestonesReached.push(...newAchievements);

		// Update total rewards
		const pointsEarned = newAchievements.reduce((sum, achievement) => {
			return sum + ACHIEVEMENT_SETTINGS.achievementPointValues[achievement.rarity];
		}, 0);
		this._progress.totalRewards += pointsEarned;

		return newAchievements;
	}

	/**
	 * Create an achievement object from a predefined achievement definition.
	 * Converts the definition into a complete Achievement with current timestamp.
	 *
	 * @private
	 * @param {keyof typeof ACHIEVEMENT_DEFINITIONS} achievementId - ID of achievement to create
	 * @returns {Achievement} Complete achievement object with metadata
	 * @example
	 * // Internal use only
	 * const achievement = this.createAchievement('speed_demon');
	 * @see {@link ACHIEVEMENT_DEFINITIONS} for available achievements
	 * @since 1.0.0
	 */
	private createAchievement(achievementId: keyof typeof ACHIEVEMENT_DEFINITIONS): Achievement {
		const definition = ACHIEVEMENT_DEFINITIONS[achievementId];
		return {
			id: definition.id,
			title: definition.title,
			description: definition.description,
			icon: `achievement-${achievementId}`,
			points: ACHIEVEMENT_SETTINGS.achievementPointValues[definition.rarity],
			rarity: definition.rarity,
			dateEarned: new Date()
		};
	}

	/**
	 * Check for new Typingotchi accessory unlocks based on player statistics.
	 * Awards accessories like hats, collars, toys, and backgrounds when conditions are met.
	 *
	 * @param {object} stats - Current player statistics for unlock checking
	 * @param {number} stats.wpm - Words per minute typing speed
	 * @param {number} stats.accuracy - Typing accuracy percentage (0-100)
	 * @param {number} stats.streak - Current daily practice streak
	 * @param {number} stats.totalWords - Total words typed across all sessions
	 * @param {number} stats.sessionsCompleted - Number of completed typing sessions
	 * @param {number} stats.achievementCount - Total achievements unlocked
	 * @param {Record<string, number>} stats.contentBySource - Sessions by content source
	 * @returns {Accessory[]} Array of newly unlocked accessories
	 * @example
	 * const newAccessories = model.checkAccessoryUnlocks({
	 *   wpm: 26,
	 *   accuracy: 94,
	 *   streak: 4,
	 *   totalWords: 600,
	 *   sessionsCompleted: 8,
	 *   achievementCount: 3,
	 *   contentBySource: { pokemon: 2 }
	 * });
	 *
	 * newAccessories.forEach(accessory => {
	 *   console.log(`Unlocked ${accessory.name} for your Typingotchi!`);
	 * });
	 * @see {@link Accessory} for accessory structure
	 * @see {@link ACCESSORY_DEFINITIONS} for available accessories
	 * @since 1.0.0
	 */
	checkAccessoryUnlocks(stats: {
		wpm: number;
		accuracy: number;
		streak: number;
		totalWords: number;
		sessionsCompleted: number;
		achievementCount: number;
		contentBySource: Record<string, number>;
	}): Accessory[] {
		const newAccessories: Accessory[] = [];
		const existingIds = new Set(this._progress.unlockedAccessories.map((a) => a.id));

		Object.values(ACCESSORY_DEFINITIONS).forEach((accessoryDef) => {
			if (existingIds.has(accessoryDef.id)) return;

			let shouldUnlock = false;
			let condition = '';

			// Parse unlock conditions
			switch (accessoryDef.unlockCondition) {
				case 'first_session':
					shouldUnlock = stats.sessionsCompleted >= 1;
					condition = 'Complete your first typing session';
					break;
				case 'wpm_25':
					shouldUnlock = stats.wpm >= 25;
					condition = 'Achieve 25+ WPM';
					break;
				case 'accuracy_95':
					shouldUnlock = stats.accuracy >= 95;
					condition = 'Achieve 95%+ accuracy';
					break;
				case 'streak_3':
					shouldUnlock = stats.streak >= 3;
					condition = 'Practice for 3 days in a row';
					break;
				case 'streak_14':
					shouldUnlock = stats.streak >= 14;
					condition = 'Practice for 14 days in a row';
					break;
				case 'words_500':
					shouldUnlock = stats.totalWords >= 500;
					condition = 'Type 500 words total';
					break;
				case 'achievement_10':
					shouldUnlock = stats.achievementCount >= 10;
					condition = 'Unlock 10 achievements';
					break;
				case 'pokemon_content_10':
					shouldUnlock = (stats.contentBySource.pokemon || 0) >= 10;
					condition = 'Complete 10 Pokemon content sessions';
					break;
				case 'nintendo_content_10':
					shouldUnlock = (stats.contentBySource.nintendo || 0) >= 10;
					condition = 'Complete 10 Nintendo content sessions';
					break;
			}

			if (shouldUnlock) {
				newAccessories.push({
					id: accessoryDef.id,
					name: accessoryDef.name,
					category: accessoryDef.category,
					unlockCondition: condition,
					dateUnlocked: new Date(),
					equipped: false
				});
			}
		});

		// Add new accessories
		this._progress.unlockedAccessories.push(...newAccessories);

		return newAccessories;
	}

	/**
	 * Manually unlock a specific achievement by ID.
	 * Used for testing or special events where achievements are awarded directly.
	 *
	 * @param {string} achievementId - Unique identifier of achievement to unlock
	 * @returns {UnlockResult} Result object with success status and unlock details
	 * @example
	 * const result = model.unlockAchievement('speed_demon');
	 * if (result.success) {
	 *   console.log(`Unlocked: ${result.achievement.title}`);
	 *   console.log(`Points awarded: ${result.pointsAwarded}`);
	 * }
	 * @see {@link UnlockResult} for result structure
	 * @since 1.0.0
	 */
	unlockAchievement(achievementId: string): UnlockResult {
		const existingAchievement = this._progress.milestonesReached.find(
			(a) => a.id === achievementId
		);
		if (existingAchievement) {
			return {
				success: false,
				achievement: existingAchievement,
				accessoriesUnlocked: [],
				celebrationTriggered: false,
				pointsAwarded: 0
			};
		}

		// Create achievement (simplified - in real app would validate against definitions)
		const achievement: Achievement = {
			id: achievementId,
			title: `Achievement ${achievementId}`,
			description: `Unlocked ${achievementId}`,
			icon: `achievement-${achievementId}`,
			points: 25,
			rarity: 'common',
			dateEarned: new Date()
		};

		this._progress.milestonesReached.push(achievement);
		this._progress.totalRewards += achievement.points;

		// Queue celebration
		this.queueCelebration({
			type: 'milestone',
			title: `Achievement Unlocked: ${achievement.title}!`,
			message: `You've unlocked the ${achievement.title} achievement! +${achievement.points} points`,
			animation: 'bounce',
			duration: 3000,
			soundEffect: 'achievement-unlock',
			priority: 'high',
			autoTrigger: true
		});

		return {
			success: true,
			achievement,
			accessoriesUnlocked: [],
			celebrationTriggered: true,
			pointsAwarded: achievement.points
		};
	}

	/**
	 * Unlock a specific Typingotchi accessory by ID.
	 * Adds the accessory to the player's collection and queues a celebration.
	 *
	 * @param {string} accessoryId - Unique identifier of accessory to unlock
	 * @param {string} reason - Human-readable reason for unlocking
	 * @returns {boolean} True if successfully unlocked, false if already owned or invalid
	 * @example
	 * const unlocked = model.unlockAccessory('speed_helmet', 'Achieved 25+ WPM');
	 * if (unlocked) {
	 *   console.log('New accessory unlocked for your Typingotchi!');
	 * }
	 * @see {@link ACCESSORY_DEFINITIONS} for available accessories
	 * @since 1.0.0
	 */
	unlockAccessory(accessoryId: string, reason: string): boolean {
		const existingAccessory = this._progress.unlockedAccessories.find((a) => a.id === accessoryId);
		if (existingAccessory) {
			return false; // Already unlocked
		}

		const accessoryDef = Object.values(ACCESSORY_DEFINITIONS).find((def) => def.id === accessoryId);
		if (!accessoryDef) {
			return false; // Invalid accessory ID
		}

		const accessory: Accessory = {
			id: accessoryDef.id,
			name: accessoryDef.name,
			category: accessoryDef.category,
			unlockCondition: reason,
			dateUnlocked: new Date(),
			equipped: false
		};

		this._progress.unlockedAccessories.push(accessory);

		// Queue celebration
		this.queueCelebration({
			type: 'accessory',
			title: `New Accessory: ${accessory.name}!`,
			message: `Your Typingotchi can now wear the ${accessory.name}!`,
			animation: 'glow',
			duration: 2500,
			soundEffect: 'accessory-unlock',
			priority: 'medium',
			autoTrigger: true
		});

		return true;
	}

	/**
	 * Equip an accessory on the Typingotchi, unequipping others in the same category.
	 * Only one accessory per category can be equipped at a time.
	 *
	 * @param {string} accessoryId - ID of accessory to equip
	 * @returns {boolean} True if successfully equipped, false if not unlocked
	 * @example
	 * const equipped = model.equipAccessory('crown_of_accuracy');
	 * if (equipped) {
	 *   console.log('Typingotchi is now wearing the Crown of Accuracy!');
	 * }
	 * @see {@link AccessoryCategory} for equipment categories
	 * @since 1.0.0
	 */
	equipAccessory(accessoryId: string): boolean {
		const accessory = this._progress.unlockedAccessories.find((a) => a.id === accessoryId);
		if (!accessory) {
			return false; // Not unlocked
		}

		// Unequip other accessories in the same category
		this._progress.unlockedAccessories.forEach((acc) => {
			if (acc.category === accessory.category) {
				acc.equipped = false;
			}
		});

		// Equip the selected accessory
		accessory.equipped = true;
		return true;
	}

	/**
	 * Get all currently equipped accessories organized by category.
	 * Returns a record with one slot per accessory category.
	 *
	 * @returns {Record<AccessoryCategory, Accessory | null>} Equipped accessories by category
	 * @example
	 * const equipped = model.getEquippedAccessories();
	 * const currentHat = equipped.hat;
	 * const currentToy = equipped.toy;
	 *
	 * if (currentHat) {
	 *   console.log(`Typingotchi is wearing: ${currentHat.name}`);
	 * }
	 * @see {@link AccessoryCategory} for available categories
	 * @see {@link Accessory} for accessory structure
	 * @since 1.0.0
	 */
	getEquippedAccessories(): Record<AccessoryCategory, Accessory | null> {
		const equipped: Record<AccessoryCategory, Accessory | null> = {
			hat: null,
			collar: null,
			toy: null,
			background: null,
			glasses: null,
			bow: null
		};

		this._progress.unlockedAccessories.forEach((accessory) => {
			if (accessory.equipped) {
				equipped[accessory.category] = accessory;
			}
		});

		return equipped;
	}

	/**
	 * Queue a celebration event to be displayed to the player.
	 * Celebrations provide positive feedback for achievements and milestones.
	 *
	 * @param {Omit<CelebrationEvent, 'id'>} celebration - Celebration data without ID
	 * @returns {void}
	 * @example
	 * model.queueCelebration({
	 *   type: 'milestone',
	 *   title: 'Great Job!',
	 *   message: 'You completed your first lesson!',
	 *   animation: 'bounce',
	 *   duration: 2000,
	 *   soundEffect: 'cheer',
	 *   priority: 'medium',
	 *   autoTrigger: true
	 * });
	 * @see {@link CelebrationEvent} for event structure
	 * @since 1.0.0
	 */
	queueCelebration(celebration: Omit<CelebrationEvent, 'id'>): void {
		const event: CelebrationEvent = {
			id: `celebration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			...celebration
		};

		this._progress.celebrationsPending.push(event);

		// Limit queue size
		if (this._progress.celebrationsPending.length > ACHIEVEMENT_SETTINGS.maxCelebrationQueue) {
			this._progress.celebrationsPending.shift();
		}
	}

	/**
	 * Get the next celebration event from the queue to display.
	 * Returns the first celebration in the queue without removing it.
	 *
	 * @returns {CelebrationEvent | null} Next celebration to show, or null if queue empty
	 * @example
	 * const nextCelebration = model.getNextCelebration();
	 * if (nextCelebration) {
	 *   showCelebrationModal(nextCelebration);
	 *   model.markCelebrationShown(nextCelebration.id);
	 * }
	 * @see {@link CelebrationEvent} for event structure
	 * @since 1.0.0
	 */
	getNextCelebration(): CelebrationEvent | null {
		return this._progress.celebrationsPending.length > 0
			? this._progress.celebrationsPending[0]
			: null;
	}

	/**
	 * Mark a celebration as shown and remove it from the queue.
	 * Call this after displaying a celebration to the player.
	 *
	 * @param {string} celebrationId - Unique ID of the celebration to mark as shown
	 * @returns {boolean} True if celebration was found and removed, false otherwise
	 * @example
	 * const celebration = model.getNextCelebration();
	 * if (celebration) {
	 *   displayCelebration(celebration);
	 *   model.markCelebrationShown(celebration.id);
	 * }
	 * @since 1.0.0
	 */
	markCelebrationShown(celebrationId: string): boolean {
		const index = this._progress.celebrationsPending.findIndex((c) => c.id === celebrationId);
		if (index === -1) {
			return false;
		}

		this._progress.celebrationsPending.splice(index, 1);
		return true;
	}

	/**
	 * Update a personal best record if the new value exceeds the current record.
	 * Automatically calculates improvement percentage and queues celebrations for significant gains.
	 *
	 * @param {'wpm' | 'accuracy' | 'streak' | 'session_time' | 'words_total'} category - Category of record
	 * @param {number} value - New value to compare against current record
	 * @returns {boolean} True if new record was set, false if not improved
	 * @example
	 * const newRecord = model.updatePersonalBest('wpm', 42);
	 * if (newRecord) {
	 *   console.log('New WPM record set!');
	 * }
	 *
	 * // Check improvement
	 * const wpmRecord = model.personalBests.find(pb => pb.category === 'wpm');
	 * if (wpmRecord.improvementPercentage > 10) {
	 *   console.log('Significant improvement!');
	 * }
	 * @see {@link PersonalBest} for record structure
	 * @since 1.0.0
	 */
	updatePersonalBest(
		category: 'wpm' | 'accuracy' | 'streak' | 'session_time' | 'words_total',
		value: number
	): boolean {
		const existingBest = this._progress.personalBests.find((pb) => pb.category === category);

		if (existingBest) {
			if (value <= existingBest.value) {
				return false; // Not a new record
			}

			// Update existing record
			const previousBest = existingBest.value;
			existingBest.value = value;
			existingBest.dateAchieved = new Date();
			existingBest.previousBest = previousBest;
			existingBest.improvementPercentage = ((value - previousBest) / previousBest) * 100;
		} else {
			// Create new record
			this._progress.personalBests.push({
				category,
				value,
				dateAchieved: new Date(),
				improvementPercentage: 0
			});
		}

		// Queue celebration for significant improvements
		if (existingBest && existingBest.improvementPercentage > 10) {
			this.queueCelebration({
				type: 'personal_best',
				title: `New Personal Best: ${category}!`,
				message: `Amazing improvement! You've beaten your previous best by ${existingBest.improvementPercentage.toFixed(1)}%`,
				animation: 'spin',
				duration: 2000,
				soundEffect: 'personal-best',
				priority: 'medium',
				autoTrigger: true
			});
		}

		return true;
	}

	/**
	 * Create new weekly goals for the current week.
	 * Replaces any existing goals for the current week with the new set.
	 *
	 * @param {Array<object>} goals - Array of goal definitions
	 * @param {string} goals[].title - Short title for the goal
	 * @param {string} goals[].description - Detailed description of what to achieve
	 * @param {number} goals[].targetValue - Target value to reach for completion
	 * @returns {void}
	 * @example
	 * model.createWeeklyGoals([
	 *   {
	 *     title: 'Speed Builder',
	 *     description: 'Reach 25 WPM in any session',
	 *     targetValue: 25
	 *   },
	 *   {
	 *     title: 'Consistency Champion',
	 *     description: 'Practice 5 days this week',
	 *     targetValue: 5
	 *   }
	 * ]);
	 * @see {@link WeeklyGoal} for goal structure
	 * @since 1.0.0
	 */
	createWeeklyGoals(
		goals: Array<{
			title: string;
			description: string;
			targetValue: number;
		}>
	): void {
		const weekStart = this.getStartOfWeek(new Date());

		// Clear existing goals for this week
		this._progress.weeklyGoals = this._progress.weeklyGoals.filter(
			(goal) => goal.weekStartDate < weekStart
		);

		// Add new goals
		goals.forEach((goalData) => {
			this._progress.weeklyGoals.push({
				id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				title: goalData.title,
				description: goalData.description,
				targetValue: goalData.targetValue,
				currentProgress: 0,
				weekStartDate: weekStart,
				completed: false
			});
		});
	}

	/**
	 * Update progress on a specific weekly goal.
	 * Automatically marks goal as completed when target is reached and queues celebration.
	 *
	 * @param {string} goalId - Unique identifier of the goal to update
	 * @param {number} progress - Current progress value
	 * @returns {boolean} True if goal was found and updated, false otherwise
	 * @example
	 * const goals = model.getCurrentWeeklyGoals();
	 * const speedGoal = goals.find(g => g.title === 'Speed Builder');
	 *
	 * if (speedGoal) {
	 *   const updated = model.updateWeeklyGoalProgress(speedGoal.id, 27);
	 *   if (updated && speedGoal.completed) {
	 *     console.log('Goal completed!');
	 *   }
	 * }
	 * @see {@link WeeklyGoal} for goal structure
	 * @since 1.0.0
	 */
	updateWeeklyGoalProgress(goalId: string, progress: number): boolean {
		const goal = this._progress.weeklyGoals.find((g) => g.id === goalId);
		if (!goal) {
			return false;
		}

		goal.currentProgress = Math.max(0, progress);

		// Check if goal is completed
		if (!goal.completed && goal.currentProgress >= goal.targetValue) {
			goal.completed = true;

			// Queue celebration
			this.queueCelebration({
				type: 'milestone',
				title: `Weekly Goal Complete: ${goal.title}!`,
				message: `Congratulations! You've completed your weekly goal: ${goal.description}`,
				animation: 'bounce',
				duration: 2500,
				soundEffect: 'goal-complete',
				priority: 'high',
				autoTrigger: true
			});
		}

		return true;
	}

	/**
	 * Get all weekly goals for the current week (Monday to Sunday).
	 * Filters all goals to return only those for the current week period.
	 *
	 * @returns {WeeklyGoal[]} Array of current week's goals
	 * @example
	 * const currentGoals = model.getCurrentWeeklyGoals();
	 * const completedGoals = currentGoals.filter(goal => goal.completed);
	 * const remainingGoals = currentGoals.filter(goal => !goal.completed);
	 *
	 * console.log(`${completedGoals.length}/${currentGoals.length} goals completed`);
	 * @see {@link WeeklyGoal} for goal structure
	 * @since 1.0.0
	 */
	getCurrentWeeklyGoals(): WeeklyGoal[] {
		const weekStart = this.getStartOfWeek(new Date());
		return this._progress.weeklyGoals.filter(
			(goal) => goal.weekStartDate.getTime() === weekStart.getTime()
		);
	}

	/**
	 * Calculate the start of the week (Monday) for a given date.
	 * Used internally for weekly goal management and date calculations.
	 *
	 * @private
	 * @param {Date} date - Date to find the week start for
	 * @returns {Date} Date object representing Monday of that week at 00:00:00
	 * @example
	 * // Internal use only
	 * const weekStart = this.getStartOfWeek(new Date());
	 * @since 1.0.0
	 */
	private getStartOfWeek(date: Date): Date {
		const d = new Date(date);
		const day = d.getDay();
		const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
		d.setDate(diff);
		d.setHours(0, 0, 0, 0);
		return d;
	}

	/**
	 * Get comprehensive statistics about the player's achievement progress.
	 * Provides overview data for progress displays and analytics.
	 *
	 * @returns {object} Achievement statistics object
	 * @returns {number} returns.totalAchievements - Total number of achievements unlocked
	 * @returns {number} returns.totalPoints - Total points earned from achievements
	 * @returns {Record<string, number>} returns.byRarity - Achievement count by rarity level
	 * @returns {Achievement[]} returns.recentAchievements - Achievements from last 7 days
	 * @returns {number} returns.completionPercentage - Percentage of all achievements unlocked
	 * @example
	 * const stats = model.getAchievementStatistics();
	 * console.log(`Progress: ${stats.completionPercentage}% (${stats.totalAchievements} unlocked)`);
	 * console.log(`Points: ${stats.totalPoints}`);
	 * console.log(`Recent: ${stats.recentAchievements.length} this week`);
	 *
	 * // Show rarity breakdown
	 * Object.entries(stats.byRarity).forEach(([rarity, count]) => {
	 *   console.log(`${rarity}: ${count}`);
	 * });
	 * @see {@link Achievement} for achievement structure
	 * @since 1.0.0
	 */
	getAchievementStatistics(): {
		totalAchievements: number;
		totalPoints: number;
		byRarity: Record<string, number>;
		recentAchievements: Achievement[];
		completionPercentage: number;
	} {
		const totalDefinitions = Object.keys(ACHIEVEMENT_DEFINITIONS).length;
		const byRarity: Record<string, number> = { common: 0, rare: 0, epic: 0, legendary: 0 };

		this._progress.milestonesReached.forEach((achievement) => {
			byRarity[achievement.rarity] = (byRarity[achievement.rarity] || 0) + 1;
		});

		// Get recent achievements (last 7 days)
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
		const recentAchievements = this._progress.milestonesReached.filter(
			(achievement) => achievement.dateEarned >= sevenDaysAgo
		);

		return {
			totalAchievements: this._progress.milestonesReached.length,
			totalPoints: this._progress.milestonesReached.reduce((sum, a) => sum + a.points, 0),
			byRarity,
			recentAchievements,
			completionPercentage: Math.round(
				(this._progress.milestonesReached.length / totalDefinitions) * 100
			)
		};
	}

	/**
	 * Export the current progress data for persistence to storage.
	 * Returns a plain object suitable for JSON serialization.
	 *
	 * @returns {AchievementProgress} Plain object representation of progress
	 * @example
	 * const progressData = model.toJSON();
	 * localStorage.setItem('achievement-progress', JSON.stringify(progressData));
	 * @since 1.0.0
	 */
	toJSON(): AchievementProgress {
		return { ...this._progress };
	}

	/**
	 * Create an AchievementProgressModel instance from persisted JSON data.
	 * Handles date deserialization and data validation.
	 *
	 * @static
	 * @param {unknown} data - Raw data from storage (JSON parsed)
	 * @returns {AchievementProgressModel} New model instance with restored data
	 * @throws {Error} When data is invalid or corrupted
	 * @example
	 * const savedData = JSON.parse(localStorage.getItem('achievement-progress'));
	 * const model = AchievementProgressModel.fromJSON(savedData);
	 *
	 * // Handle missing data
	 * try {
	 *   const model = AchievementProgressModel.fromJSON(data);
	 * } catch (error) {
	 *   console.error('Failed to load progress:', error);
	 *   const model = new AchievementProgressModel(); // Fresh start
	 * }
	 * @since 1.0.0
	 */
	static fromJSON(data: unknown): AchievementProgressModel {
		if (!data || typeof data !== 'object') {
			throw new Error('Invalid achievement progress data');
		}

		const dataObj = data as Record<string, unknown>;

		// Convert date strings back to Date objects
		const convertDates = (items: Record<string, unknown>[]) => {
			items.forEach((item) => {
				if (item.dateEarned && typeof item.dateEarned === 'string') {
					item.dateEarned = new Date(item.dateEarned);
				}
				if (item.dateUnlocked && typeof item.dateUnlocked === 'string') {
					item.dateUnlocked = new Date(item.dateUnlocked);
				}
				if (item.dateAchieved && typeof item.dateAchieved === 'string') {
					item.dateAchieved = new Date(item.dateAchieved);
				}
				if (item.weekStartDate && typeof item.weekStartDate === 'string') {
					item.weekStartDate = new Date(item.weekStartDate);
				}
			});
		};

		if (dataObj.milestonesReached && Array.isArray(dataObj.milestonesReached)) {
			convertDates(dataObj.milestonesReached as Record<string, unknown>[]);
		}
		if (dataObj.unlockedAccessories && Array.isArray(dataObj.unlockedAccessories)) {
			convertDates(dataObj.unlockedAccessories as Record<string, unknown>[]);
		}
		if (dataObj.personalBests && Array.isArray(dataObj.personalBests)) {
			convertDates(dataObj.personalBests as Record<string, unknown>[]);
		}
		if (dataObj.weeklyGoals && Array.isArray(dataObj.weeklyGoals)) {
			convertDates(dataObj.weeklyGoals as Record<string, unknown>[]);
		}

		return new AchievementProgressModel(dataObj as unknown as AchievementProgress);
	}

	/**
	 * Validate the current state of achievement progress data.
	 * Checks for data integrity issues and constraint violations.
	 *
	 * @returns {object} Validation result
	 * @returns {boolean} returns.isValid - True if all validations pass
	 * @returns {string[]} returns.errors - Array of validation error messages
	 * @example
	 * const validation = model.validateState();
	 * if (!validation.isValid) {
	 *   console.error('Progress data has issues:');
	 *   validation.errors.forEach(error => console.error(`- ${error}`));
	 * }
	 *
	 * // Use for debugging or data migration
	 * if (validation.isValid) {
	 *   saveProgressData(model.toJSON());
	 * } else {
	 *   reportDataCorruption(validation.errors);
	 * }
	 * @since 1.0.0
	 */
	validateState(): { isValid: boolean; errors: string[] } {
		const errors: string[] = [];

		if (!this._progress.userId || typeof this._progress.userId !== 'string') {
			errors.push('User ID is required and must be a string');
		}

		if (!Array.isArray(this._progress.unlockedAccessories)) {
			errors.push('Unlocked accessories must be an array');
		}

		if (!Array.isArray(this._progress.milestonesReached)) {
			errors.push('Milestones reached must be an array');
		}

		if (!Array.isArray(this._progress.celebrationsPending)) {
			errors.push('Celebrations pending must be an array');
		}

		if (this._progress.totalRewards < 0) {
			errors.push('Total rewards cannot be negative');
		}

		// Validate accessory uniqueness
		const accessoryIds = this._progress.unlockedAccessories.map((a) => a.id);
		if (new Set(accessoryIds).size !== accessoryIds.length) {
			errors.push('Duplicate accessories found');
		}

		// Validate achievement uniqueness
		const achievementIds = this._progress.milestonesReached.map((a) => a.id);
		if (new Set(achievementIds).size !== achievementIds.length) {
			errors.push('Duplicate achievements found');
		}

		return {
			isValid: errors.length === 0,
			errors
		};
	}
}
