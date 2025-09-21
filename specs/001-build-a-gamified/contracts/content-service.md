# Content Service Contract

**Service**: Content Management API
**Purpose**: Handle gaming content loading, filtering, and caching
**Storage**: Static JSON + IndexedDB cache

## Interface Definition

```typescript
interface ContentService {
	// Content Loading
	loadDailyContent(source?: ContentSource): Promise<ContentItem[]>;
	getContentByDifficulty(level: DifficultyLevel): Promise<ContentItem[]>;
	getSpecialChallenges(): Promise<ContentItem[]>;

	// Content Filtering
	filterByTheme(theme: ThemeCategory): Promise<ContentItem[]>;
	getRandomContent(criteria: ContentCriteria): Promise<ContentItem>;

	// Cache Management
	refreshContentCache(): Promise<void>;
	getCacheStatus(): Promise<CacheStatus>;
	clearExpiredContent(): Promise<void>;
}

interface ContentCriteria {
	source?: ContentSource;
	difficulty?: DifficultyLevel;
	theme?: ThemeCategory;
	maxWords?: number;
	excludeUsed?: boolean;
}

interface CacheStatus {
	lastUpdate: Date;
	totalItems: number;
	sources: Record<ContentSource, number>;
	expiredItems: number;
}
```

## Contract Tests

### loadDailyContent()

- **Input**: Optional ContentSource filter
- **Output**: Array of ContentItem objects
- **Validation**: All items must be age-appropriate, non-empty text
- **Performance**: Response time <100ms for cached content

### getContentByDifficulty()

- **Input**: DifficultyLevel enum value
- **Output**: Filtered ContentItem array
- **Validation**: Word count matches difficulty (beginner: <50, intermediate: 50-100, advanced: >100)
- **Business Rule**: Difficulty progression based on user WPM history

### getRandomContent()

- **Input**: ContentCriteria object with filters
- **Output**: Single ContentItem matching criteria
- **Validation**: Randomization without immediate repeats
- **Edge Case**: Return fallback content if no matches found

## Error Handling

- **NetworkError**: Graceful fallback to cached content
- **ValidationError**: Skip invalid content items, log for review
- **StorageError**: Clear corrupted cache, reload from static files
- **EmptyContentError**: Return default practice text as fallback

## Performance Requirements

- Initial load: <200ms
- Subsequent loads: <50ms (from cache)
- Cache refresh: Background operation, no UI blocking
- Storage limit: Max 5MB cached content
