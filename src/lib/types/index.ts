/**
 * Evolution stages for the Typingotchi virtual pet.
 * Pet evolves through these forms based on correct words typed.
 *
 * @enum {number}
 * @example
 * const currentForm = EvolutionForm.BABY; // 2
 * const isAdult = pet.evolutionForm === EvolutionForm.ADULT;
 * @since 1.0.0
 */
export enum EvolutionForm {
	/** Starting form - requires 100 words to evolve */
	EGG = 1,
	/** First evolution - requires 500 words to evolve */
	BABY = 2,
	/** Second evolution - requires 1500 words to evolve */
	CHILD = 3,
	/** Third evolution - requires 5000 words to evolve */
	TEEN = 4,
	/** Final evolution form */
	ADULT = 5
}

/**
 * Emotional states for the Typingotchi pet based on happiness level and actions.
 * Determines pet animations and visual feedback to the user.
 *
 * @enum {string}
 * @example
 * const petMood = EmotionalState.HAPPY;
 * if (petMood === EmotionalState.HUNGRY) {
 *   showFeedingPrompt();
 * }
 * @since 1.0.0
 */
export enum EmotionalState {
	/** High happiness level (80-100%) */
	HAPPY = 'happy',
	/** Medium happiness level (60-79%) */
	CONTENT = 'content',
	/** Low happiness level (40-59%) - needs feeding */
	HUNGRY = 'hungry',
	/** Very low happiness level (0-39%) */
	SAD = 'sad',
	/** Very high happiness level (95-100%) */
	EXCITED = 'excited',
	/** Temporary state when consuming correct words */
	EATING = 'eating'
}

/**
 * Gaming franchise sources for child-friendly typing content.
 * Each source provides themed content appropriate for kids aged 7-12.
 *
 * @enum {string}
 * @example
 * const pokemonContent = ContentSource.POKEMON;
 * const contentItems = await getContentBySource(ContentSource.NINTENDO);
 * @since 1.0.0
 */
export enum ContentSource {
	/** Pokemon franchise content - characters, moves, items */
	POKEMON = 'pokemon',
	/** Nintendo game content - Mario, Zelda, Animal Crossing */
	NINTENDO = 'nintendo',
	/** Roblox platform content - games, avatars, experiences */
	ROBLOX = 'roblox'
}

/**
 * Difficulty levels for typing content and user skill classification.
 * Automatically determined based on text complexity and user performance.
 *
 * @enum {string}
 * @example
 * const userLevel = DifficultyLevel.INTERMEDIATE;
 * const suitableContent = filterByDifficulty(DifficultyLevel.BEGINNER);
 * @since 1.0.0
 */
export enum DifficultyLevel {
	/** Simple words and short sentences (10-50 words, 15 WPM target) */
	BEGINNER = 'beginner',
	/** Mixed vocabulary and longer text (30-100 words, 25 WPM target) */
	INTERMEDIATE = 'intermediate',
	/** Complex terms and detailed content (60-200 words, 35 WPM target) */
	ADVANCED = 'advanced'
}

/**
 * Thematic categories for organizing content by topic.
 * Provides variety in practice sessions and aligns with gaming interests.
 *
 * @enum {string}
 * @example
 * const characterStories = ThemeCategory.CHARACTERS;
 * const gameContent = await filterByTheme(ThemeCategory.GAMES);
 * @since 1.0.0
 */
export enum ThemeCategory {
	/** News and updates from gaming worlds */
	NEWS = 'news',
	/** Character descriptions and stories */
	CHARACTERS = 'characters',
	/** Game mechanics and features */
	GAMES = 'games',
	/** Special events and celebrations */
	EVENTS = 'events'
}

/**
 * Categories of accessories that can be equipped on the Typingotchi.
 * Each category allows only one equipped item at a time.
 *
 * @typedef {string} AccessoryCategory
 * @example
 * const hatCategory: AccessoryCategory = 'hat';
 * const currentHat = getEquippedAccessory('hat');
 */
export type AccessoryCategory = 'hat' | 'collar' | 'toy' | 'background' | 'glasses' | 'bow';

/**
 * Animation types for celebration events and pet interactions.
 * Used to provide visual feedback during achievements and milestones.
 *
 * @typedef {string} AnimationType
 * @example
 * const celebrationAnim: AnimationType = 'bounce';
 * playAnimation(AnimationType.GLOW, 2000);
 */
