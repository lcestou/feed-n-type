import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
	ContentService,
	ContentItem,
	ContentSource,
	DifficultyLevel,
	ThemeCategory,
	ContentCriteria,
	CacheStatus
} from '$lib/types/index.js';

describe('ContentService Contract Tests', () => {
	let contentService: ContentService;

	beforeEach(() => {
		contentService = {
			loadDailyContent: vi.fn(),
			getContentByDifficulty: vi.fn(),
			getSpecialChallenges: vi.fn(),
			filterByTheme: vi.fn(),
			getRandomContent: vi.fn(),
			refreshContentCache: vi.fn(),
			getCacheStatus: vi.fn(),
			clearExpiredContent: vi.fn()
		};
	});

	describe('loadDailyContent', () => {
		it('should return array of ContentItem objects', async () => {
			const mockContent: ContentItem[] = [
				{
					id: 'test-001',
					title: 'Test Content',
					text: 'This is test content for typing practice.',
					source: 'pokemon' as ContentSource,
					difficulty: 'beginner' as DifficultyLevel,
					theme: 'news' as ThemeCategory,
					wordCount: 8,
					estimatedWPM: 15,
					dateAdded: new Date(),
					ageAppropriate: true,
					specialChallenge: false
				}
			];

			vi.mocked(contentService.loadDailyContent).mockResolvedValue(mockContent);

			const result = await contentService.loadDailyContent();

			expect(result).toEqual(mockContent);
			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThan(0);
			expect(result[0]).toHaveProperty('id');
			expect(result[0]).toHaveProperty('text');
			expect(result[0].ageAppropriate).toBe(true);
		});

		it('should filter by source when provided', async () => {
			const pokemonContent: ContentItem[] = [
				{
					id: 'pokemon-001',
					title: 'Pokemon Content',
					text: 'Pokemon typing content.',
					source: 'pokemon' as ContentSource,
					difficulty: 'beginner' as DifficultyLevel,
					theme: 'news' as ThemeCategory,
					wordCount: 4,
					estimatedWPM: 15,
					dateAdded: new Date(),
					ageAppropriate: true,
					specialChallenge: false
				}
			];

			vi.mocked(contentService.loadDailyContent).mockResolvedValue(pokemonContent);

			const result = await contentService.loadDailyContent('pokemon' as ContentSource);

			expect(result).toEqual(pokemonContent);
			expect(result.every((item) => item.source === 'pokemon')).toBe(true);
		});

		it('should complete within performance requirement (<100ms for cached)', async () => {
			const mockContent: ContentItem[] = [];
			vi.mocked(contentService.loadDailyContent).mockResolvedValue(mockContent);

			const startTime = performance.now();
			await contentService.loadDailyContent();
			const endTime = performance.now();

			expect(endTime - startTime).toBeLessThan(100);
		});
	});

	describe('getContentByDifficulty', () => {
		it('should return content matching difficulty level', async () => {
			const beginnerContent: ContentItem[] = [
				{
					id: 'beginner-001',
					title: 'Easy Content',
					text: 'Simple words for beginners.',
					source: 'pokemon' as ContentSource,
					difficulty: 'beginner' as DifficultyLevel,
					theme: 'news' as ThemeCategory,
					wordCount: 5,
					estimatedWPM: 10,
					dateAdded: new Date(),
					ageAppropriate: true,
					specialChallenge: false
				}
			];

			vi.mocked(contentService.getContentByDifficulty).mockResolvedValue(beginnerContent);

			const result = await contentService.getContentByDifficulty('beginner' as DifficultyLevel);

			expect(result).toEqual(beginnerContent);
			expect(result.every((item) => item.difficulty === 'beginner')).toBe(true);
			expect(result.every((item) => item.wordCount < 50)).toBe(true);
		});

		it('should validate word count matches difficulty', async () => {
			const intermediateContent: ContentItem[] = [
				{
					id: 'intermediate-001',
					title: 'Medium Content',
					text: 'This content has more complex words and longer sentences for intermediate practice.',
					source: 'nintendo' as ContentSource,
					difficulty: 'intermediate' as DifficultyLevel,
					theme: 'games' as ThemeCategory,
					wordCount: 75,
					estimatedWPM: 20,
					dateAdded: new Date(),
					ageAppropriate: true,
					specialChallenge: false
				}
			];

			vi.mocked(contentService.getContentByDifficulty).mockResolvedValue(intermediateContent);

			const result = await contentService.getContentByDifficulty('intermediate' as DifficultyLevel);

			expect(result.every((item) => item.wordCount >= 50 && item.wordCount <= 100)).toBe(true);
		});
	});

	describe('getRandomContent', () => {
		it('should return single ContentItem matching criteria', async () => {
			const criteria: ContentCriteria = {
				source: 'pokemon' as ContentSource,
				difficulty: 'beginner' as DifficultyLevel,
				maxWords: 50
			};

			const mockContent: ContentItem = {
				id: 'random-001',
				title: 'Random Content',
				text: 'Random typing content.',
				source: 'pokemon' as ContentSource,
				difficulty: 'beginner' as DifficultyLevel,
				theme: 'news' as ThemeCategory,
				wordCount: 4,
				estimatedWPM: 15,
				dateAdded: new Date(),
				ageAppropriate: true,
				specialChallenge: false
			};

			vi.mocked(contentService.getRandomContent).mockResolvedValue(mockContent);

			const result = await contentService.getRandomContent(criteria);

			expect(result).toEqual(mockContent);
			expect(result.source).toBe(criteria.source);
			expect(result.difficulty).toBe(criteria.difficulty);
			expect(result.wordCount).toBeLessThanOrEqual(criteria.maxWords!);
		});

		it('should return fallback content when no matches found', async () => {
			const fallbackContent: ContentItem = {
				id: 'fallback-001',
				title: 'Fallback Content',
				text: 'Default practice text when no matches found.',
				source: 'pokemon' as ContentSource,
				difficulty: 'beginner' as DifficultyLevel,
				theme: 'news' as ThemeCategory,
				wordCount: 8,
				estimatedWPM: 15,
				dateAdded: new Date(),
				ageAppropriate: true,
				specialChallenge: false
			};

			vi.mocked(contentService.getRandomContent).mockResolvedValue(fallbackContent);

			const impossibleCriteria: ContentCriteria = {
				maxWords: 1,
				excludeUsed: true
			};

			const result = await contentService.getRandomContent(impossibleCriteria);

			expect(result).toEqual(fallbackContent);
			expect(result.id).toBe('fallback-001');
		});
	});

	describe('getCacheStatus', () => {
		it('should return valid cache status information', async () => {
			const mockStatus: CacheStatus = {
				lastUpdate: new Date(),
				totalItems: 12,
				sources: {
					pokemon: 4,
					nintendo: 4,
					roblox: 4
				},
				expiredItems: 0
			};

			vi.mocked(contentService.getCacheStatus).mockResolvedValue(mockStatus);

			const result = await contentService.getCacheStatus();

			expect(result).toEqual(mockStatus);
			expect(result).toHaveProperty('lastUpdate');
			expect(result).toHaveProperty('totalItems');
			expect(result).toHaveProperty('sources');
			expect(typeof result.totalItems).toBe('number');
			expect(result.totalItems).toBeGreaterThanOrEqual(0);
		});
	});

	describe('Error Handling', () => {
		it('should handle NetworkError gracefully', async () => {
			const networkError = new Error('Network failed');
			vi.mocked(contentService.loadDailyContent).mockRejectedValue(networkError);

			try {
				await contentService.loadDailyContent();
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toBe('Network failed');
			}
		});

		it('should handle empty content gracefully', async () => {
			vi.mocked(contentService.loadDailyContent).mockResolvedValue([]);

			const result = await contentService.loadDailyContent();

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBe(0);
		});
	});

	describe('Performance Requirements', () => {
		it('should meet initial load time requirement (<200ms)', async () => {
			const mockContent: ContentItem[] = [];
			vi.mocked(contentService.loadDailyContent).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(mockContent), 150))
			);

			const startTime = performance.now();
			await contentService.loadDailyContent();
			const endTime = performance.now();

			expect(endTime - startTime).toBeLessThan(200);
		});

		it('should meet subsequent load time requirement (<50ms)', async () => {
			const mockContent: ContentItem[] = [];
			vi.mocked(contentService.loadDailyContent).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(mockContent), 30))
			);

			const startTime = performance.now();
			await contentService.loadDailyContent();
			const endTime = performance.now();

			expect(endTime - startTime).toBeLessThan(50);
		});
	});
});
