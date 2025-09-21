# Progress Tracking Service Contract

**Service**: User Progress & Analytics API
**Purpose**: Track typing performance, calculate metrics, and identify improvement areas
**Storage**: IndexedDB (`user_progress` store)

## Interface Definition

```typescript
interface ProgressTrackingService {
	// Session Management
	startSession(contentId: string): Promise<SessionId>;
	recordKeypress(key: string, isCorrect: boolean, timestamp: number): Promise<void>;
	endSession(): Promise<SessionSummary>;

	// Metrics Calculation
	calculateWPM(timespan?: TimeSpan): Promise<number>;
	calculateAccuracy(timespan?: TimeSpan): Promise<number>;
	getTypingTrends(days: number): Promise<TypingTrends>;

	// Analysis & Insights
	identifyChallengingKeys(): Promise<KeyAnalysis[]>;
	getImprovementSuggestions(): Promise<ImprovementArea[]>;
	trackMilestones(): Promise<Milestone[]>;

	// Parent Dashboard
	generateProgressReport(timeRange: TimeRange): Promise<ProgressReport>;
	getParentSummary(): Promise<ParentSummary>;
}

interface SessionSummary {
	sessionId: string;
	duration: number;
	wordsPerMinute: number;
	accuracyPercentage: number;
	totalCharacters: number;
	errorsCount: number;
	improvementFromLastSession: number;
	milestonesAchieved: Milestone[];
}

interface TypingTrends {
	wpmTrend: TrendData[];
	accuracyTrend: TrendData[];
	practiceTimeTrend: TrendData[];
	improvementRate: number;
}

interface TrendData {
	date: Date;
	value: number;
	movingAverage: number;
}

interface KeyAnalysis {
	key: string;
	errorRate: number;
	attempts: number;
	improvementTrend: 'improving' | 'stable' | 'declining';
	practiceRecommendation: string;
}

interface ProgressReport {
	timeRange: TimeRange;
	totalPracticeTime: number;
	averageWPM: number;
	averageAccuracy: number;
	sessionsCompleted: number;
	challengingAreas: string[];
	achievements: Achievement[];
	parentNotes: string[];
}
```

## Contract Tests

### startSession()

- **Input**: Content ID for practice text
- **Output**: Unique session identifier
- **Validation**: Session tracking begins, timer starts
- **State**: Initialize empty keypress buffer

### recordKeypress()

- **Input**: Key character, correctness, timestamp
- **Output**: Promise resolution
- **Validation**: Timestamp sequence validation, character tracking
- **Performance**: Buffer keypresses, batch save every 10 keys

### calculateWPM()

- **Input**: Optional timespan filter
- **Output**: Words per minute calculation
- **Formula**: (Total characters typed / 5) / (time in minutes)
- **Validation**: Exclude outlier sessions (>300 WPM or <1 WPM)

### identifyChallengingKeys()

- **Input**: None (analyzes recent sessions)
- **Output**: Array of problematic keys with error rates
- **Threshold**: Keys with >20% error rate flagged
- **Analysis**: Compare against expected key difficulty patterns

## Error Handling

- **SessionCorruption**: Discard incomplete session, preserve prior data
- **TimestampInvalid**: Use server timestamp as fallback
- **MetricsCalculationError**: Return cached values, log calculation failure
- **StorageLimit**: Archive old sessions, maintain recent 100 sessions

## Performance Requirements

- Session start: <50ms
- Keypress recording: <5ms (critical for real-time)
- WPM calculation: <100ms
- Progress report generation: <500ms
- Data retention: 6 months of session history
