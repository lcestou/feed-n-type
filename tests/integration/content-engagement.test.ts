import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type {
	ContentItem,
	ContentSource,
	DifficultyLevel,
	ThemeCategory,
	EmotionalState,
	SessionSummary,
	Achievement,
	AchievementRarity
} from '$lib/types/index.js';

describe('Integration Test: Content Variety & Engagement', () => {
	let mockContentService: vi.Mocked<{
		loadDailyContent: () => Promise<ContentItem[]>;
		getContentBySource: (source: ContentSource) => Promise<ContentItem[]>;
		getContentByDifficulty: (difficulty: DifficultyLevel) => Promise<ContentItem[]>;
		getContentByTheme: (theme: ThemeCategory) => Promise<ContentItem[]>;
	}>;
	let mockPetStateService: vi.Mocked<{
		feedWord: (isCorrect: boolean) => Promise<void>;
		getCurrentState: () => Promise<{ emotionalState: EmotionalState }>;
	}>;
	let mockProgressService: vi.Mocked<{
		endSession: () => Promise<SessionSummary>;
	}>;
	let mockAchievementService: vi.Mocked<{
		checkForNewAchievements: () => Promise<Achievement[]>;
	}>;

	beforeEach(() => {
		mockContentService = {
			loadDailyContent: vi.fn(),
			getContentBySource: vi.fn(),
			getContentByDifficulty: vi.fn(),
			getContentByTheme: vi.fn(),
			getRandomContent: vi.fn(),
			validateAgeAppropriate: vi.fn(),
			cacheContent: vi.fn()
		};

		mockPetStateService = {
			loadPetState: vi.fn(),
			feedWord: vi.fn(),
			updateHappiness: vi.fn(),
			triggerEmotionalState: vi.fn()
		};

		mockProgressService = {
			startSession: vi.fn(),
			recordKeypress: vi.fn(),
			endSession: vi.fn(),
			calculateEngagementScore: vi.fn()
		};

		mockAchievementService = {
			checkAchievements: vi.fn(),
			unlockAchievement: vi.fn(),
			queueCelebration: vi.fn()
		};

		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Scenario: Child engages with diverse gaming content types', () => {
		it('should load varied content from different gaming sources', async () => {
			const pokemonContent: ContentItem[] = [
				{
					id: 'pokemon-adventure-001',
					title: 'Pokemon Adventure Story',
					text: 'Pikachu and Ash went on an exciting journey through the forest.',
					source: 'pokemon' as ContentSource,
					difficulty: 'beginner' as DifficultyLevel,
					theme: 'adventure' as ThemeCategory,
					wordCount: 11,
					estimatedWPM: 15,
					dateAdded: new Date(),
					ageAppropriate: true,
					specialChallenge: false
				}
			];

			const nintendoContent: ContentItem[] = [
				{
					id: 'nintendo-mario-001',
					title: 'Super Mario World',
					text: 'Mario jumped over the goomba and collected shiny coins in the castle.',
					source: 'nintendo' as ContentSource,
					difficulty: 'intermediate' as DifficultyLevel,
					theme: 'platformer' as ThemeCategory,
					wordCount: 12,
					estimatedWPM: 18,
					dateAdded: new Date(),
					ageAppropriate: true,
					specialChallenge: false
				}
			];

			const robloxContent: ContentItem[] = [
				{
					id: 'roblox-building-001',
					title: 'Roblox Creation Mode',
					text: 'Build amazing structures with blocks and share them with friends online.',
					source: 'roblox' as ContentSource,
					difficulty: 'intermediate' as DifficultyLevel,
					theme: 'building' as ThemeCategory,
					wordCount: 12,
					estimatedWPM: 20,
					dateAdded: new Date(),
					ageAppropriate: true,
					specialChallenge: false
				}
			];

			mockContentService.getContentBySource
				.mockResolvedValueOnce(pokemonContent)
				.mockResolvedValueOnce(nintendoContent)
				.mockResolvedValueOnce(robloxContent);

			const [pokemon, nintendo, roblox] = await Promise.all([
				mockContentService.getContentBySource('pokemon'),
				mockContentService.getContentBySource('nintendo'),
				mockContentService.getContentBySource('roblox')
			]);

			expect(pokemon).toHaveLength(1);
			expect(nintendo).toHaveLength(1);
			expect(roblox).toHaveLength(1);

			expect(pokemon[0].source).toBe('pokemon');
			expect(nintendo[0].source).toBe('nintendo');
			expect(roblox[0].source).toBe('roblox');

			expect(pokemon[0].ageAppropriate).toBe(true);
			expect(nintendo[0].ageAppropriate).toBe(true);
			expect(roblox[0].ageAppropriate).toBe(true);
		});

		it('should adapt content difficulty based on child performance', async () => {
			const beginnerContent: ContentItem = {
				id: 'beginner-001',
				title: 'Easy Pokemon Words',
				text: 'Pikachu is cute and yellow.',
				source: 'pokemon' as ContentSource,
				difficulty: 'beginner' as DifficultyLevel,
				theme: 'characters' as ThemeCategory,
				wordCount: 5,
				estimatedWPM: 12,
				dateAdded: new Date(),
				ageAppropriate: true,
				specialChallenge: false
			};

			const intermediateContent: ContentItem = {
				id: 'intermediate-001',
				title: 'Pokemon Battle Strategy',
				text: 'Choose your Pokemon team carefully before entering the challenging gym battle.',
				source: 'pokemon' as ContentSource,
				difficulty: 'intermediate' as DifficultyLevel,
				theme: 'strategy' as ThemeCategory,
				wordCount: 11,
				estimatedWPM: 18,
				dateAdded: new Date(),
				ageAppropriate: true,
				specialChallenge: false
			};

			const advancedContent: ContentItem = {
				id: 'advanced-001',
				title: 'Pokemon Championship Tournament',
				text: 'Professional trainers demonstrate sophisticated battle techniques during the championship tournament.',
				source: 'pokemon' as ContentSource,
				difficulty: 'advanced' as DifficultyLevel,
				theme: 'competition' as ThemeCategory,
				wordCount: 11,
				estimatedWPM: 25,
				dateAdded: new Date(),
				ageAppropriate: true,
				specialChallenge: true
			};

			mockContentService.getContentByDifficulty
				.mockResolvedValueOnce([beginnerContent])
				.mockResolvedValueOnce([intermediateContent])
				.mockResolvedValueOnce([advancedContent]);

			// Simulate progression through difficulty levels
			const progression = ['beginner', 'intermediate', 'advanced'] as DifficultyLevel[];
			const contentProgression = [];

			for (const difficulty of progression) {
				const content = await mockContentService.getContentByDifficulty(difficulty);
				contentProgression.push(content[0]);
			}

			expect(contentProgression).toHaveLength(3);
			expect(contentProgression[0].difficulty).toBe('beginner');
			expect(contentProgression[1].difficulty).toBe('intermediate');
			expect(contentProgression[2].difficulty).toBe('advanced');

			expect(contentProgression[0].estimatedWPM).toBeLessThan(contentProgression[1].estimatedWPM);
			expect(contentProgression[1].estimatedWPM).toBeLessThan(contentProgression[2].estimatedWPM);
			expect(contentProgression[2].specialChallenge).toBe(true);
		});

		it('should provide thematic content variety for sustained engagement', async () => {
			const themeCategories: ThemeCategory[] = [
				'adventure',
				'characters',
				'building',
				'strategy',
				'exploration',
				'friendship'
			];

			const thematicContent = themeCategories.map((theme, index) => ({
				id: `theme-${theme}-001`,
				title: `${theme.charAt(0).toUpperCase() + theme.slice(1)} Content`,
				text: `This is engaging ${theme} content for typing practice.`,
				source: (['pokemon', 'nintendo', 'roblox'] as ContentSource[])[index % 3],
				difficulty: 'intermediate' as DifficultyLevel,
				theme: theme,
				wordCount: 8,
				estimatedWPM: 18,
				dateAdded: new Date(),
				ageAppropriate: true,
				specialChallenge: false
			}));

			themeCategories.forEach((theme, index) => {
				mockContentService.getContentByTheme.mockResolvedValueOnce([thematicContent[index]]);
			});

			const loadedThemes = [];
			for (const theme of themeCategories) {
				const content = await mockContentService.getContentByTheme(theme);
				loadedThemes.push(content[0]);
			}

			expect(loadedThemes).toHaveLength(6);
			expect(new Set(loadedThemes.map((c) => c.theme)).size).toBe(6); // All unique themes
			expect(loadedThemes.every((c) => c.ageAppropriate)).toBe(true);
			expect(new Set(loadedThemes.map((c) => c.source)).size).toBe(3); // Multiple sources represented
		});

		it('should track engagement metrics across content types', async () => {
			const engagementSessions = [
				{
					contentSource: 'pokemon' as ContentSource,
					sessionDuration: 900000, // 15 minutes
					wordsTyped: 45,
					accuracy: 88,
					enjoymentScore: 9
				},
				{
					contentSource: 'nintendo' as ContentSource,
					sessionDuration: 1200000, // 20 minutes
					wordsTyped: 60,
					accuracy: 85,
					enjoymentScore: 8
				},
				{
					contentSource: 'roblox' as ContentSource,
					sessionDuration: 1500000, // 25 minutes
					wordsTyped: 75,
					accuracy: 82,
					enjoymentScore: 9
				}
			];

			mockProgressService.calculateEngagementScore
				.mockResolvedValueOnce(8.5)
				.mockResolvedValueOnce(7.8)
				.mockResolvedValueOnce(8.9);

			const engagementScores = [];
			for (const session of engagementSessions) {
				const score = await mockProgressService.calculateEngagementScore(session);
				engagementScores.push(score);
			}

			expect(engagementScores).toHaveLength(3);
			expect(engagementScores.every((score) => score >= 7 && score <= 10)).toBe(true);
			expect(Math.max(...engagementScores)).toBeGreaterThan(8);

			// Verify longer sessions correlate with higher engagement
			const robloxSession = engagementSessions[2];
			expect(robloxSession.sessionDuration).toBeGreaterThan(engagementSessions[0].sessionDuration);
			expect(engagementScores[2]).toBeGreaterThan(engagementScores[0]);
		});

		it('should unlock content-specific achievements', async () => {
			const contentAchievements: Achievement[] = [
				{
					id: 'pokemon-master',
					title: 'Pokemon Master!',
					description: 'Completed 10 Pokemon typing sessions',
					icon: 'pokeball',
					points: 100,
					rarity: 'uncommon' as AchievementRarity,
					dateEarned: new Date()
				},
				{
					id: 'nintendo-hero',
					title: 'Nintendo Hero!',
					description: 'Mastered Mario-themed content',
					icon: 'mushroom',
					points: 75,
					rarity: 'common' as AchievementRarity,
					dateEarned: new Date()
				},
				{
					id: 'roblox-builder',
					title: 'Master Builder!',
					description: 'Completed all building-themed challenges',
					icon: 'blocks',
					points: 125,
					rarity: 'rare' as AchievementRarity,
					dateEarned: new Date()
				}
			];

			mockAchievementService.checkAchievements.mockResolvedValue(contentAchievements);

			const achievements = await mockAchievementService.checkAchievements({
				pokemonSessions: 10,
				nintendoMastery: true,
				robloxChallengesCompleted: 5
			});

			expect(achievements).toHaveLength(3);
			expect(achievements.map((a) => a.icon)).toEqual(['pokeball', 'mushroom', 'blocks']);
			expect(achievements.some((a) => a.rarity === 'rare')).toBe(true);
			expect(achievements.every((a) => a.points > 0)).toBe(true);
		});

		it('should trigger appropriate pet reactions to different content types', async () => {
			const contentReactions = [
				{
					contentSource: 'pokemon' as ContentSource,
					petReaction: EmotionalState.EXCITED,
					happinessBoost: 8,
					specialAnimation: 'pokemon-dance'
				},
				{
					contentSource: 'nintendo' as ContentSource,
					petReaction: EmotionalState.HAPPY,
					happinessBoost: 6,
					specialAnimation: 'mario-jump'
				},
				{
					contentSource: 'roblox' as ContentSource,
					petReaction: EmotionalState.PLAYFUL,
					happinessBoost: 7,
					specialAnimation: 'building-blocks'
				}
			];

			mockPetStateService.feedWord.mockImplementation(
				(word: string, correct: boolean, source: ContentSource) => {
					const reaction = contentReactions.find((r) => r.contentSource === source);
					return Promise.resolve({
						wordAccepted: correct,
						happinessChange: reaction?.happinessBoost || 5,
						newEmotionalState: reaction?.petReaction || EmotionalState.CONTENT,
						evolutionTriggered: false,
						celebrationQueued: false,
						specialAnimation: reaction?.specialAnimation
					});
				}
			);

			const reactions = [];
			for (const content of contentReactions) {
				const result = await mockPetStateService.feedWord('test', true, content.contentSource);
				reactions.push(result);
			}

			expect(reactions).toHaveLength(3);
			expect(reactions[0].newEmotionalState).toBe(EmotionalState.EXCITED);
			expect(reactions[1].newEmotionalState).toBe(EmotionalState.HAPPY);
			expect(reactions[2].newEmotionalState).toBe(EmotionalState.PLAYFUL);
			expect(reactions.every((r) => r.happinessChange > 5)).toBe(true);
		});

		it('should maintain content freshness and prevent repetition fatigue', async () => {
			const dailyRotation = [
				{
					day: 1,
					primarySource: 'pokemon' as ContentSource,
					secondarySource: 'nintendo' as ContentSource
				},
				{
					day: 2,
					primarySource: 'nintendo' as ContentSource,
					secondarySource: 'roblox' as ContentSource
				},
				{
					day: 3,
					primarySource: 'roblox' as ContentSource,
					secondarySource: 'pokemon' as ContentSource
				},
				{
					day: 4,
					primarySource: 'pokemon' as ContentSource,
					secondarySource: 'roblox' as ContentSource
				},
				{
					day: 5,
					primarySource: 'nintendo' as ContentSource,
					secondarySource: 'pokemon' as ContentSource
				},
				{
					day: 6,
					primarySource: 'roblox' as ContentSource,
					secondarySource: 'nintendo' as ContentSource
				},
				{
					day: 7,
					primarySource: 'pokemon' as ContentSource,
					secondarySource: 'nintendo' as ContentSource
				}
			];

			mockContentService.loadDailyContent.mockImplementation((day: number) => {
				const rotation = dailyRotation[day - 1];
				return Promise.resolve([
					{
						id: `daily-${day}-primary`,
						source: rotation.primarySource,
						text: `Daily ${rotation.primarySource} content for day ${day}`
					},
					{
						id: `daily-${day}-secondary`,
						source: rotation.secondarySource,
						text: `Daily ${rotation.secondarySource} content for day ${day}`
					}
				]);
			});

			const weeklyContent = [];
			for (let day = 1; day <= 7; day++) {
				const content = await mockContentService.loadDailyContent(day);
				weeklyContent.push(...content);
			}

			expect(weeklyContent).toHaveLength(14); // 2 per day × 7 days

			const sourceDistribution = weeklyContent.reduce(
				(acc, content) => {
					acc[content.source] = (acc[content.source] || 0) + 1;
					return acc;
				},
				{} as Record<string, number>
			);

			// Verify balanced distribution across sources
			expect(Object.keys(sourceDistribution)).toHaveLength(3);
			expect(
				Math.max(...Object.values(sourceDistribution)) -
					Math.min(...Object.values(sourceDistribution))
			).toBeLessThanOrEqual(2);
		});

		it('should provide special challenge content for advanced users', async () => {
			const specialChallenges: ContentItem[] = [
				{
					id: 'challenge-speed-001',
					title: 'Speed Challenge: Pokemon Names',
					text: 'Pikachu Charizard Blastoise Venusaur Alakazam Machamp Gengar Dragonite',
					source: 'pokemon' as ContentSource,
					difficulty: 'advanced' as DifficultyLevel,
					theme: 'speed-challenge' as ThemeCategory,
					wordCount: 8,
					estimatedWPM: 35,
					dateAdded: new Date(),
					ageAppropriate: true,
					specialChallenge: true
				},
				{
					id: 'challenge-accuracy-001',
					title: 'Accuracy Challenge: Nintendo Characters',
					text: 'Mario Luigi Peach Bowser Yoshi Toad Koopa Goomba',
					source: 'nintendo' as ContentSource,
					difficulty: 'advanced' as DifficultyLevel,
					theme: 'accuracy-challenge' as ThemeCategory,
					wordCount: 8,
					estimatedWPM: 30,
					dateAdded: new Date(),
					ageAppropriate: true,
					specialChallenge: true
				},
				{
					id: 'challenge-endurance-001',
					title: 'Endurance Challenge: Roblox Building',
					text: 'Create magnificent structures using blocks bricks materials tools design creativity imagination persistence dedication excellence achievement mastery',
					source: 'roblox' as ContentSource,
					difficulty: 'expert' as DifficultyLevel,
					theme: 'endurance-challenge' as ThemeCategory,
					wordCount: 16,
					estimatedWPM: 40,
					dateAdded: new Date(),
					ageAppropriate: true,
					specialChallenge: true
				}
			];

			mockContentService.getRandomContent.mockImplementation((filters) => {
				if (filters?.specialChallenge) {
					return Promise.resolve(specialChallenges);
				}
				return Promise.resolve([]);
			});

			const challenges = await mockContentService.getRandomContent({ specialChallenge: true });

			expect(challenges).toHaveLength(3);
			expect(challenges.every((c) => c.specialChallenge)).toBe(true);
			expect(challenges.every((c) => c.estimatedWPM >= 30)).toBe(true);
			expect(challenges.map((c) => c.theme)).toEqual([
				'speed-challenge',
				'accuracy-challenge',
				'endurance-challenge'
			]);

			// Verify escalating difficulty
			const wpmRequirements = challenges.map((c) => c.estimatedWPM);
			expect(Math.max(...wpmRequirements)).toBe(40);
			expect(Math.min(...wpmRequirements)).toBe(30);
		});
	});

	describe('Content Caching and Performance', () => {
		it('should cache frequently accessed content efficiently', async () => {
			const popularContent: ContentItem = {
				id: 'popular-pokemon-001',
				title: 'Popular Pokemon Adventure',
				text: 'Ash and Pikachu explore the wonderful world of Pokemon together.',
				source: 'pokemon' as ContentSource,
				difficulty: 'beginner' as DifficultyLevel,
				theme: 'adventure' as ThemeCategory,
				wordCount: 10,
				estimatedWPM: 15,
				dateAdded: new Date(),
				ageAppropriate: true,
				specialChallenge: false
			};

			mockContentService.cacheContent.mockResolvedValue(true);
			mockContentService.getRandomContent.mockImplementation(() => {
				// Simulate cache hit with faster response
				return new Promise((resolve) => setTimeout(() => resolve([popularContent]), 10));
			});

			const startTime = performance.now();
			const cachedContent = await mockContentService.getRandomContent();
			const endTime = performance.now();

			expect(cachedContent).toHaveLength(1);
			expect(cachedContent[0].id).toBe('popular-pokemon-001');
			expect(endTime - startTime).toBeLessThan(50); // Fast cache response

			await mockContentService.cacheContent(popularContent);
			expect(mockContentService.cacheContent).toHaveBeenCalledWith(popularContent);
		});

		it('should validate age-appropriate content filtering', async () => {
			const mixedContent: ContentItem[] = [
				{
					id: 'appropriate-001',
					title: 'Kid-Friendly Pokemon',
					text: 'Cute Pokemon play in the sunny meadow.',
					source: 'pokemon' as ContentSource,
					difficulty: 'beginner' as DifficultyLevel,
					theme: 'characters' as ThemeCategory,
					wordCount: 7,
					estimatedWPM: 12,
					dateAdded: new Date(),
					ageAppropriate: true,
					specialChallenge: false
				},
				{
					id: 'inappropriate-001',
					title: 'Mature Content',
					text: 'This content is not suitable for children.',
					source: 'nintendo' as ContentSource,
					difficulty: 'intermediate' as DifficultyLevel,
					theme: 'mature' as ThemeCategory,
					wordCount: 8,
					estimatedWPM: 18,
					dateAdded: new Date(),
					ageAppropriate: false,
					specialChallenge: false
				}
			];

			mockContentService.validateAgeAppropriate.mockImplementation((content: ContentItem[]) => {
				return Promise.resolve(content.filter((c) => c.ageAppropriate));
			});

			const filteredContent = await mockContentService.validateAgeAppropriate(mixedContent);

			expect(filteredContent).toHaveLength(1);
			expect(filteredContent[0].ageAppropriate).toBe(true);
			expect(filteredContent[0].id).toBe('appropriate-001');
			expect(filteredContent.every((c) => c.ageAppropriate)).toBe(true);
		});
	});

	describe('Engagement Analytics', () => {
		it('should track content preferences and recommend accordingly', async () => {
			const userPreferences = {
				favoriteSource: 'pokemon' as ContentSource,
				preferredThemes: ['adventure', 'characters'] as ThemeCategory[],
				averageSessionLength: 18, // minutes
				skillLevel: 'intermediate' as DifficultyLevel,
				engagementScores: {
					pokemon: 9.2,
					nintendo: 7.8,
					roblox: 8.5
				}
			};

			const recommendations = {
				nextContent: 'pokemon' as ContentSource,
				suggestedTheme: 'adventure' as ThemeCategory,
				targetDifficulty: 'intermediate' as DifficultyLevel,
				sessionLength: 20,
				specialChallenge: false
			};

			// Mock recommendation logic
			mockContentService.getRecommendedContent = vi.fn().mockResolvedValue({
				id: 'recommended-001',
				source: recommendations.nextContent,
				theme: recommendations.suggestedTheme,
				difficulty: recommendations.targetDifficulty
			});

			const recommendedContent = await mockContentService.getRecommendedContent(userPreferences);

			expect(recommendedContent.source).toBe('pokemon');
			expect(recommendedContent.theme).toBe('adventure');
			expect(recommendedContent.difficulty).toBe('intermediate');
			expect(userPreferences.engagementScores.pokemon).toBeGreaterThan(
				userPreferences.engagementScores.nintendo
			);
		});

		it('should generate comprehensive session summaries with content insights', async () => {
			const sessionSummary: SessionSummary = {
				sessionId: 'content-variety-session',
				duration: 1800000, // 30 minutes
				wordsPerMinute: 22,
				accuracyPercentage: 86,
				totalCharacters: 330,
				errorsCount: 46,
				improvementFromLastSession: 3,
				milestonesAchieved: ['Content Explorer', 'Multi-Source Mastery'],
				contentBreakdown: {
					pokemon: { words: 45, accuracy: 88, timeSpent: 600000 },
					nintendo: { words: 38, accuracy: 85, timeSpent: 480000 },
					roblox: { words: 42, accuracy: 84, timeSpent: 720000 }
				},
				engagementMetrics: {
					averageContentSwitchTime: 3000, // 3 seconds
					mostEngagingSource: 'roblox' as ContentSource,
					longestFocusTime: 720000 // 12 minutes on roblox
				}
			};

			mockProgressService.endSession.mockResolvedValue(sessionSummary);

			const summary = await mockProgressService.endSession();

			expect(summary.milestonesAchieved).toContain('Content Explorer');
			expect(summary.contentBreakdown).toHaveProperty('pokemon');
			expect(summary.contentBreakdown).toHaveProperty('nintendo');
			expect(summary.contentBreakdown).toHaveProperty('roblox');
			expect(summary.engagementMetrics.mostEngagingSource).toBe('roblox');
			expect(summary.engagementMetrics.longestFocusTime).toBe(720000);

			// Verify balanced content usage
			const totalWords = Object.values(summary.contentBreakdown).reduce(
				(sum, source) => sum + source.words,
				0
			);
			expect(totalWords).toBe(125);
			expect(Object.keys(summary.contentBreakdown)).toHaveLength(3);
		});
	});
});