export type AnimationType = 'bounce' | 'spin' | 'glow' | 'shake' | 'float';

/**
 * Types of celebration events that can be triggered in the game.
 * Each type has different visual and audio treatments.
 *
 * @typedef {string} CelebrationType
 * @example
 * const eventType: CelebrationType = 'milestone';
 * triggerCelebration('achievement', CelebrationType.EVOLUTION);
 */
export type CelebrationType = 'evolution' | 'streak' | 'milestone' | 'accessory' | 'personal_best';

/**
 * Unique identifier for typing practice sessions.
 * Used to track individual practice sessions and their progress.
 *
 * @typedef {string} SessionId
 * @example
 * const sessionId: SessionId = 'session-1234567890-abc';
 * const progress = getSessionProgress(sessionId);
 */
export type SessionId = string;

/**
 * Time period options for analytics and progress reporting.
 * Used to scope data queries and trend analysis.
 *
 * @typedef {string} TimeSpan
 * @example
 * const weeklyStats = getStats('week');
 * const allTimeRecord = getBestWPM('all');
 */
export type TimeSpan = 'day' | 'week' | 'month' | 'all';

/**
 * Represents a celebration event to be displayed to the user.
 * Celebrations provide positive feedback for achievements and progress milestones.
 *
 * @interface CelebrationEvent
 * @property {string} id - Unique identifier for the celebration
 * @property {CelebrationType} type - Type of celebration (evolution, streak, etc.)
 * @property {string} title - Short title for the celebration
 * @property {string} message - Detailed message explaining the achievement
 * @property {AnimationType} animation - Visual animation to play
 * @property {number} duration - How long to show the celebration (milliseconds)
 * @property {string} soundEffect - Audio effect identifier to play
 * @property {'low' | 'medium' | 'high'} priority - Display priority level
 * @property {boolean} autoTrigger - Whether to show automatically or wait for user
 * @example
 * const celebration: CelebrationEvent = {
 *   id: 'cel-123',
 *   type: 'milestone',
 *   title: 'Great Job!',
 *   message: 'You reached 25 WPM!',
 *   animation: 'bounce',
 *   duration: 3000,
 *   soundEffect: 'cheer',
 *   priority: 'high',
 *   autoTrigger: true
 * };
 * @since 1.0.0
 */
export interface CelebrationEvent {
	id: string;
	type: CelebrationType;
	title: string;
	message: string;
	animation: AnimationType;
	duration: number;
	soundEffect: string;
	priority: 'low' | 'medium' | 'high';
	autoTrigger: boolean;
}

/**
 * Complete state information for the Typingotchi virtual pet.
 * Tracks all pet-related data including evolution, happiness, and customization.
 *
 * @interface PetState
 * @property {string} id - Unique identifier for this pet instance
 * @property {string} name - Custom name given to the pet by the child
 * @property {EvolutionForm} evolutionForm - Current evolution stage (1-5)
 * @property {number} happinessLevel - Pet happiness level (0-100)
 * @property {EmotionalState} emotionalState - Current mood and animation state
 * @property {string[]} accessories - Array of equipped accessory IDs
 * @property {number} totalWordsEaten - Total correct words typed (drives evolution)
 * @property {number} accuracyAverage - Running average of typing accuracy
 * @property {Date} lastFeedTime - Timestamp of last correct word typed
 * @property {number} streakDays - Current consecutive practice days
 * @property {CelebrationEvent[]} celebrationQueue - Pending celebrations to show
 * @example
 * const petState: PetState = {
 *   id: 'pet-123',
 *   name: 'Buddy',
 *   evolutionForm: EvolutionForm.CHILD,
 *   happinessLevel: 85,
 *   emotionalState: EmotionalState.HAPPY,
 *   accessories: ['hat-001', 'toy-002'],
 *   totalWordsEaten: 750,
 *   accuracyAverage: 89.5,
 *   lastFeedTime: new Date(),
 *   streakDays: 12,
 *   celebrationQueue: []
 * };
 * @since 1.0.0
 */
export interface PetState {
	id: string;
	name: string;
	evolutionForm: EvolutionForm;
	happinessLevel: number;
	emotionalState: EmotionalState;
	accessories: string[];
	totalWordsEaten: number;
	accuracyAverage: number;
	lastFeedTime: Date;
	streakDays: number;
	celebrationQueue: CelebrationEvent[];
}

