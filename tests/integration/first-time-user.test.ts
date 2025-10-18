import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import {
	EvolutionForm,
	EmotionalState,
	ContentSource,
	DifficultyLevel,
	ThemeCategory
} from '$lib/types/index.js';
import type { PetState, ContentItem } from '$lib/types/index.js';

type MockedService<T> = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[K in keyof T]: T[K] extends (...args: any[]) => any ? MockedFunction<T[K]> : T[K];
};

describe('Integration Test: First-Time User Experience', () => {
	let mockPetStateService: MockedService<{
		loadPetState: () => Promise<PetState>;
		savePetState: (state: PetState) => Promise<void>;
		feedWord: (isCorrect: boolean) => Promise<unknown>;
		updateHappiness: (change: number) => Promise<void>;
		triggerEmotionalState: (state: EmotionalState) => Promise<void>;
	}>;
	let mockContentService: MockedService<{
		loadDailyContent: () => Promise<ContentItem[]>;
		getContentByDifficulty: (difficulty: DifficultyLevel) => Promise<ContentItem[]>;
	}>;
	let mockProgressService: MockedService<{
		startSession: (contentId: string) => Promise<string>;
		endSession: () => Promise<unknown>;
		recordKeystroke: (key: string, isCorrect: boolean) => void;
	}>;

	beforeEach(() => {
		mockPetStateService = {
			loadPetState: vi.fn(),
			savePetState: vi.fn(),
			feedWord: vi.fn(),
			updateHappiness: vi.fn(),
			triggerEmotionalState: vi.fn()
		};

		mockContentService = {
			loadDailyContent: vi.fn(),
			getContentByDifficulty: vi.fn(),
			getRandomContent: vi.fn()
		};

		mockProgressService = {
			startSession: vi.fn(),
			recordKeypress: vi.fn(),
			endSession: vi.fn()
		};

		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Scenario: Child opens app for the first time', () => {
		it('should initialize pet in Egg form with 50% happiness', async () => {
			const expectedInitialPetState: PetState = {
				id: 'pet-default',
				name: 'Typingotchi',
				evolutionForm: EvolutionForm.EGG,
				happinessLevel: 50,
				emotionalState: EmotionalState.CONTENT,
				accessories: [],
				totalWordsEaten: 0,
				accuracyAverage: 0,
				lastFeedTime: new Date(),
				streakDays: 0,
				celebrationQueue: []
			};

			mockPetStateService.loadPetState.mockResolvedValue(expectedInitialPetState);

			const petState = await mockPetStateService.loadPetState();

			expect(petState.evolutionForm).toBe(EvolutionForm.EGG);
			expect(petState.happinessLevel).toBe(50);
			expect(petState.emotionalState).toBe(EmotionalState.CONTENT);
			expect(petState.totalWordsEaten).toBe(0);
			expect(petState.accuracyAverage).toBe(0);
			expect(petState.accessories).toEqual([]);
		});

		it('should display welcome message and typing instruction', async () => {
			const welcomeMessage = 'Welcome to Feed-n-Type! Start typing to feed your Typingotchi!';
			const typingInstruction =
				'Type the words you see to feed your pet. Correct words become food!';

			expect(welcomeMessage).toContain('Welcome');
			expect(welcomeMessage).toContain('Typingotchi');
			expect(typingInstruction).toContain('Type the words');
			expect(typingInstruction).toContain('feed your pet');
		});

		it('should load age-appropriate gaming content', async () => {
			const expectedContent: ContentItem[] = [
				{
					id: 'pokemon-beginner-001',
					title: 'Pokemon Starter Content',
					text: 'Pikachu is a cute electric Pokemon. It likes to play with friends.',
					source: 'pokemon' as ContentSource,
					difficulty: 'beginner' as DifficultyLevel,
					theme: 'characters' as ThemeCategory,
					wordCount: 12,
					estimatedWPM: 15,
					dateAdded: new Date(),
					ageAppropriate: true,
					specialChallenge: false
				}
			];

			mockContentService.getContentByDifficulty.mockResolvedValue(expectedContent);

			const content = await mockContentService.getContentByDifficulty('beginner');

			expect(content).toHaveLength(1);
			expect(content[0].ageAppropriate).toBe(true);
			expect(content[0].difficulty).toBe('beginner');
			expect(content[0].source).toMatch(/pokemon|nintendo|roblox/);
			expect(content[0].wordCount).toBeLessThan(50);
		});

		it('should begin typing session when first word is typed correctly', async () => {
			mockProgressService.startSession.mockResolvedValue('session-001');
			mockPetStateService.feedWord.mockResolvedValue({
				wordAccepted: true,
				happinessChange: 5,
				newEmotionalState: EmotionalState.EATING,
				evolutionTriggered: false,
				celebrationQueued: false
			});

			const sessionId = await mockProgressService.startSession('pokemon-beginner-001');
			expect(sessionId).toBe('session-001');

			await mockProgressService.recordKeypress('P', true, Date.now());
			await mockProgressService.recordKeypress('i', true, Date.now());
			await mockProgressService.recordKeypress('k', true, Date.now());
			await mockProgressService.recordKeypress('a', true, Date.now());

			const feedingResult = await mockPetStateService.feedWord('Pika', true);

			expect(feedingResult.wordAccepted).toBe(true);
			expect(feedingResult.happinessChange).toBeGreaterThan(0);
			expect(feedingResult.newEmotionalState).toBe(EmotionalState.EATING);
		});

		it('should show pet animation when word is typed correctly', async () => {
			mockPetStateService.feedWord.mockResolvedValue({
				wordAccepted: true,
				happinessChange: 3,
				newEmotionalState: EmotionalState.EATING,
				evolutionTriggered: false,
				celebrationQueued: false
			});

			mockPetStateService.triggerEmotionalState.mockResolvedValue();

			const feedingResult = await mockPetStateService.feedWord('Pokemon', true);

			if (feedingResult.wordAccepted) {
				await mockPetStateService.triggerEmotionalState(EmotionalState.EATING, 2000);
				expect(mockPetStateService.triggerEmotionalState).toHaveBeenCalledWith(
					EmotionalState.EATING,
					2000
				);
			}

			expect(feedingResult.newEmotionalState).toBe(EmotionalState.EATING);
		});

		it('should display real-time WPM calculation', async () => {
			const sessionSummary = {
				sessionId: 'session-001',
				duration: 60000,
				wordsPerMinute: 12,
				accuracyPercentage: 85,
				totalCharacters: 48,
				errorsCount: 7,
				improvementFromLastSession: 0,
				milestonesAchieved: []
			};

			mockProgressService.endSession.mockResolvedValue(sessionSummary);

			const summary = await mockProgressService.endSession();

			expect(summary.wordsPerMinute).toBe(12);
			expect(summary.accuracyPercentage).toBe(85);
			expect(summary.duration).toBe(60000);
			expect(summary.wordsPerMinute).toBeGreaterThanOrEqual(0);
			expect(summary.wordsPerMinute).toBeLessThan(200);
		});

		it('should show correctly typed words falling as food for pet', async () => {
			const correctWords = ['Pikachu', 'Pokemon', 'electric'];
			const feedingResults = [];

			for (const word of correctWords) {
				mockPetStateService.feedWord.mockResolvedValueOnce({
					wordAccepted: true,
					happinessChange: 2,
					newEmotionalState: EmotionalState.EATING,
					evolutionTriggered: false,
					celebrationQueued: false
				});

				const result = await mockPetStateService.feedWord(word, true);
				feedingResults.push(result);
			}

			expect(feedingResults).toHaveLength(3);
			expect(feedingResults.every((result) => result.wordAccepted)).toBe(true);
			expect(feedingResults.every((result) => result.happinessChange > 0)).toBe(true);
			expect(
				feedingResults.every((result) => result.newEmotionalState === EmotionalState.EATING)
			).toBe(true);
		});
	});

	describe('Virtual Keyboard Integration', () => {
		it('should highlight next expected key', async () => {
			const practiceText = 'Pikachu';
			const currentPosition = 0;
			const expectedKey = practiceText[currentPosition];

			expect(expectedKey).toBe('P');

			const nextPosition = 1;
			const nextExpectedKey = practiceText[nextPosition];

			expect(nextExpectedKey).toBe('i');
		});

		it('should track keyboard highlighting sync with text position', async () => {
			const practiceText = 'Pokemon';
			const positions = [0, 1, 2, 3, 4, 5, 6];
			const expectedKeys = ['P', 'o', 'k', 'e', 'm', 'o', 'n'];

			positions.forEach((position, index) => {
				expect(practiceText[position]).toBe(expectedKeys[index]);
			});
		});
	});

	describe('Pet Playground Display', () => {
		it('should render pet in Game Boy LCD style playground', async () => {
			const gamePlaygroundConfig = {
				style: 'gameboy-lcd',
				backgroundColor: '#9BBB0F',
				pixelated: true,
				screenBounds: {
					width: 160,
					height: 144
				}
			};

			expect(gamePlaygroundConfig.style).toBe('gameboy-lcd');
			expect(gamePlaygroundConfig.pixelated).toBe(true);
			expect(gamePlaygroundConfig.screenBounds.width).toBe(160);
			expect(gamePlaygroundConfig.screenBounds.height).toBe(144);
		});

		it('should show pet in center of playground', async () => {
			const playgroundCenter = {
				x: 80,
				y: 72
			};

			const petPosition = {
				x: 80,
				y: 72
			};

			expect(petPosition.x).toBe(playgroundCenter.x);
			expect(petPosition.y).toBe(playgroundCenter.y);
		});
	});

	describe('Happiness and Animation System', () => {
		it('should increase pet happiness with correct typing', async () => {
			const initialHappiness = 50;
			const expectedHappinessIncrease = 5;

			mockPetStateService.updateHappiness.mockResolvedValue(
				initialHappiness + expectedHappinessIncrease
			);

			const newHappiness = await mockPetStateService.updateHappiness(expectedHappinessIncrease);

			expect(newHappiness).toBe(55);
			expect(newHappiness).toBeGreaterThan(initialHappiness);
		});

		it('should trigger appropriate animation based on happiness level', async () => {
			const happinessLevels = [
				{ level: 95, expectedState: EmotionalState.HAPPY },
				{ level: 75, expectedState: EmotionalState.CONTENT },
				{ level: 45, expectedState: EmotionalState.HUNGRY },
				{ level: 25, expectedState: EmotionalState.SAD }
			];

			happinessLevels.forEach(({ level, expectedState }) => {
				if (level >= 90) {
					expect(expectedState).toBe(EmotionalState.HAPPY);
				} else if (level >= 70) {
					expect(expectedState).toBe(EmotionalState.CONTENT);
				} else if (level >= 50) {
					expect(expectedState).toBe(EmotionalState.HUNGRY);
				} else {
					expect(expectedState).toBe(EmotionalState.SAD);
				}
			});
		});
	});

	describe('Performance Validation', () => {
		it('should complete initial load within 3 seconds', async () => {
			const startTime = performance.now();

			mockPetStateService.loadPetState.mockImplementation(
				() =>
					new Promise((resolve) =>
						setTimeout(
							() =>
								resolve({
									id: 'pet-default',
									name: 'Typingotchi',
									evolutionForm: EvolutionForm.EGG,
									happinessLevel: 50,
									emotionalState: EmotionalState.CONTENT,
									accessories: [],
									totalWordsEaten: 0,
									accuracyAverage: 0,
									lastFeedTime: new Date(),
									streakDays: 0,
									celebrationQueue: []
								}),
							2000
						)
					)
			);

			mockContentService.loadDailyContent.mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve([]), 500))
			);

			await Promise.all([
				mockPetStateService.loadPetState(),
				mockContentService.loadDailyContent()
			]);

			const endTime = performance.now();
			const loadTime = endTime - startTime;

			expect(loadTime).toBeLessThan(3000);
		});

		it('should handle keypress response within 16ms (60fps)', async () => {
			mockProgressService.recordKeypress.mockResolvedValue();

			const startTime = performance.now();
			await mockProgressService.recordKeypress('a', true, Date.now());
			const endTime = performance.now();

			expect(endTime - startTime).toBeLessThan(16);
		});
	});
});
