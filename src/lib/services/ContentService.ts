/**
 * @module ContentService
 * @description Provides content filtering, caching, and recommendation functionality
 * for the gamified typing trainer. Handles age-appropriate content from
 * Pokemon, Nintendo, and Roblox sources with performance optimization.
 *
 * This service manages typing practice content specifically curated for kids aged 7-12,
 * ensuring all text is age-appropriate and engaging through popular gaming themes.
 * Content is cached for performance and filtered by difficulty levels.
 *
 * @since 1.0.0
 * @performance Implements 24-hour caching with <100ms response time for cached content
 */

import type {
	ContentService as IContentService,
	ContentItem,
	ContentCriteria,
	CacheStatus
} from '$lib/types/index.js';
import { ContentSource, DifficultyLevel, ThemeCategory } from '$lib/types/index.js';
import { ContentItemModel } from '$lib/models/ContentItem.js';
import { dbManager } from '$lib/storage/db.js';

export class ContentService implements IContentService {
	private cache: Map<string, ContentItem[]> = new Map();
	private lastCacheUpdate: Date = new Date(0);
	private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

	/**
	 * Loads daily typing practice content with intelligent caching and source filtering.
	 * Content is validated, age-appropriate, and optimized for young learners.
	 *
	 * @param {ContentSource} [source] - Optional content source filter (Pokemon, Nintendo, Roblox)
	 * @returns {Promise<ContentItem[]>} Array of validated, age-appropriate content items
	 *
	 * @example
	 * // Load all available content for today
	 * const allContent = await contentService.loadDailyContent();
	 *
	 * // Load only Pokemon-themed content
	 * const pokemonContent = await contentService.loadDailyContent(ContentSource.POKEMON);
	 * console.log(`Found ${pokemonContent.length} Pokemon typing exercises`);
	 *
	 * @performance Uses 24-hour cache, returns cached content in <100ms
	 * @since 1.0.0
	 */
	async loadDailyContent(source?: ContentSource): Promise<ContentItem[]> {
		try {
			// Check cache first for performance
			const cacheKey = source ? `daily-${source}` : 'daily-all';
			const cached = this.cache.get(cacheKey);
			const isCacheValid =
				cached && Date.now() - this.lastCacheUpdate.getTime() < this.CACHE_DURATION;

			if (isCacheValid) {
				// Performance requirement: <100ms for cached content
				return cached;
			}

			// Load from static files
			const allContent = await this.loadFromStaticFiles(source);

			// Process through ContentItemModel for validation and filtering
			const processedContent: ContentItem[] = [];
			for (const rawItem of allContent) {
				const model = new ContentItemModel(rawItem as Partial<ContentItem>);
				if (model.validateState().isValid) {
					processedContent.push(model.toJSON());
				}
			}

			// Update cache
			this.cache.set(cacheKey, processedContent);
			this.lastCacheUpdate = new Date();

			// Store in IndexedDB for persistence
			await this.updateContentCache(processedContent);

			return processedContent;
		} catch (error) {
			console.error('Failed to load daily content:', error);

			// Fallback to cached data or minimal content
			return this.getFallbackContent(source);
		}
	}

	/**
	 * Retrieves content filtered by typing difficulty level with word count validation.
	 * Ensures content matches skill level expectations for progressive learning.
	 *
	 * @param {DifficultyLevel} difficulty - Target difficulty level (BEGINNER, INTERMEDIATE, ADVANCED)
	 * @returns {Promise<ContentItem[]>} Content items matching difficulty requirements
	 *
	 * @example
	 * // Get beginner content for new typing students
	 * const beginnerTexts = await contentService.getContentByDifficulty(DifficultyLevel.BEGINNER);
	 * beginnerTexts.forEach(text => {
	 *   console.log(`${text.title}: ${text.wordCount} words (${text.estimatedWPM} WPM)`);
	 * });
	 *
	 * // Advanced content for experienced young typists
	 * const hardTexts = await contentService.getContentByDifficulty(DifficultyLevel.ADVANCED);
	 *
	 * @performance Filters pre-loaded content in memory
	 * @since 1.0.0
	 */
	async getContentByDifficulty(difficulty: DifficultyLevel): Promise<ContentItem[]> {
		const allContent = await this.loadDailyContent();

		return allContent.filter((item) => {
			if (item.difficulty !== difficulty) return false;

			// Validate word count matches difficulty expectations
			switch (difficulty) {
				case DifficultyLevel.BEGINNER:
					return item.wordCount < 50;
				case DifficultyLevel.INTERMEDIATE:
					return item.wordCount >= 50 && item.wordCount <= 100;
				case DifficultyLevel.ADVANCED:
					return item.wordCount > 100;
				default:
					return true;
			}
		});
	}

