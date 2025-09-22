/**
 * ContentItem Model with Filtering Logic
 *
 * Represents typing practice content from gaming sources with age-appropriate
 * filtering, difficulty assessment, and content categorization logic.
 */

import { ContentSource, DifficultyLevel, ThemeCategory } from '$lib/types/index.js';
import type { ContentItem, ContentCriteria } from '$lib/types/index.js';

export const CONTENT_SETTINGS = {
	maxContentAge: 90, // Days before content is considered stale
	maxWordCount: 200, // Maximum words per content item
	minWordCount: 10, // Minimum words per content item
	beginnerMaxWords: 50,
	intermediateMaxWords: 100,
	advancedMaxWords: 200,
	ageAppropriateOnly: true,
	specialChallengeFrequency: 0.2 // 20% of content can be special challenges
} as const;

export const DIFFICULTY_WORD_RANGES = {
	beginner: { min: 10, max: 50, avgWPM: 15 },
	intermediate: { min: 30, max: 100, avgWPM: 25 },
	advanced: { min: 60, max: 200, avgWPM: 35 }
} as const;

export const AGE_INAPPROPRIATE_TERMS = [
	// Violence and conflict
	'violence',
	'fight',
	'kill',
	'death',
	'blood',
	'weapon',
	'gun',
	'knife',
	'sword',
	'battle',
	'war',
	'attack',
	'destroy',
	'murder',
	'shooting',
	'stabbing',

	// Adult content
	'gambling',
	'bet',
	'casino',
	'adult',
	'mature',
	'romance',
	'dating',
	'sexy',
	'alcohol',
	'beer',
	'wine',
	'drunk',
	'smoking',
	'cigarette',
	'drug',

	// Inappropriate language placeholders (would be more comprehensive in real app)
	'stupid',
	'idiot',
	'hate',
	'damn',
	'hell',
	'shut up',

	// Scary/frightening content
	'scary',
	'horror',
	'ghost',
	'monster',
	'nightmare',
	'fear',
	'terror',
	'zombie',
	'demon',
	'devil',
	'evil',
	'dark magic'
] as const;

export class ContentItemModel {
	private _content: ContentItem;

	constructor(content: Partial<ContentItem>) {
		this._content = this.validateAndNormalize(content);
	}

	/**
	 * Get current content state
	 */
	get content(): ContentItem {
		return { ...this._content };
	}

	/**
	 * Get specific properties
	 */
	get id(): string {
		return this._content.id;
	}

	get title(): string {
		return this._content.title;
	}

	get text(): string {
		return this._content.text;
	}

	get source(): ContentSource {
		return this._content.source;
	}

	get difficulty(): DifficultyLevel {
		return this._content.difficulty;
	}

	get theme(): ThemeCategory {
		return this._content.theme;
	}

	get wordCount(): number {
		return this._content.wordCount;
	}

	get estimatedWPM(): number {
		return this._content.estimatedWPM;
	}

	get dateAdded(): Date {
		return new Date(this._content.dateAdded);
	}

	get ageAppropriate(): boolean {
		return this._content.ageAppropriate;
	}

	get specialChallenge(): boolean {
		return this._content.specialChallenge;
	}