/**
 * Predefined milestone achievements for typing progress.
 * Each milestone represents a significant accomplishment in the learning journey.
 *
 * @enum {string}
 * @deprecated Use MilestoneData interface with dynamic values instead
 * @example
 * const milestone = Milestone.FIRST_EVOLUTION;
 * if (achievement === Milestone.WPM_30) {
 *   celebrateSpeedMilestone();
 * }
 * @since 1.0.0
 */
export enum Milestone {
	/** Pet evolved from EGG to BABY form */
	FIRST_EVOLUTION = 'First Evolution',
	/** Practiced for 7 consecutive days */
	WEEKLY_STREAK = 'Weekly Streak',
	/** Fed pet 100 correct words */
	WORDS_FED_100 = '100 Words Fed',
	/** Fed pet 500 correct words */
	WORDS_FED_500 = '500 Words Fed',
	/** Fed pet 1000 correct words */
	WORDS_FED_1000 = '1000 Words Fed',
	/** Achieved 90% typing accuracy */
	ACCURACY_90_PERCENT = '90% Accuracy',
	/** Achieved 95% typing accuracy */
	ACCURACY_95_PERCENT = '95% Accuracy',
	/** Reached 30 words per minute */
	WPM_30 = '30 WPM',
	/** Reached 50 words per minute */
	WPM_50 = '50 WPM',
	/** Reached 70 words per minute */
	WPM_70 = '70 WPM'
}

/**
 * Dynamic milestone data structure for tracking achievements.
 * Replaces the static Milestone enum with flexible milestone tracking.
 *
 * @interface MilestoneData
 * @property {'wpm' | 'accuracy' | 'streak' | 'words'} type - Category of milestone
 * @property {number} value - Threshold value achieved (e.g., 30 for 30 WPM)
 * @property {Date} timestamp - When the milestone was reached
 * @property {boolean} celebrated - Whether celebration was shown to user
 * @example
 * const milestone: MilestoneData = {
 *   type: 'wpm',
 *   value: 25,
 *   timestamp: new Date(),
 *   celebrated: false
 * };
 *
 * // Check for speed milestones
 * const speedMilestones = milestones.filter(m => m.type === 'wpm');
 * @since 1.0.0
 */
export interface MilestoneData {
	type: 'wpm' | 'accuracy' | 'streak' | 'words';
	value: number;
	timestamp: Date;
	celebrated: boolean;
}

/**
 * Complete progress data for a single typing practice session.
 * Captures all metrics needed for performance analysis and improvement tracking.
 *
 * @interface UserProgress
 * @property {string} sessionId - Unique identifier for this practice session
 * @property {Date} date - When the session took place
 * @property {number} duration - Session length in milliseconds
 * @property {number} wordsPerMinute - Calculated typing speed (chars/5/minutes)
 * @property {number} accuracyPercentage - Typing accuracy (0-100)
 * @property {number} totalCharacters - Total characters typed (correct + incorrect)
 * @property {number} correctCharacters - Number of correctly typed characters
 * @property {number} errorsCount - Number of typing errors made
 * @property {string} contentSource - Source of practice content (pokemon, nintendo, etc.)
 * @property {string} difficultyLevel - Difficulty level of content used
 * @property {string[]} challengingKeys - Keys with high error rates
 * @property {string[]} improvementAreas - Areas needing practice focus
 * @property {MilestoneData[]} milestones - Milestones achieved in this session
 * @example
 * const sessionProgress: UserProgress = {
 *   sessionId: 'session-123',
 *   date: new Date(),
 *   duration: 300000, // 5 minutes
 *   wordsPerMinute: 23.5,
 *   accuracyPercentage: 87.2,
 *   totalCharacters: 125,
 *   correctCharacters: 109,
 *   errorsCount: 16,
 *   contentSource: 'pokemon',
 *   difficultyLevel: 'intermediate',
 *   challengingKeys: ['q', 'z'],
 *   improvementAreas: ['accuracy'],
 *   milestones: []
 * };
 * @since 1.0.0
 */
export interface UserProgress {
	sessionId: string;
	date: Date;
	duration: number;
	wordsPerMinute: number;
	accuracyPercentage: number;
	totalCharacters: number;
	correctCharacters: number;
	errorsCount: number;
	contentSource: string;
	difficultyLevel: string;
	challengingKeys: string[];
	improvementAreas: string[];
	milestones: MilestoneData[];
}

