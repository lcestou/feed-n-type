/**
 * ContentService Implementation
 *
 * Provides content filtering, caching, and recommendation functionality
 * for the gamified typing trainer. Handles age-appropriate content from
 * Pokemon, Nintendo, and Roblox sources with performance optimization.
 */

import type {
	ContentService as IContentService,
	ContentItem,
	ContentSource,
	DifficultyLevel,
	ThemeCategory,
	ContentCriteria,
	CacheStatus
} from '$lib/types/index.js';
import { ContentItemModel } from '$lib/models/ContentItem.js';
import { dbManager } from '$lib/storage/db.js';

export class ContentService implements IContentService {
	private cache: Map<string, ContentItem[]> = new Map();
	private lastCacheUpdate: Date = new Date(0);
	private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

	/**
	 * Load daily content with optional source filtering
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
				const model = new ContentItemModel(rawItem);
				if (model.validateContent().isValid) {
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
	 * Get content filtered by difficulty level
	 */
	async getContentByDifficulty(difficulty: DifficultyLevel): Promise<ContentItem[]> {
		const allContent = await this.loadDailyContent();

		return allContent.filter((item) => {
			if (item.difficulty !== difficulty) return false;

			// Validate word count matches difficulty expectations
			switch (difficulty) {
				case 'beginner':
					return item.wordCount < 50;
				case 'intermediate':
					return item.wordCount >= 50 && item.wordCount <= 100;
				case 'advanced':
					return item.wordCount > 100;
				default:
					return true;
			}
		});
	}

	/**
	 * Get special challenge content (longer, more complex content)
	 */
	async getSpecialChallenges(): Promise<ContentItem[]> {
		const allContent = await this.loadDailyContent();

		return allContent.filter(
			(item) => item.specialChallenge || (item.difficulty === 'advanced' && item.wordCount > 150)
		);
	}

	/**
	 * Filter content by theme category
	 */
	async filterByTheme(theme: ThemeCategory, source?: ContentSource): Promise<ContentItem[]> {
		const allContent = await this.loadDailyContent(source);

		return allContent.filter((item) => item.theme === theme);
	}

	/**
	 * Get random content matching criteria with intelligent fallback
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
	 * Refresh content cache from static files
	 */
	async refreshContentCache(): Promise<void> {
		try {
			// Clear existing cache
			this.cache.clear();

			// Load fresh content for all sources
			const sources: ContentSource[] = ['pokemon', 'nintendo', 'roblox'];

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
	 * Get cache status information
	 */
	async getCacheStatus(): Promise<CacheStatus> {
		try {
			const allCachedContent = await dbManager.getAll('content_cache');

			// Count by source
			const sourceCounts = {
				pokemon: 0,
				nintendo: 0,
				roblox: 0
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
				sources: { pokemon: 0, nintendo: 0, roblox: 0 },
				expiredItems: 0
			};
		}
	}

	/**
	 * Clear expired content from cache and storage
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
	 * Load content from static JSON files
	 */
	private async loadFromStaticFiles(source?: ContentSource): Promise<unknown[]> {
		const sources = source ? [source] : ['pokemon', 'nintendo', 'roblox'];
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
	 * Update content cache in IndexedDB
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
	 * Get fallback content when primary loading fails
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
	 * Get fallback content item when no matches found
	 */
	private getFallbackContentItem(criteria: ContentCriteria): ContentItem {
		const fallbackSource = criteria.source || 'pokemon';
		const fallbackDifficulty = criteria.difficulty || 'beginner';

		return {
			id: 'fallback-001',
			title: 'Fallback Content',
			text: 'Default practice text when no matches found.',
			source: fallbackSource,
			difficulty: fallbackDifficulty,
			theme: 'news',
			wordCount: 8,
			estimatedWPM: 15,
			dateAdded: new Date(),
			ageAppropriate: true,
			specialChallenge: false
		};
	}

	/**
	 * Get hardcoded minimal fallback content
	 */
	private getHardcodedFallback(source?: ContentSource): ContentItem[] {
		const defaultSource = source || 'pokemon';

		return [
			{
				id: 'fallback-basic-001',
				title: 'Basic Practice',
				text: 'The quick brown fox jumps over the lazy dog.',
				source: defaultSource,
				difficulty: 'beginner',
				theme: 'news',
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
				difficulty: 'beginner',
				theme: 'news',
				wordCount: 10,
				estimatedWPM: 12,
				dateAdded: new Date(),
				ageAppropriate: true,
				specialChallenge: false
			}
		];
	}

	/**
	 * Track recently used content (basic implementation)
	 */
	private usedContentIds: Set<string> = new Set();
	private lastUsageCleanup: Date = new Date();

	private isContentRecentlyUsed(contentId: string): boolean {
		// Clean up old usage tracking every hour
		if (Date.now() - this.lastUsageCleanup.getTime() > 60 * 60 * 1000) {
			this.usedContentIds.clear();
			this.lastUsageCleanup = new Date();
		}

		return this.usedContentIds.has(contentId);
	}

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
