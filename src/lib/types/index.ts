export enum EvolutionForm {
	EGG = 1,
	BABY = 2,
	CHILD = 3,
	TEEN = 4,
	ADULT = 5
}

export enum EmotionalState {
	HAPPY = 'happy',
	CONTENT = 'content',
	HUNGRY = 'hungry',
	SAD = 'sad',
	EXCITED = 'excited',
	EATING = 'eating'
}

export enum ContentSource {
	POKEMON = 'pokemon',
	NINTENDO = 'nintendo',
	ROBLOX = 'roblox'
}

export enum DifficultyLevel {
	BEGINNER = 'beginner',
	INTERMEDIATE = 'intermediate',
	ADVANCED = 'advanced'
}

export enum ThemeCategory {
	NEWS = 'news',
	CHARACTERS = 'characters',
	GAMES = 'games',
	EVENTS = 'events'
}

export type AccessoryCategory = 'hat' | 'collar' | 'toy' | 'background';
export type AnimationType = 'bounce' | 'spin' | 'glow' | 'shake' | 'float';
export type CelebrationType = 'evolution' | 'streak' | 'milestone' | 'accessory' | 'personal_best';
export type SessionId = string;
export type TimeSpan = 'day' | 'week' | 'month' | 'all';

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

export interface Milestone {
	type: 'wpm' | 'accuracy' | 'streak' | 'words';
	value: number;
	timestamp: Date;
	celebrated: boolean;
}

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
	milestones: Milestone[];
}

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

export interface Accessory {
	id: string;
	name: string;
	category: AccessoryCategory;
	unlockCondition: string;
	dateUnlocked: Date;
	equipped: boolean;
}

export interface Achievement {
	id: string;
	title: string;
	description: string;
	icon: string;
	points: number;
	rarity: 'common' | 'rare' | 'epic' | 'legendary';
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

export interface AchievementProgress {
	userId: string;
	unlockedAccessories: Accessory[];
	milestonesReached: Achievement[];
	celebrationsPending: CelebrationEvent[];
	weeklyGoals: WeeklyGoal[];
	personalBests: PersonalBest[];
	totalRewards: number;
}

export interface ContentCriteria {
	source?: ContentSource;
	difficulty?: DifficultyLevel;
	theme?: ThemeCategory;
	maxWords?: number;
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

export interface SessionSummary {
	sessionId: string;
	duration: number;
	wordsPerMinute: number;
	accuracyPercentage: number;
	totalCharacters: number;
	errorsCount: number;
	improvementFromLastSession: number;
	milestonesAchieved: Milestone[];
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

export interface KeyAnalysis {
	key: string;
	errorRate: number;
	attempts: number;
	improvementTrend: 'improving' | 'stable' | 'declining';
	practiceRecommendation: string;
}

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
	trackMilestones(): Promise<Milestone[]>;
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
	checkMilestones(progress: UserProgress): Promise<Milestone[]>;
	getPersonalBests(): Promise<PersonalBest[]>;
	updatePersonalBest(category: string, value: number): Promise<boolean>;
}
