# Data Model: Gamified Typing Trainer

**Feature**: 001-build-a-gamified
**Date**: 2025-01-21
**Storage**: IndexedDB + localStorage hybrid

## Entity Definitions

### 1. PetState

**Purpose**: Represents the current state and evolution of the user's Typingotchi pet

**Storage**: IndexedDB (`pet_states` store)

**Fields**:

```typescript
interface PetState {
	id: string; // Unique pet identifier
	name: string; // Pet name (user customizable)
	evolutionForm: EvolutionForm; // Current evolution stage (1-5)
	happinessLevel: number; // 0-100 happiness percentage
	emotionalState: EmotionalState; // Current mood/animation state
	accessories: string[]; // Unlocked accessories array
	totalWordsEaten: number; // Lifetime word consumption
	accuracyAverage: number; // Running accuracy percentage
	lastFeedTime: Date; // Last interaction timestamp
	streakDays: number; // Current consecutive practice days
	celebrationQueue: CelebrationEvent[]; // Pending celebrations
}

enum EvolutionForm {
	EGG = 1, // Starting form (0-100 words)
	BABY = 2, // First evolution (100-500 words)
	CHILD = 3, // Second evolution (500-1500 words)
	TEEN = 4, // Third evolution (1500-5000 words)
	ADULT = 5 // Final evolution (5000+ words)
}

enum EmotionalState {
	HAPPY = 'happy', // 90%+ accuracy, bouncing animation
	CONTENT = 'content', // 70-89% accuracy, walking animation
	HUNGRY = 'hungry', // 50-69% accuracy, slow movement
	SAD = 'sad', // <50% accuracy, sleeping animation
	EXCITED = 'excited', // Streak milestones, dancing animation
	EATING = 'eating' // Word consumption, chomping animation
}
```

**Validation Rules**:

- Happiness level must be 0-100
- Evolution form cannot regress (only advance)
- Accuracy average recalculated from last 100 sessions
- Emotional state derives from happiness + recent activity

**Relationships**:

- Links to UserProgress for accuracy calculations
- Links to AchievementProgress for accessory unlocks

### 2. UserProgress

**Purpose**: Tracks typing performance metrics and learning progression

**Storage**: IndexedDB (`user_progress` store)

**Fields**:

```typescript
interface UserProgress {
	sessionId: string; // Unique session identifier
	date: Date; // Practice session date
	duration: number; // Session length in milliseconds
	wordsPerMinute: number; // Final WPM for session
	accuracyPercentage: number; // Correct characters / total characters
	totalCharacters: number; // Characters attempted in session
	correctCharacters: number; // Characters typed correctly
	errorsCount: number; // Total typing errors
	contentSource: string; // pokemon/nintendo/roblox
	difficultyLevel: string; // beginner/intermediate/advanced
	challengingKeys: string[]; // Keys with >20% error rate
	improvementAreas: string[]; // Suggested focus areas
	milestones: Milestone[]; // Achievements reached this session
}

interface Milestone {
	type: 'wpm' | 'accuracy' | 'streak' | 'words';
	value: number; // Milestone value achieved
	timestamp: Date; // When milestone was reached
	celebrated: boolean; // Whether celebration was shown
}
```

**Validation Rules**:

- WPM must be 0-200 (reasonable bounds for children)
- Accuracy percentage must be 0-100
- Duration must be positive
- Challenging keys identified from error patterns

**Relationships**:

- Feeds into PetState happiness calculations
- Links to StreakData for consecutive day tracking

### 3. StreakData

**Purpose**: Manages daily practice streaks with forgiveness mechanics

**Storage**: localStorage (`streak_data` key)

**Fields**:

```typescript
interface StreakData {
	currentStreak: number; // Current consecutive days
	longestStreak: number; // Personal best streak
	lastPracticeDate: Date; // Last practice session date
	forgivenessCredits: number; // Available catch-up days (max 3)
	totalPracticeDays: number; // Lifetime practice days
	streakStartDate: Date; // When current streak began
	weekendBonusUsed: boolean; // Weekend challenge participation
	catchUpDeadline: Date | null; // Deadline for catch-up forgiveness
}
```

**Validation Rules**:

- Current streak cannot exceed total practice days
- Forgiveness credits max 3, reset monthly
- Weekend bonus tracks participation in special challenges
- Catch-up deadline 48 hours from missed day

**Relationships**:

- Influences PetState happiness and evolution
- Triggers achievement unlocks in AchievementProgress

### 4. ContentItem

**Purpose**: Represents typing practice content from gaming sources

**Storage**: Static JSON files + IndexedDB cache (`content_cache` store)

**Fields**:

```typescript
interface ContentItem {
	id: string; // Unique content identifier
	title: string; // Content headline/title
	text: string; // Typing practice text
	source: ContentSource; // Content origin
	difficulty: DifficultyLevel; // Complexity rating
	theme: ThemeCategory; // Content classification
	wordCount: number; // Total words in content
	estimatedWPM: number; // Target WPM for content
	dateAdded: Date; // When content was curated
	ageAppropriate: boolean; // Safety flag (always true)
	specialChallenge: boolean; // Weekend/event content flag
}

enum ContentSource {
	POKEMON = 'pokemon',
	NINTENDO = 'nintendo',
	ROBLOX = 'roblox'
}

enum DifficultyLevel {
	BEGINNER = 'beginner', // Common words, simple sentences
	INTERMEDIATE = 'intermediate', // Gaming terms, complex sentences
	ADVANCED = 'advanced' // Technical terms, longer paragraphs
}

enum ThemeCategory {
	NEWS = 'news', // Current gaming news
	CHARACTERS = 'characters', // Character names and descriptions
	GAMES = 'games', // Game titles and features
	EVENTS = 'events' // Special events and updates
}
```

**Validation Rules**:

- All content must be pre-reviewed for age appropriateness
- Word count must match actual text word count
- Estimated WPM based on difficulty level and content complexity
- Special challenge content only available on weekends

**Relationships**:

- Selected based on user progress and difficulty level
- Influences UserProgress metrics and PetState feeding

### 5. AchievementProgress

**Purpose**: Tracks unlocked achievements, accessories, and milestone celebrations

**Storage**: IndexedDB (`achievements` store)

**Fields**:

```typescript
interface AchievementProgress {
	userId: string; // User identifier (local only)
	unlockedAccessories: Accessory[]; // Pet customization items
	milestonesReached: Achievement[]; // Completed achievements
	celebrationsPending: CelebrationEvent[]; // Queued celebrations
	weeklyGoals: WeeklyGoal[]; // Current week objectives
	personalBests: PersonalBest[]; // Record achievements
	totalRewards: number; // Lifetime unlocks count
}

interface Accessory {
	id: string; // Accessory identifier
	name: string; // Display name
	category: 'hat' | 'collar' | 'toy' | 'background';
	unlockCondition: string; // How it was earned
	dateUnlocked: Date; // When it was earned
	equipped: boolean; // Currently visible on pet
}

interface Achievement {
	id: string; // Achievement identifier
	title: string; // Achievement name
	description: string; // What was accomplished
	icon: string; // Icon/badge image
	points: number; // Achievement point value
	rarity: 'common' | 'rare' | 'epic' | 'legendary';
	dateEarned: Date; // When achievement was unlocked
}

interface CelebrationEvent {
	type: 'evolution' | 'streak' | 'milestone' | 'accessory';
	title: string; // Celebration message
	animation: string; // Animation to play
	duration: number; // Celebration length (ms)
	soundEffect: string; // Audio file to play
	autoTrigger: boolean; // Automatic or manual trigger
}
```

**Validation Rules**:

- Only one accessory per category can be equipped
- Achievements cannot be revoked once earned
- Celebrations queue max 5 pending events
- Weekly goals reset every Monday

**Relationships**:

- Unlocked based on PetState evolution and UserProgress milestones
- Influences pet appearance and available celebrations

## Data Flow Patterns

### Session Flow

1. User starts typing → UserProgress session begins
2. Correct words → PetState happiness increases, words eaten increments
3. Errors → Temporary emotional state change, poop emoji display
4. Session ends → Progress saved, streak updated, achievements checked

### Daily Flow

1. First session of day → StreakData updated
2. Missed day detection → Forgiveness credit system activated
3. Streak milestones → Achievement unlocks, celebration queue
4. Content rotation → Fresh content selected based on progress

### Evolution Flow

1. Word count milestones → PetState evolution trigger
2. Form advancement → New accessories unlock
3. Celebration event → Animation and sound feedback
4. Updated capabilities → Enhanced pet interactions

## Storage Strategy

**IndexedDB Stores**:

- `pet_states`: Single record, frequently updated
- `user_progress`: Time-series data, append-only
- `content_cache`: Static content, periodic refresh
- `achievements`: Incremental updates, permanent records

**localStorage Keys**:

- `streak_data`: Daily check requirements
- `app_preferences`: User settings, theme choices
- `last_session`: Recovery data for interrupted sessions

**Performance Considerations**:

- IndexedDB for complex queries and large datasets
- localStorage for simple, frequently accessed data
- Automatic cleanup of old progress records (>6 months)
- Content caching strategy for offline operation

## Migration Strategy

**Version 1.0**: Initial data structure
**Future Versions**: Backward-compatible additions only
**Data Recovery**: Export/import functionality for user data portability
**Cleanup**: Automatic removal of unused or corrupted data