	/**
	 * Retrieves special challenge content for advanced typing practice sessions.
	 * Includes longer texts and complex content for motivated learners seeking extra challenges.
	 *
	 * @returns {Promise<ContentItem[]>} Array of challenging content items
	 *
	 * @example
	 * // Get special challenges for kids who want extra practice
	 * const challenges = await contentService.getSpecialChallenges();
	 * challenges.forEach(challenge => {
	 *   console.log(`Challenge: ${challenge.title} (${challenge.wordCount} words)`);
	 *   if (challenge.specialChallenge) {
	 *     console.log('This is a special challenge with bonus points!');
	 *   }
	 * });
	 *
	 * @performance Filters from cached content for fast response
	 * @since 1.0.0
	 */
	async getSpecialChallenges(): Promise<ContentItem[]> {
		const allContent = await this.loadDailyContent();

		return allContent.filter(
			(item) =>
				item.specialChallenge ||
				(item.difficulty === DifficultyLevel.ADVANCED && item.wordCount > 150)
		);
	}

	/**
	 * Filters content by theme category with optional source restriction.
	 * Allows kids to practice typing with their favorite game or story themes.
	 *
	 * @param {ThemeCategory} theme - Theme category to filter by (games, stories, news, etc.)
	 * @param {ContentSource} [source] - Optional source filter to combine with theme
	 * @returns {Promise<ContentItem[]>} Content items matching the theme criteria
	 *
	 * @example
	 * // Get all adventure-themed content
	 * const adventures = await contentService.filterByTheme(ThemeCategory.ADVENTURE);
	 *
	 * // Get Pokemon adventure content specifically
	 * const pokemonAdventures = await contentService.filterByTheme(
	 *   ThemeCategory.ADVENTURE,
	 *   ContentSource.POKEMON
	 * );
	 * console.log(`Found ${pokemonAdventures.length} Pokemon adventure stories`);
	 *
	 * @performance Combines caching with efficient theme filtering
	 * @since 1.0.0
	 */
	async filterByTheme(theme: ThemeCategory, source?: ContentSource): Promise<ContentItem[]> {
		const allContent = await this.loadDailyContent(source);

		return allContent.filter((item) => item.theme === theme);
	}

	/**
	 * Selects random content matching specified criteria with intelligent fallback.
	 * Includes usage tracking to avoid repetition and ensure variety in practice sessions.
	 *
	 * @param {ContentCriteria} [criteria={}] - Filtering criteria for content selection
	 * @returns {Promise<ContentItem>} Single content item matching criteria
	 *
	 * @example
	 * // Get random beginner content
	 * const randomText = await contentService.getRandomContent({
	 *   difficulty: DifficultyLevel.BEGINNER,
	 *   maxWords: 25,
	 *   excludeUsed: true
	 * });
	 * console.log(`Practice text: "${randomText.text}"`);
	 *
	 * // Get Pokemon content for intermediate level
	 * const pokemonText = await contentService.getRandomContent({
	 *   source: ContentSource.POKEMON,
	 *   difficulty: DifficultyLevel.INTERMEDIATE,
	 *   theme: ThemeCategory.ADVENTURE
	 * });
	 *
	 * @performance Uses smart filtering and fallback to guarantee content delivery
	 * @since 1.0.0
	 */
	async getRandomContent(criteria: ContentCriteria = {}): Promise<ContentItem> {
		const allContent = await this.loadDailyContent(criteria.source);

		// Filter based on criteria
		const filteredContent = allContent.filter((item) => {
			// Source filter
			if (criteria.source && item.source !== criteria.source) return false;

			// Difficulty filter
			if (criteria.difficulty && item.difficulty !== criteria.difficulty) return false;

			// Max words filter
			if (criteria.maxWords && item.wordCount > criteria.maxWords) return false;

			// Min words filter
			if (criteria.minWords && item.wordCount < criteria.minWords) return false;

			// Theme filter
			if (criteria.theme && item.theme !== criteria.theme) return false;

			// Special challenge filter
			if (
				criteria.specialChallenge !== undefined &&
				item.specialChallenge !== criteria.specialChallenge
			)
				return false;

			// Exclude used content (if tracking is enabled)
			if (criteria.excludeUsed && this.isContentRecentlyUsed(item.id)) return false;

			return true;
		});

		// If no matches found, provide intelligent fallback
		if (filteredContent.length === 0) {
			return this.getFallbackContentItem(criteria);
		}

		// Random selection
		const randomIndex = Math.floor(Math.random() * filteredContent.length);
		const selectedContent = filteredContent[randomIndex];

		// Track usage if enabled
		if (criteria.excludeUsed) {
			this.markContentAsUsed(selectedContent.id);
		}

		return selectedContent;
	}