/**
 * Practice streak data with child-friendly forgiveness mechanics.
 * Tracks daily practice consistency while providing encouraging features.
 *
 * @interface StreakData
 * @property {number} currentStreak - Current consecutive practice days
 * @property {number} longestStreak - Personal best streak record
 * @property {Date} lastPracticeDate - Date of most recent practice session
 * @property {number} forgivenessCredits - Available "forgiveness days" (0-3)
 * @property {number} totalPracticeDays - Total days practiced across all time
 * @property {Date} streakStartDate - When current streak began
 * @property {boolean} weekendBonusUsed - Whether weekend bonus was used this week
 * @property {Date | null} catchUpDeadline - Active catch-up window deadline
 * @example
 * const streakData: StreakData = {
 *   currentStreak: 12,
 *   longestStreak: 25,
 *   lastPracticeDate: new Date(),
 *   forgivenessCredits: 2,
 *   totalPracticeDays: 45,
 *   streakStartDate: new Date('2024-01-15'),
 *   weekendBonusUsed: false,
 *   catchUpDeadline: null
 * };
 * @since 1.0.0
 */
export interface StreakData {
	currentStreak: number;
	longestStreak: number;
	lastPracticeDate: Date;
	forgivenessCredits: number;
	totalPracticeDays: number;
	streakStartDate: Date;
	weekendBonusUsed: boolean;
	catchUpDeadline: Date | null;
}

/**
 * Typing practice content item from gaming sources.
 * Each item provides age-appropriate content for children to practice typing.
 *
 * @interface ContentItem
 * @property {string} id - Unique identifier for the content
 * @property {string} title - Display title for the content
 * @property {string} text - Actual text content for typing practice
 * @property {ContentSource} source - Gaming franchise source (Pokemon, Nintendo, etc.)
 * @property {DifficultyLevel} difficulty - Automatically assessed difficulty level
 * @property {ThemeCategory} theme - Thematic category (characters, games, etc.)
 * @property {number} wordCount - Number of words in the text
 * @property {number} estimatedWPM - Target typing speed for this content
 * @property {Date} dateAdded - When content was added to the system
 * @property {boolean} ageAppropriate - Whether content passed child safety filters
 * @property {boolean} specialChallenge - Whether this is a special challenge item
 * @example
 * const content: ContentItem = {
 *   id: 'content-001',
 *   title: 'Pikachu Adventure',
 *   text: 'Pikachu loves to explore the forest with friends...',
 *   source: ContentSource.POKEMON,
 *   difficulty: DifficultyLevel.BEGINNER,
 *   theme: ThemeCategory.CHARACTERS,
 *   wordCount: 35,
 *   estimatedWPM: 18,
 *   dateAdded: new Date(),
 *   ageAppropriate: true,
 *   specialChallenge: false
 * };
 * @since 1.0.0
 */
export interface ContentItem {
	id: string;
	title: string;
	text: string;
	source: ContentSource;
	difficulty: DifficultyLevel;
	theme: ThemeCategory;
	wordCount: number;
	estimatedWPM: number;
	dateAdded: Date;
	ageAppropriate: boolean;
	specialChallenge: boolean;
}

/**
 * Cosmetic accessory that can be equipped on the Typingotchi pet.
 * Accessories are unlocked through achievements and milestones.
 *
 * @interface Accessory
 * @property {string} id - Unique identifier for the accessory
 * @property {string} name - Display name of the accessory
 * @property {AccessoryCategory} category - Type of accessory (hat, collar, etc.)
 * @property {string} unlockCondition - Human-readable unlock requirement
 * @property {Date} dateUnlocked - When the accessory was unlocked
 * @property {boolean} equipped - Whether currently equipped on the pet
 * @example
 * const accessory: Accessory = {
 *   id: 'hat-crown',
 *   name: 'Crown of Accuracy',
 *   category: 'hat',
 *   unlockCondition: 'Achieve 95% accuracy',
 *   dateUnlocked: new Date(),
 *   equipped: true
 * };
 * @since 1.0.0
 */
export interface Accessory {
	id: string;
	name: string;
	category: AccessoryCategory;
	unlockCondition: string;
	dateUnlocked: Date;
	equipped: boolean;
}

