/**
 * AchievementProgress Model with Unlock Logic
 *
 * Tracks unlocked achievements, accessories, and milestone celebrations
 * with comprehensive unlock conditions and progress tracking.
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

export class AchievementProgressModel {
	private _progress: AchievementProgress;

	constructor(progress: Partial<AchievementProgress> = {}) {
		this._progress = this.validateAndNormalize(progress);
	}

	/**
	 * Get current achievement progress
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
	 * Get specific properties
	 */
	get userId(): string {
		return this._progress.userId;
	}

	get unlockedAccessories(): Accessory[] {
		return [...this._progress.unlockedAccessories];
	}

	get milestonesReached(): Achievement[] {
		return [...this._progress.milestonesReached];
	}

	get celebrationsPending(): CelebrationEvent[] {
		return [...this._progress.celebrationsPending];
	}

	get weeklyGoals(): WeeklyGoal[] {
		return [...this._progress.weeklyGoals];
	}

	get personalBests(): PersonalBest[] {
		return [...this._progress.personalBests];
	}

	get totalRewards(): number {
		return this._progress.totalRewards;
	}

	/**
	 * Validate and normalize achievement progress data
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
	 * Check for new achievements based on current stats
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
	 * Create achievement object from definition
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
	 * Check for new accessory unlocks
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
	 * Unlock specific achievement manually
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
	 * Unlock accessory
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
	 * Equip accessory (unequip others in same category)
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
	 * Get equipped accessories by category
	 */
	getEquippedAccessories(): Record<AccessoryCategory, Accessory | null> {
		const equipped: Record<AccessoryCategory, Accessory | null> = {
			hat: null,
			collar: null,
			toy: null,
			background: null
		};

		this._progress.unlockedAccessories.forEach((accessory) => {
			if (accessory.equipped) {
				equipped[accessory.category] = accessory;
			}
		});

		return equipped;
	}

	/**
	 * Queue celebration event
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
	 * Get next celebration to show
	 */
	getNextCelebration(): CelebrationEvent | null {
		return this._progress.celebrationsPending.length > 0
			? this._progress.celebrationsPending[0]
			: null;
	}

	/**
	 * Mark celebration as shown and remove from queue
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
	 * Update personal best record
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
	 * Create weekly goals
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
	 * Update weekly goal progress
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
	 * Get current week's goals
	 */
	getCurrentWeeklyGoals(): WeeklyGoal[] {
		const weekStart = this.getStartOfWeek(new Date());
		return this._progress.weeklyGoals.filter(
			(goal) => goal.weekStartDate.getTime() === weekStart.getTime()
		);
	}

	/**
	 * Get start of week (Monday)
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
	 * Get achievement statistics
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
	 * Export progress for persistence
	 */
	toJSON(): AchievementProgress {
		return { ...this._progress };
	}

	/**
	 * Create instance from persisted data
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
	 * Validate achievement progress state
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