	/**
	 * Validate and normalize content data
	 */
	private validateAndNormalize(content: Partial<ContentItem>): ContentItem {
		// Generate ID if not provided
		const id = content.id || `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

		// Validate and clean text
		const text = this.sanitizeText(content.text || '');
		if (text.length === 0) {
			throw new Error('Content text cannot be empty');
		}

		// Calculate actual word count
		const actualWordCount = this.calculateWordCount(text);
		if (
			actualWordCount < CONTENT_SETTINGS.minWordCount ||
			actualWordCount > CONTENT_SETTINGS.maxWordCount
		) {
			throw new Error(
				`Word count must be between ${CONTENT_SETTINGS.minWordCount} and ${CONTENT_SETTINGS.maxWordCount}`
			);
		}

		// Validate and set other fields
		const title = this.sanitizeText(content.title || 'Untitled Content');
		const source = this.validateSource(content.source);
		const theme = this.validateTheme(content.theme);

		// Auto-determine difficulty based on content complexity
		const difficulty = content.difficulty || this.determineDifficulty(text, actualWordCount);

		// Calculate estimated WPM based on difficulty and content
		const estimatedWPM = this.calculateEstimatedWPM(text, difficulty);

		// Validate date
		const dateAdded =
			content.dateAdded instanceof Date
				? content.dateAdded
				: new Date(content.dateAdded || Date.now());

		// Perform age appropriateness check
		const ageAppropriate = this.checkAgeAppropriateness(text, title);

		// Force age appropriate to true if setting is enabled
		if (CONTENT_SETTINGS.ageAppropriateOnly && !ageAppropriate) {
			throw new Error('Content failed age appropriateness check');
		}

		const specialChallenge = Boolean(content.specialChallenge);

		return {
			id,
			title,
			text,
			source,
			difficulty,
			theme,
			wordCount: actualWordCount,
			estimatedWPM,
			dateAdded,
			ageAppropriate,
			specialChallenge
		};
	}

	/**
	 * Sanitize text content
	 */
	private sanitizeText(text: string): string {
		return text
			.trim()
			.replace(/\s+/g, ' ') // Normalize whitespace
			.replace(/[^\w\s\-.,!?;:'"()]/g, '') // Remove special characters except common punctuation
			.substring(0, 2000); // Limit length
	}

	/**
	 * Calculate word count
	 */
	private calculateWordCount(text: string): number {
		return text
			.trim()
			.split(/\s+/)
			.filter((word) => word.length > 0).length;
	}

	/**
	 * Validate content source
	 */
	private validateSource(source?: ContentSource): ContentSource {
		const validSources: ContentSource[] = [
			ContentSource.POKEMON,
			ContentSource.NINTENDO,
			ContentSource.ROBLOX
		];
		if (source && validSources.includes(source)) {
			return source;
		}
		return ContentSource.POKEMON; // Default fallback
	}

	/**
	 * Validate theme category
	 */
	private validateTheme(theme?: ThemeCategory): ThemeCategory {
		const validThemes: ThemeCategory[] = [
			ThemeCategory.NEWS,
			ThemeCategory.CHARACTERS,
			ThemeCategory.GAMES,
			ThemeCategory.EVENTS
		];
		if (theme && validThemes.includes(theme)) {
			return theme;
		}
		return ThemeCategory.NEWS; // Default fallback
	}

	/**
	 * Determine difficulty based on content analysis
	 */
	private determineDifficulty(text: string, wordCount: number): DifficultyLevel {
		const complexityScore = this.calculateComplexityScore(text);

		// Factor in word count
		let difficulty: DifficultyLevel;

		if (wordCount <= DIFFICULTY_WORD_RANGES.beginner.max && complexityScore < 0.3) {
			difficulty = DifficultyLevel.BEGINNER;
		} else if (wordCount <= DIFFICULTY_WORD_RANGES.intermediate.max && complexityScore < 0.7) {
			difficulty = DifficultyLevel.INTERMEDIATE;
		} else {
			difficulty = DifficultyLevel.ADVANCED;
		}

		return difficulty;
	}

	/**
	 * Calculate text complexity score (0-1)
	 */
	private calculateComplexityScore(text: string): number {
		const words = text.toLowerCase().split(/\s+/);

		// Metrics for complexity
		const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
		const uniqueWordRatio = new Set(words).size / words.length;
		const sentenceCount = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
		const avgWordsPerSentence = words.length / Math.max(1, sentenceCount);

		// Count difficult patterns
		const capitalLetterCount = (text.match(/[A-Z]/g) || []).length;
		const numberCount = (text.match(/\d/g) || []).length;
		const punctuationCount = (text.match(/[.,;:!?]/g) || []).length;

		// Normalize scores (0-1)
		const lengthScore = Math.min(1, avgWordLength / 8); // 8+ chars = complex
		const diversityScore = Math.min(1, uniqueWordRatio);
		const structureScore = Math.min(1, avgWordsPerSentence / 15); // 15+ words/sentence = complex
		const specialCharsScore = Math.min(
			1,
			(capitalLetterCount + numberCount + punctuationCount) / text.length
		);

		// Weighted average
		return (
			lengthScore * 0.3 + diversityScore * 0.2 + structureScore * 0.3 + specialCharsScore * 0.2
		);
	}

	/**
	 * Calculate estimated WPM based on difficulty and content
	 */
	private calculateEstimatedWPM(text: string, difficulty: DifficultyLevel): number {
		const baseWPM = DIFFICULTY_WORD_RANGES[difficulty].avgWPM;
		const complexityScore = this.calculateComplexityScore(text);

		// Adjust based on complexity within difficulty range
		const adjustment = (complexityScore - 0.5) * 5; // +/- 2.5 WPM adjustment
		const adjustedWPM = baseWPM + adjustment;

		// Ensure within reasonable bounds
		return Math.max(5, Math.min(50, Math.round(adjustedWPM)));
	}

	/**
	 * Check if content is age-appropriate for children 7-12
	 */
	private checkAgeAppropriateness(text: string, title: string): boolean {
		const combinedText = (text + ' ' + title).toLowerCase();

		// Check for inappropriate terms
		for (const term of AGE_INAPPROPRIATE_TERMS) {
			if (combinedText.includes(term)) {
				return false;
			}
		}

		// Additional heuristic checks
		const hasExcessiveCaps = (text.match(/[A-Z]/g) || []).length > text.length * 0.3;
		const hasExcessivePunctuation = (text.match(/[!?]{2,}/g) || []).length > 0;

		if (hasExcessiveCaps || hasExcessivePunctuation) {
			return false; // Might indicate aggressive or inappropriate content
		}

		return true;
	}

	/**
	 * Check if content matches given criteria
	 */
	matchesCriteria(criteria: ContentCriteria): boolean {
		// Source filter
		if (criteria.source && this._content.source !== criteria.source) {
			return false;
		}

		// Difficulty filter
		if (criteria.difficulty && this._content.difficulty !== criteria.difficulty) {
			return false;
		}

		// Theme filter
		if (criteria.theme && this._content.theme !== criteria.theme) {
			return false;
		}

		// Max words filter
		if (criteria.maxWords && this._content.wordCount > criteria.maxWords) {
			return false;
		}

		// Age appropriate filter (always enforced)
		if (!this._content.ageAppropriate) {
			return false;
		}

		return true;
	}

	/**
	 * Get content suitability for user skill level
	 */
	getSuitabilityScore(
		userWPM: number,
		userAccuracy: number
	): {
		score: number;
		reason: string;
		recommended: boolean;
	} {
		const targetWPM = this._content.estimatedWPM;
		const wpmDiff = Math.abs(userWPM - targetWPM);

		// Base score from WPM match (closer = better)
		let score = Math.max(0, 100 - wpmDiff * 5);

		// Adjust for user accuracy
		if (userAccuracy < 80 && this._content.difficulty === 'advanced') {
			score *= 0.5; // Penalize advanced content for low accuracy users
		} else if (userAccuracy > 95 && this._content.difficulty === 'beginner') {
			score *= 0.7; // Slightly penalize beginner content for high accuracy users
		}

		// Determine recommendation and reason
		let recommended = score >= 70;
		let reason = '';

		if (score >= 90) {
			reason = 'Perfect match for your skill level!';
		} else if (score >= 70) {
			reason = 'Good practice content for your current abilities.';
		} else if (userWPM < targetWPM - 10) {
			reason = 'This content might be too challenging right now.';
			recommended = false;
		} else if (userWPM > targetWPM + 15) {
			reason = 'This content might be too easy for you.';
			recommended = false;
		} else {
			reason = 'Consider this for variety in your practice.';
		}

		return {
			score: Math.round(score),
			reason,
			recommended
		};
	}

	/**
	 * Check if content is stale/expired
	 */
	isStale(currentDate: Date = new Date()): boolean {
		const daysSinceAdded = Math.floor(
			(currentDate.getTime() - this._content.dateAdded.getTime()) / (1000 * 60 * 60 * 24)
		);
		return daysSinceAdded > CONTENT_SETTINGS.maxContentAge;
	}

	/**
	 * Get practice statistics for this content
	 */
	generatePracticePreview(): {
		wordCount: number;
		estimatedDuration: string;
		difficultyDescription: string;
		keyFeatures: string[];
	} {
		const estimatedSeconds = (this._content.wordCount / this._content.estimatedWPM) * 60;
		const minutes = Math.floor(estimatedSeconds / 60);
		const seconds = Math.round(estimatedSeconds % 60);

		const estimatedDuration = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

		const difficultyDescriptions = {
			beginner: 'Perfect for starting out - simple words and short sentences',
			intermediate: 'Good challenge - mixed vocabulary and longer text',
			advanced: 'Advanced practice - complex terms and detailed content'
		};

		const keyFeatures: string[] = [];

		// Analyze content features
		const words = this._content.text.split(/\s+/);
		const hasNumbers = /\d/.test(this._content.text);
		const hasPunctuation = /[.,;:!?]/.test(this._content.text);
		const hasCapitalization = /[A-Z]/.test(this._content.text);

		if (hasNumbers) keyFeatures.push('Numbers practice');
		if (hasPunctuation) keyFeatures.push('Punctuation training');
		if (hasCapitalization) keyFeatures.push('Capitalization practice');
		if (this._content.specialChallenge) keyFeatures.push('Special challenge');
		if (words.some((word) => word.length > 8)) keyFeatures.push('Long words');

		keyFeatures.push(`${this._content.source} content`);
		keyFeatures.push(`${this._content.theme} theme`);

		return {
			wordCount: this._content.wordCount,
			estimatedDuration,
			difficultyDescription: difficultyDescriptions[this._content.difficulty],
			keyFeatures: keyFeatures.slice(0, 4) // Limit to 4 features
		};
	}

	/**
	 * Update content text and recalculate derived properties
	 */
	updateText(newText: string): void {
		const sanitizedText = this.sanitizeText(newText);
		const wordCount = this.calculateWordCount(sanitizedText);

		if (wordCount < CONTENT_SETTINGS.minWordCount || wordCount > CONTENT_SETTINGS.maxWordCount) {
			throw new Error(
				`Word count must be between ${CONTENT_SETTINGS.minWordCount} and ${CONTENT_SETTINGS.maxWordCount}`
			);
		}

		if (!this.checkAgeAppropriateness(sanitizedText, this._content.title)) {
			throw new Error('Updated text failed age appropriateness check');
		}

		this._content.text = sanitizedText;
		this._content.wordCount = wordCount;
		this._content.difficulty = this.determineDifficulty(sanitizedText, wordCount);
		this._content.estimatedWPM = this.calculateEstimatedWPM(
			sanitizedText,
			this._content.difficulty
		);
		this._content.ageAppropriate = true; // Passed check above
	}

	/**
	 * Mark as special challenge content
	 */
	setSpecialChallenge(isSpecial: boolean): void {
		this._content.specialChallenge = isSpecial;
	}

	/**
	 * Filter content array by multiple criteria
	 */
	static filterContent(
		contentList: ContentItemModel[],
		criteria: ContentCriteria,
		limit?: number
	): ContentItemModel[] {
		let filtered = contentList.filter((content) => content.matchesCriteria(criteria));

		// Exclude used content if requested
		if (criteria.excludeUsed) {
			// This would require tracking used content - simplified for now
			// In a real implementation, you'd filter out content IDs from a usage history
		}

		// Sort by relevance/recency
		filtered.sort((a, b) => {
			// Prefer non-stale content
			const aStale = a.isStale();
			const bStale = b.isStale();
			if (aStale !== bStale) return aStale ? 1 : -1;

			// Then by date added (newer first)
			return b.dateAdded.getTime() - a.dateAdded.getTime();
		});

		// Apply limit if specified
		if (limit && limit > 0) {
			filtered = filtered.slice(0, limit);
		}

		return filtered;
	}

	/**
	 * Generate content recommendations based on user progress
	 */
	static generateRecommendations(
		contentList: ContentItemModel[],
		userWPM: number,
		userAccuracy: number,
		userDifficulty: DifficultyLevel,
		count: number = 5
	): Array<{
		content: ContentItemModel;
		suitability: ReturnType<ContentItemModel['getSuitabilityScore']>;
	}> {
		const recommendations = contentList
			.map((content) => ({
				content,
				suitability: content.getSuitabilityScore(userWPM, userAccuracy)
			}))
			.filter((rec) => rec.suitability.recommended)
			.sort((a, b) => b.suitability.score - a.suitability.score)
			.slice(0, count);

		return recommendations;
	}

	/**
	 * Export content for persistence
	 */
	toJSON(): ContentItem {
		return { ...this._content };
	}

	/**
	 * Create instance from persisted data
	 */
	static fromJSON(data: unknown): ContentItemModel {
		if (!data || typeof data !== 'object') {
			throw new Error('Invalid content item data');
		}

		const dataObj = data as Record<string, unknown>;

		// Convert date strings back to Date objects if needed
		if (dataObj.dateAdded && typeof dataObj.dateAdded === 'string') {
			dataObj.dateAdded = new Date(dataObj.dateAdded);
		}

		return new ContentItemModel(dataObj as unknown as ContentItem);
	}

	/**
	 * Validate content state integrity
	 */
	validateState(): { isValid: boolean; errors: string[] } {
		const errors: string[] = [];

		if (!this._content.id || typeof this._content.id !== 'string') {
			errors.push('Content ID is required and must be a string');
		}

		if (!this._content.title || this._content.title.trim().length === 0) {
			errors.push('Content title is required');
		}

		if (!this._content.text || this._content.text.trim().length === 0) {
			errors.push('Content text is required');
		}

		if (this._content.wordCount !== this.calculateWordCount(this._content.text)) {
			errors.push('Word count does not match actual text word count');
		}

		if (
			this._content.wordCount < CONTENT_SETTINGS.minWordCount ||
			this._content.wordCount > CONTENT_SETTINGS.maxWordCount
		) {
			errors.push(
				`Word count must be between ${CONTENT_SETTINGS.minWordCount} and ${CONTENT_SETTINGS.maxWordCount}`
			);
		}

		if (this._content.estimatedWPM <= 0 || this._content.estimatedWPM > 100) {
			errors.push('Estimated WPM must be between 1 and 100');
		}

		if (!(this._content.dateAdded instanceof Date)) {
			errors.push('Date added must be a valid Date object');
		}

		if (CONTENT_SETTINGS.ageAppropriateOnly && !this._content.ageAppropriate) {
			errors.push('Content must be age appropriate');
		}

		const validSources: ContentSource[] = [
			ContentSource.POKEMON,
			ContentSource.NINTENDO,
			ContentSource.ROBLOX
		];
		if (!validSources.includes(this._content.source)) {
			errors.push('Content source must be pokemon, nintendo, or roblox');
		}

		const validDifficulties: DifficultyLevel[] = [
			DifficultyLevel.BEGINNER,
			DifficultyLevel.INTERMEDIATE,
			DifficultyLevel.ADVANCED
		];
		if (!validDifficulties.includes(this._content.difficulty)) {
			errors.push('Content difficulty must be beginner, intermediate, or advanced');
		}

		const validThemes: ThemeCategory[] = [
			ThemeCategory.NEWS,
			ThemeCategory.CHARACTERS,
			ThemeCategory.GAMES,
			ThemeCategory.EVENTS
		];
		if (!validThemes.includes(this._content.theme)) {
			errors.push('Content theme must be news, characters, games, or events');
		}

		return {
			isValid: errors.length === 0,
			errors
		};
	}
}
