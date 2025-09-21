# Achievement Service Contract

**Service**: Achievement & Reward System API
**Purpose**: Manage unlocks, celebrations, and milestone tracking
**Storage**: IndexedDB (`achievements` store)

## Interface Definition

```typescript
interface AchievementService {
	// Achievement Management
	checkAchievements(sessionData: SessionSummary): Promise<Achievement[]>;
	unlockAchievement(achievementId: string): Promise<UnlockResult>;
	getUnlockedAchievements(): Promise<Achievement[]>;

	// Celebration System
	queueCelebration(event: CelebrationEvent): Promise<void>;
	getNextCelebration(): Promise<CelebrationEvent | null>;
	markCelebrationShown(eventId: string): Promise<void>;

	// Accessory & Rewards
	unlockAccessory(accessoryId: string, reason: string): Promise<boolean>;
	getAvailableAccessories(): Promise<Accessory[]>;
	equipAccessory(accessoryId: string): Promise<void>;

	// Milestone Tracking
	checkMilestones(progress: UserProgress): Promise<Milestone[]>;
	getPersonalBests(): Promise<PersonalBest[]>;
	updatePersonalBest(category: string, value: number): Promise<boolean>;
}

interface UnlockResult {
	success: boolean;
	achievement: Achievement;
	accessoriesUnlocked: Accessory[];
	celebrationTriggered: boolean;
	pointsAwarded: number;
}

interface CelebrationEvent {
	id: string;
	type: 'evolution' | 'streak' | 'milestone' | 'accessory' | 'personal_best';
	title: string;
	message: string;
	animation: AnimationType;
	duration: number;
	soundEffect: string;
	priority: 'low' | 'medium' | 'high';
	autoTrigger: boolean;
}

interface PersonalBest {
	category: 'wpm' | 'accuracy' | 'streak' | 'session_time' | 'words_total';
	value: number;
	dateAchieved: Date;
	previousBest?: number;
	improvementPercentage: number;
}
```

## Contract Tests

### checkAchievements()

- **Input**: SessionSummary with performance data
- **Output**: Array of newly unlocked achievements
- **Validation**: Check all achievement criteria, avoid duplicates
- **Side Effects**: Queue celebrations, unlock accessories

### queueCelebration()

- **Input**: CelebrationEvent object
- **Output**: Promise resolution
- **Validation**: Priority ordering, maximum 5 queued events
- **Business Rule**: High priority celebrations shown first

### unlockAccessory()

- **Input**: Accessory ID and unlock reason
- **Output**: Success boolean
- **Validation**: Achievement requirement met, not already unlocked
- **Side Effect**: Add to available accessories, trigger celebration

### checkMilestones()

- **Input**: Current UserProgress data
- **Output**: Array of achieved milestones
- **Validation**: Milestone thresholds (every 100 words, WPM increases, streak days)
- **Categories**: Speed (WPM), Accuracy (%), Consistency (streak), Volume (total words)

## Achievement Categories

### Speed Achievements

- **Speedy Fingers**: Reach 10 WPM
- **Fast Typer**: Reach 20 WPM
- **Lightning Hands**: Reach 30 WPM
- **Speed Demon**: Reach 40 WPM

### Accuracy Achievements

- **Careful Typer**: 90% accuracy for 5 sessions
- **Precision Master**: 95% accuracy for 10 sessions
- **Perfect Practice**: 100% accuracy for full session
- **Consistency King**: 90%+ accuracy for 20 sessions

### Streak Achievements

- **Daily Habit**: 3 consecutive days
- **Week Warrior**: 7 consecutive days
- **Monthly Master**: 30 consecutive days
- **Year Legend**: 365 consecutive days

### Content Achievements

- **Pokemon Trainer**: Complete 50 Pokemon-themed sessions
- **Nintendo Fan**: Complete 50 Nintendo-themed sessions
- **Roblox Builder**: Complete 50 Roblox-themed sessions
- **Gaming Guru**: Complete sessions from all three sources

## Error Handling

- **DuplicateUnlock**: Ignore silently, log for debugging
- **InvalidAchievement**: Skip invalid criteria, continue processing
- **CelebrationOverflow**: Remove oldest low-priority celebrations
- **CorruptedProgress**: Recalculate from session history

## Performance Requirements

- Achievement checking: <100ms per session
- Celebration queue: <50ms operations
- Milestone calculation: <200ms
- Personal best updates: <50ms