	/**
	 * Refreshes content cache by reloading from static files and clearing expired data.
	 * Used for manual cache updates or when new content is available.
	 *
	 * @returns {Promise<void>}
	 * @throws {Error} If cache refresh fails for all sources
	 *
	 * @example
	 * // Refresh content cache when new typing content is available
	 * try {
	 *   await contentService.refreshContentCache();
	 *   console.log('Content cache refreshed with latest typing exercises!');
	 * } catch (error) {
	 *   console.log('Failed to refresh content, using existing cache');
	 * }
	 *
	 * @performance Clears memory cache and reloads all content sources
	 * @since 1.0.0
	 */
	async refreshContentCache(): Promise<void> {
		try {
			// Clear existing cache
			this.cache.clear();

			// Load fresh content for all sources
			const sources: ContentSource[] = [
				ContentSource.POKEMON,
				ContentSource.NINTENDO,
				ContentSource.ROBLOX
			];

			for (const source of sources) {
				await this.loadDailyContent(source);
			}

			// Clear expired content from IndexedDB
			await this.clearExpiredContent();
		} catch (error) {
			console.error('Failed to refresh content cache:', error);
			throw error;
		}
	}

	/**
	 * Retrieves detailed cache status including item counts and expiration info.
	 * Useful for monitoring content availability and cache health.
	 *
	 * @returns {Promise<CacheStatus>} Complete cache status with source breakdown
	 *
	 * @example
	 * // Check cache status for admin or debugging
	 * const status = await contentService.getCacheStatus();
	 * console.log(`Total content items: ${status.totalItems}`);
	 * console.log(`Pokemon content: ${status.sources.POKEMON}`);
	 * console.log(`Nintendo content: ${status.sources.NINTENDO}`);
	 * console.log(`Roblox content: ${status.sources.ROBLOX}`);
	 * console.log(`Expired items: ${status.expiredItems}`);
	 * console.log(`Last update: ${status.lastUpdate.toLocaleDateString()}`);
	 *
	 * @performance Queries IndexedDB for accurate counts
	 * @since 1.0.0
	 */
	async getCacheStatus(): Promise<CacheStatus> {
		try {
			const allCachedContent = await dbManager.getAll('content_cache');

			// Count by source
			const sourceCounts = {
				[ContentSource.POKEMON]: 0,
				[ContentSource.NINTENDO]: 0,
				[ContentSource.ROBLOX]: 0
			};

			let expiredItems = 0;
			const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

			for (const item of allCachedContent) {
				if (item.source in sourceCounts) {
					sourceCounts[item.source as ContentSource]++;
				}

				if (new Date(item.dateAdded) < oneWeekAgo) {
					expiredItems++;
				}
			}

			return {
				lastUpdate: this.lastCacheUpdate,
				totalItems: allCachedContent.length,
				sources: sourceCounts,
				expiredItems
			};
		} catch (error) {
			console.error('Failed to get cache status:', error);

			// Return minimal status on error
			return {
				lastUpdate: new Date(0),
				totalItems: 0,
				sources: {
					[ContentSource.POKEMON]: 0,
					[ContentSource.NINTENDO]: 0,
					[ContentSource.ROBLOX]: 0
				},
				expiredItems: 0
			};
		}
	}