/**
 * Rarity levels for achievements affecting point values and celebration intensity.
 * Higher rarity achievements provide more points and special celebrations.
 *
 * @typedef {string} AchievementRarity
 * @example
 * const rarity: AchievementRarity = 'epic';
 * const points = getPointsForRarity('legendary'); // 100 points
 */
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

/**
 * Achievement earned through typing performance and consistency.
 * Provides points and unlocks accessories for the virtual pet.
 *
 * @interface Achievement
 * @property {string} id - Unique identifier for the achievement
 * @property {string} title - Short, catchy title for display
 * @property {string} description - Detailed description of what was accomplished
 * @property {string} icon - Icon identifier for visual representation
 * @property {number} points - Point value based on rarity (10-100)
 * @property {AchievementRarity} rarity - Rarity level affecting rewards
 * @property {Date} dateEarned - When the achievement was unlocked
 * @example
 * const achievement: Achievement = {
 *   id: 'speed_demon',
 *   title: 'Speed Demon',
 *   description: 'Reached 50+ words per minute',
 *   icon: 'lightning-bolt',
 *   points: 50,
 *   rarity: 'epic',
 *   dateEarned: new Date()
 * };
 * @since 1.0.0
 */
export interface Achievement {
	id: string;
	title: string;
	description: string;
	icon: string;
	points: number;
	rarity: AchievementRarity;
	dateEarned: Date;
}

export interface WeeklyGoal {
	id: string;
	title: string;
	description: string;
	targetValue: number;
	currentProgress: number;
	weekStartDate: Date;
	completed: boolean;
}

export interface PersonalBest {
	category: 'wpm' | 'accuracy' | 'streak' | 'session_time' | 'words_total';
	value: number;
	dateAchieved: Date;
	previousBest?: number;
	improvementPercentage: number;
}

/**
 * Comprehensive achievement and progression data for a user.
 * Tracks all unlocked content, milestones, and reward progress.
 *
 * @interface AchievementProgress
 * @property {string} userId - Unique identifier for the user
 * @property {Accessory[]} unlockedAccessories - All accessories available to the user
 * @property {Achievement[]} milestonesReached - All achievements earned by the user
 * @property {CelebrationEvent[]} celebrationsPending - Celebrations waiting to be shown
 * @property {WeeklyGoal[]} weeklyGoals - Current and past weekly challenges
 * @property {PersonalBest[]} personalBests - User's record achievements by category
 * @property {number} totalRewards - Total points earned from all achievements
 * @example
 * const progress: AchievementProgress = {
 *   userId: 'user-123',
 *   unlockedAccessories: [hatAccessory, toyAccessory],
 *   milestonesReached: [speedAchievement, accuracyAchievement],
 *   celebrationsPending: [],
 *   weeklyGoals: [currentWeekGoals],
 *   personalBests: [wpmRecord, accuracyRecord],
 *   totalRewards: 275
 * };
 * @since 1.0.0
 */
export interface AchievementProgress {
	userId: string;
	unlockedAccessories: Accessory[];
	milestonesReached: Achievement[];
	celebrationsPending: CelebrationEvent[];
	weeklyGoals: WeeklyGoal[];
	personalBests: PersonalBest[];
	totalRewards: number;
}

/**
 * Filtering criteria for content selection and search.
 * Used to find appropriate typing content based on user preferences and skill level.
 *
 * @interface ContentCriteria
 * @property {ContentSource} [source] - Filter by gaming franchise
 * @property {DifficultyLevel} [difficulty] - Filter by difficulty level
 * @property {ThemeCategory} [theme] - Filter by content theme
 * @property {number} [maxWords] - Maximum word count allowed
 * @property {number} [minWords] - Minimum word count required
 * @property {boolean} [specialChallenge] - Include only special challenge content
 * @property {boolean} [excludeUsed] - Exclude previously completed content
 * @example
 * const criteria: ContentCriteria = {
 *   source: ContentSource.POKEMON,
 *   difficulty: DifficultyLevel.BEGINNER,
 *   maxWords: 50,
 *   excludeUsed: true
 * };
 *
 * const suitableContent = await filterContent(criteria);
 * @since 1.0.0
 */