	/**
	 * Removes expired content from both memory cache and persistent storage.
	 * Maintains cache efficiency by removing content older than one week.
	 *
	 * @returns {Promise<void>}
	 *
	 * @example
	 * // Clean up old content during app startup
	 * await contentService.clearExpiredContent();
	 * console.log('Expired typing content removed from cache');
	 *
	 * @performance Batch removes expired items to minimize database operations
	 * @since 1.0.0
	 */
	async clearExpiredContent(): Promise<void> {
		try {
			const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
			const allContent = await dbManager.getAll('content_cache');

			for (const item of allContent) {
				if (new Date(item.dateAdded) < oneWeekAgo) {
					await dbManager.delete('content_cache', item.id);
				}
			}
		} catch (error) {
			console.warn('Failed to clear expired content:', error);
		}
	}

	/**
	 * Loads content from static JSON files hosted in the public directory.
	 * Handles network errors gracefully and continues with available sources.
	 *
	 * @private
	 * @param {ContentSource} [source] - Optional source to load, or all sources if undefined
	 * @returns {Promise<unknown[]>} Raw content data before validation
	 *
	 * @example
	 * // Internal usage - loads from /content/pokemon.json, /content/nintendo.json, etc.
	 * const rawContent = await this.loadFromStaticFiles(ContentSource.POKEMON);
	 *
	 * @performance Fetches multiple sources in parallel when loading all content
	 * @since 1.0.0
	 */
	private async loadFromStaticFiles(source?: ContentSource): Promise<unknown[]> {
		const sources = source
			? [source]
			: [ContentSource.POKEMON, ContentSource.NINTENDO, ContentSource.ROBLOX];
		const allContent: unknown[] = [];

		for (const src of sources) {
			try {
				const response = await fetch(`/content/${src}.json`);
				if (!response.ok) {
					console.warn(`Failed to load ${src} content: ${response.status}`);
					continue;
				}

				const content = await response.json();
				if (Array.isArray(content)) {
					allContent.push(...content);
				}
			} catch (error) {
				console.warn(`Error loading ${src} content:`, error);
			}
		}

		return allContent;
	}

	/**
	 * Updates persistent content cache in IndexedDB with new validated content.
	 * Ensures cache consistency by clearing old data before storing new items.
	 *
	 * @private
	 * @param {ContentItem[]} content - Validated content items to store
	 * @returns {Promise<void>}
	 *
	 * @performance Batch operations for efficient database updates
	 * @since 1.0.0
	 */
	private async updateContentCache(content: ContentItem[]): Promise<void> {
		try {
			// Clear existing cache
			await dbManager.clear('content_cache');

			// Store new content
			for (const item of content) {
				await dbManager.put('content_cache', item);
			}
		} catch (error) {
			console.warn('Failed to update content cache in IndexedDB:', error);
		}
	}

	/**
	 * Retrieves fallback content from IndexedDB or hardcoded defaults when loading fails.
	 * Ensures the app always has typing content available for kids to practice.
	 *
	 * @private
	 * @param {ContentSource} [source] - Optional source filter for fallback content
	 * @returns {Promise<ContentItem[]>} Fallback content items
	 *
	 * @example
	 * // Internal fallback when network fails
	 * const fallback = await this.getFallbackContent();
	 * // Returns basic typing exercises like "The quick brown fox..."
	 *
	 * @performance Uses cached data or minimal hardcoded content
	 * @since 1.0.0
	 */
	private async getFallbackContent(source?: ContentSource): Promise<ContentItem[]> {
		try {
			// Try to get from IndexedDB cache
			const cachedContent = await dbManager.getAll('content_cache');

			if (source) {
				return cachedContent.filter((item) => item.source === source);
			}

			return cachedContent;
		} catch {
			console.warn('Failed to get fallback content from cache');

			// Return minimal hardcoded fallback
			return this.getHardcodedFallback(source);
		}
	}

	/**
	 * Creates a single fallback content item when no content matches criteria.
	 * Provides basic typing practice to ensure kids always have something to type.
	 *
	 * @private
	 * @param {ContentCriteria} criteria - Original search criteria for context
	 * @returns {ContentItem} Single fallback content item
	 *
	 * @example
	 * // Internal usage when specific criteria yield no results
	 * const fallback = this.getFallbackContentItem({ difficulty: DifficultyLevel.ADVANCED });
	 * // Returns: "Default practice text when no matches found."
	 *
	 * @since 1.0.0
	 */
	private getFallbackContentItem(criteria: ContentCriteria): ContentItem {
		const fallbackSource = criteria.source || ContentSource.POKEMON;
		const fallbackDifficulty = criteria.difficulty || DifficultyLevel.BEGINNER;

		return {
			id: 'fallback-001',
			title: 'Fallback Content',
			text: 'Default practice text when no matches found.',
			source: fallbackSource,
			difficulty: fallbackDifficulty,
			theme: ThemeCategory.NEWS,
			wordCount: 8,
			estimatedWPM: 15,
			dateAdded: new Date(),
			ageAppropriate: true,
			specialChallenge: false
		};
	}

	/**
	 * Provides hardcoded minimal content as last resort fallback.
	 * Includes classic typing practice sentences that work offline.
	 *
	 * @private
	 * @param {ContentSource} [source] - Source to assign to fallback content
	 * @returns {ContentItem[]} Array of basic hardcoded content items
	 *
	 * @example
	 * // Internal usage when all other content sources fail
	 * const minimal = this.getHardcodedFallback();
	 * // Returns classic phrases like "The quick brown fox jumps over the lazy dog"
	 *
	 * @since 1.0.0
	 */
	private getHardcodedFallback(source?: ContentSource): ContentItem[] {
		const defaultSource = source || ContentSource.POKEMON;

		return [
			{
				id: 'fallback-basic-001',
				title: 'Basic Practice',
				text: 'The quick brown fox jumps over the lazy dog.',
				source: defaultSource,
				difficulty: DifficultyLevel.BEGINNER,
				theme: ThemeCategory.NEWS,
				wordCount: 9,
				estimatedWPM: 15,
				dateAdded: new Date(),
				ageAppropriate: true,
				specialChallenge: false
			},
			{
				id: 'fallback-basic-002',
				title: 'Simple Words',
				text: 'Cat dog bird fish sun moon star tree flower water.',
				source: defaultSource,
				difficulty: DifficultyLevel.BEGINNER,
				theme: ThemeCategory.NEWS,
				wordCount: 10,
				estimatedWPM: 12,
				dateAdded: new Date(),
				ageAppropriate: true,
				specialChallenge: false
			}
		];
	}

	/**
	 * @private
	 * @description Tracks recently used content IDs to prevent repetition in practice sessions.
	 * Set is cleaned hourly to manage memory usage and allow content reuse.
	 * @since 1.0.0
	 */
	private usedContentIds: Set<string> = new Set();

	/**
	 * @private
	 * @description Timestamp of last cleanup operation for usage tracking.
	 * @since 1.0.0
	 */
	private lastUsageCleanup: Date = new Date();

	/**
	 * Checks if content was recently used to avoid repetition in practice sessions.
	 * Automatically cleans up tracking data every hour to manage memory.
	 *
	 * @private
	 * @param {string} contentId - Content ID to check for recent usage
	 * @returns {boolean} True if content was recently used, false otherwise
	 *
	 * @performance Includes automatic cleanup to prevent memory leaks
	 * @since 1.0.0
	 */
	private isContentRecentlyUsed(contentId: string): boolean {
		// Clean up old usage tracking every hour
		if (Date.now() - this.lastUsageCleanup.getTime() > 60 * 60 * 1000) {
			this.usedContentIds.clear();
			this.lastUsageCleanup = new Date();
		}

		return this.usedContentIds.has(contentId);
	}

	/**
	 * Marks content as recently used and manages tracking set size.
	 * Prevents unlimited growth by maintaining a maximum of 100 tracked items.
	 *
	 * @private
	 * @param {string} contentId - Content ID to mark as used
	 * @returns {void}
	 *
	 * @performance Limits tracking set size to prevent memory issues
	 * @since 1.0.0
	 */
	private markContentAsUsed(contentId: string): void {
		this.usedContentIds.add(contentId);

		// Limit size to prevent memory issues
		if (this.usedContentIds.size > 100) {
			const firstFifty = Array.from(this.usedContentIds).slice(0, 50);
			this.usedContentIds.clear();
			firstFifty.forEach((id) => this.usedContentIds.add(id));
		}
	}
}

// Export singleton instance
export const contentService = new ContentService();