export interface ContentCriteria {
	source?: ContentSource;
	difficulty?: DifficultyLevel;
	theme?: ThemeCategory;
	maxWords?: number;
	minWords?: number;
	specialChallenge?: boolean;
	excludeUsed?: boolean;
}

export interface CacheStatus {
	lastUpdate: Date;
	totalItems: number;
	sources: Record<ContentSource, number>;
	expiredItems: number;
}

export interface FeedingResult {
	wordAccepted: boolean;
	happinessChange: number;
	newEmotionalState: EmotionalState;
	evolutionTriggered: boolean;
	celebrationQueued: boolean;
}

export interface EvolutionResult {
	canEvolve: boolean;
	currentForm: EvolutionForm;
	nextForm?: EvolutionForm;
	wordsRequired: number;
	wordsToGo: number;
}

/**
 * Summary of a completed typing practice session.
 * Provides key metrics and achievements for session review and progress tracking.
 *
 * @interface SessionSummary
 * @property {string} sessionId - Unique identifier for the session
 * @property {number} duration - Total session time in milliseconds
 * @property {number} wordsPerMinute - Final typing speed achieved
 * @property {number} accuracyPercentage - Overall typing accuracy (0-100)
 * @property {number} totalCharacters - Total characters typed in session
 * @property {number} errorsCount - Number of typing errors made
 * @property {number} improvementFromLastSession - Change from previous session
 * @property {MilestoneData[]} milestonesAchieved - New milestones reached
 * @property {Record<string, object>} [contentBreakdown] - Performance by content type
 * @example
 * const summary: SessionSummary = {
 *   sessionId: 'session-456',
 *   duration: 600000, // 10 minutes
 *   wordsPerMinute: 28.5,
 *   accuracyPercentage: 91.2,
 *   totalCharacters: 485,
 *   errorsCount: 43,
 *   improvementFromLastSession: 2.3,
 *   milestonesAchieved: [wpmMilestone],
 *   contentBreakdown: {
 *     pokemon: { words: 120, accuracy: 93, timeSpent: 300000 }
 *   }
 * };
 * @since 1.0.0
 */
export interface SessionSummary {
	sessionId: string;
	duration: number;
	wordsPerMinute: number;
	accuracyPercentage: number;
	totalCharacters: number;
	errorsCount: number;
	improvementFromLastSession: number;
	milestonesAchieved: MilestoneData[];
	contentBreakdown?: Record<string, { words: number; accuracy: number; timeSpent: number }>;
}

export interface TrendData {
	date: Date;
	value: number;
	movingAverage: number;
}

export interface TypingTrends {
	wpmTrend: TrendData[];
	accuracyTrend: TrendData[];
	practiceTimeTrend: TrendData[];
	improvementRate: number;
}

/**
 * Analysis of individual key performance for targeted practice recommendations.
 * Identifies problematic keys and provides specific improvement guidance.
 *
 * @interface KeyAnalysis
 * @property {string} key - The keyboard character analyzed
 * @property {number} errorRate - Error percentage for this key (0-100)
 * @property {number} attempts - Total times this key was typed
 * @property {'improving' | 'stable' | 'declining'} improvementTrend - Performance trend
 * @property {string} practiceRecommendation - Specific advice for improvement
 * @example
 * const analysis: KeyAnalysis = {
 *   key: 'q',
 *   errorRate: 25.5,
 *   attempts: 47,
 *   improvementTrend: 'declining',
 *   practiceRecommendation: 'Focus on proper finger placement for the Q key'
 * };
 *
 * // Show practice recommendations for problematic keys
 * const problemKeys = keyAnalyses.filter(k => k.errorRate > 20);
 * @since 1.0.0
 */
export interface KeyAnalysis {
	key: string;
	errorRate: number;
	attempts: number;
	improvementTrend: 'improving' | 'stable' | 'declining';
	practiceRecommendation: string;
}

/**
 * Identified area for typing skill improvement with actionable recommendations.
 * Provides prioritized guidance for focused practice sessions.
 *
 * @interface ImprovementArea
 * @property {string} area - Name of the improvement area (e.g., 'Accuracy', 'Speed')
 * @property {string} description - Brief explanation of the issue
 * @property {'high' | 'medium' | 'low'} priority - Importance level for addressing
 * @property {string} recommendation - Specific action to take for improvement
 * @example
 * const improvement: ImprovementArea = {
 *   area: 'Typing Rhythm',
 *   description: 'Inconsistent typing pace with burst patterns',
 *   priority: 'medium',
 *   recommendation: 'Practice typing to a steady beat or metronome'
 * };
 *
 * // Display high-priority improvements first
 * const urgentAreas = improvements.filter(i => i.priority === 'high');
 * @since 1.0.0
 */
export interface ImprovementArea {
	area: string;
	description: string;
	priority: 'high' | 'medium' | 'low';
	recommendation: string;
}

export interface TimeRange {
	start: Date;
	end: Date;
	label: string;
}

export interface ProgressReport {
	timeRange: TimeRange;
	totalPracticeTime: number;
	averageWPM: number;
	averageAccuracy: number;
	sessionsCompleted: number;
	challengingAreas: string[];
	achievements: Achievement[];
	parentNotes: string[];
}

export interface ParentSummary {
	childName: string;
	totalPracticeTime: number;
	currentStreak: number;
	averageAccuracy: number;
	currentWPM: number;
	recentAchievements: Achievement[];
	areasNeedingFocus: string[];
	overallProgress: 'excellent' | 'good' | 'needs_improvement';
}

export interface UnlockResult {
	success: boolean;
	achievement: Achievement;
	accessoriesUnlocked: Accessory[];
	celebrationTriggered: boolean;
	pointsAwarded: number;
}

export interface ContentService {
	loadDailyContent(source?: ContentSource): Promise<ContentItem[]>;
	getContentByDifficulty(level: DifficultyLevel): Promise<ContentItem[]>;
	getSpecialChallenges(): Promise<ContentItem[]>;
	filterByTheme(theme: ThemeCategory): Promise<ContentItem[]>;
	getRandomContent(criteria: ContentCriteria): Promise<ContentItem>;
	refreshContentCache(): Promise<void>;
	getCacheStatus(): Promise<CacheStatus>;
	clearExpiredContent(): Promise<void>;
}

export interface PetStateService {
	loadPetState(): Promise<PetState>;
	savePetState(state: PetState): Promise<void>;
	resetPet(): Promise<PetState>;
	feedWord(word: string, isCorrect: boolean): Promise<FeedingResult>;
	updateHappiness(accuracyDelta: number): Promise<number>;
	triggerEmotionalState(state: EmotionalState, duration?: number): Promise<void>;
	checkEvolutionTrigger(): Promise<EvolutionResult>;
	evolveToNextForm(): Promise<EvolutionForm>;
	canEvolve(): Promise<boolean>;
	unlockAccessory(accessoryId: string): Promise<boolean>;
	equipAccessory(accessoryId: string, category: AccessoryCategory): Promise<void>;
	getAvailableAccessories(): Promise<Accessory[]>;
}

export interface ProgressTrackingService {
	startSession(contentId: string): Promise<SessionId>;
	recordKeypress(key: string, isCorrect: boolean, timestamp: number): Promise<void>;
	endSession(): Promise<SessionSummary>;
	calculateWPM(timespan?: TimeSpan): Promise<number>;
	calculateAccuracy(timespan?: TimeSpan): Promise<number>;
	getTypingTrends(days: number): Promise<TypingTrends>;
	identifyChallengingKeys(): Promise<KeyAnalysis[]>;
	getImprovementSuggestions(): Promise<ImprovementArea[]>;
	trackMilestones(): Promise<MilestoneData[]>;
	generateProgressReport(timeRange: TimeRange): Promise<ProgressReport>;
	getParentSummary(): Promise<ParentSummary>;
}

export interface AchievementService {
	checkAchievements(sessionData: SessionSummary): Promise<Achievement[]>;
	unlockAchievement(achievementId: string): Promise<UnlockResult>;
	getUnlockedAchievements(): Promise<Achievement[]>;
	queueCelebration(event: CelebrationEvent): Promise<void>;
	getNextCelebration(): Promise<CelebrationEvent | null>;
	markCelebrationShown(eventId: string): Promise<void>;
	unlockAccessory(accessoryId: string, reason: string): Promise<boolean>;
	getAvailableAccessories(): Promise<Accessory[]>;
	equipAccessory(accessoryId: string): Promise<void>;
	checkMilestones(progress: UserProgress): Promise<MilestoneData[]>;
	getPersonalBests(): Promise<PersonalBest[]>;
	updatePersonalBest(category: string, value: number): Promise<boolean>;
}
