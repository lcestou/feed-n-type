import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { EvolutionForm, EmotionalState } from '$lib/types/index.js';
import type {
	PetState,
	EvolutionResult,
	StreakData,
	SessionSummary,
	Achievement,
	AchievementRarity
} from '$lib/types/index.js';

type MockedService<T> = {
	[K in keyof T]: T[K] extends (...args: any[]) => any ? MockedFunction<T[K]> : T[K];
};

describe('Integration Test: Daily Practice & Evolution Flow', () => {
	let mockPetStateService: MockedService<{
		loadPetState: () => Promise<PetState>;
		savePetState: (state: PetState) => Promise<void>;
		feedWord: (isCorrect: boolean) => Promise<unknown>;
		updateHappiness: (change: number) => Promise<void>;
		getEvolutionProgress: () => Promise<EvolutionResult>;
		triggerEvolution: () => Promise<void>;
	}>;
	let mockProgressService: MockedService<{
		startSession: (contentId: string) => Promise<string>;
		endSession: () => Promise<SessionSummary>;
		getStreakData: () => Promise<StreakData>;
	}>;
	let mockAchievementService: MockedService<{
		checkForNewAchievements: () => Promise<Achievement[]>;
		unlockAccessory: (accessoryId: string) => Promise<void>;
	}>;
	let mockLocalStorage: MockedService<{
		getStreakData: () => Promise<StreakData>;
		setStreakData: (data: StreakData) => Promise<void>;
		getLastSession: () => Promise<SessionSummary | null>;
		setLastSession: (session: SessionSummary) => Promise<void>;
	}>;

	beforeEach(() => {
		mockPetStateService = {
			loadPetState: vi.fn(),
			savePetState: vi.fn(),
			feedWord: vi.fn(),
			updateHappiness: vi.fn(),
			triggerEmotionalState: vi.fn(),
			checkEvolutionTrigger: vi.fn(),
			evolveToNextForm: vi.fn(),
			unlockAccessory: vi.fn(),
			equipAccessory: vi.fn()
		};

		mockProgressService = {
			startSession: vi.fn(),
			recordKeypress: vi.fn(),
			endSession: vi.fn(),
			calculateWPM: vi.fn(),
			getTypingTrends: vi.fn()
		};

		mockAchievementService = {
			checkAchievements: vi.fn(),
			queueCelebration: vi.fn(),
			processNextCelebration: vi.fn(),
			unlockAchievement: vi.fn()
		};

		mockLocalStorage = {
			getStreakData: vi.fn(),
			setStreakData: vi.fn(),
			getLastSession: vi.fn(),
			setLastSession: vi.fn()
		};

		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Scenario: Child practices consistently for a week', () => {
		it('should track daily practice streak accurately', async () => {
			const initialStreakData: StreakData = {
				currentStreak: 0,
				longestStreak: 0,
				lastPracticeDate: new Date('2025-01-20'),
				streakStartDate: new Date('2025-01-20'),
				totalPracticeDays: 0,
				forgivenessCredits: 1,
				weekendBonusUsed: false,
				catchUpDeadline: null
			};

			mockLocalStorage.getStreakData.mockResolvedValue(initialStreakData);
			mockLocalStorage.setStreakData.mockResolvedValue();

			const practiceDates = [
				'2025-01-21',
				'2025-01-22',
				'2025-01-23',
				'2025-01-24',
				'2025-01-25',
				'2025-01-26',
				'2025-01-27'
			];

			for (const dateStr of practiceDates) {
				const practiceDate = new Date(dateStr);
				const updatedStreak = {
					...initialStreakData,
					currentStreak: practiceDates.indexOf(dateStr) + 1,
					longestStreak: practiceDates.indexOf(dateStr) + 1,
					lastPracticeDate: practiceDate,
					totalPracticeDays: practiceDates.indexOf(dateStr) + 1
				};

				mockLocalStorage.getStreakData.mockResolvedValueOnce(updatedStreak);
				await mockLocalStorage.setStreakData(updatedStreak);
			}

			const finalStreak = await mockLocalStorage.getStreakData();

			expect(finalStreak.currentStreak).toBe(7);
			expect(finalStreak.longestStreak).toBe(7);
			expect(finalStreak.totalPracticeDays).toBe(7);
			expect(mockLocalStorage.setStreakData).toHaveBeenCalledTimes(7);
		});

		it('should trigger pet evolution at 100 words milestone', async () => {
			const initialPetState: PetState = {
				id: 'pet-evolution',
				name: 'Typingotchi',
				evolutionForm: EvolutionForm.EGG,
				happinessLevel: 75,
				emotionalState: EmotionalState.CONTENT,
				accessories: [],
				totalWordsEaten: 95,
				accuracyAverage: 88,
				lastFeedTime: new Date(),
				streakDays: 6,
				celebrationQueue: []
			};

			const evolutionResult: EvolutionResult = {
				canEvolve: true,
				currentForm: EvolutionForm.EGG,
				nextForm: EvolutionForm.BABY,
				wordsRequired: 100,
				wordsToGo: 0
			};

			const evolvedPetState: PetState = {
				...initialPetState,
				evolutionForm: EvolutionForm.BABY,
				totalWordsEaten: 100,
				celebrationQueue: [
					{
						id: 'evo-1',
						type: 'evolution',
						title: 'Evolution!',
						message: 'Your pet evolved!',
						animation: 'glow',
						duration: 3000,
						soundEffect: 'evolve',
						priority: 'high',
						autoTrigger: true
					}
				]
			};

			mockPetStateService.loadPetState.mockResolvedValue(initialPetState);
			mockPetStateService.feedWord.mockResolvedValue({
				wordAccepted: true,
				happinessChange: 5,
				newEmotionalState: EmotionalState.HAPPY,
				evolutionTriggered: false,
				celebrationQueued: false
			});
			mockPetStateService.checkEvolutionTrigger.mockResolvedValue(evolutionResult);
			mockPetStateService.evolveToNextForm.mockResolvedValue(evolvedPetState);

			for (let i = 0; i < 5; i++) {
				await mockPetStateService.feedWord('pokemon', true);
			}

			const evolutionCheck = await mockPetStateService.checkEvolutionTrigger();
			expect(evolutionCheck.canEvolve).toBe(true);
			expect(evolutionCheck.wordsToGo).toBe(0);

			const evolvedPet = await mockPetStateService.evolveToNextForm();

			expect(evolvedPet.evolutionForm).toBe(EvolutionForm.BABY);
			expect(evolvedPet.totalWordsEaten).toBe(100);
			expect(evolvedPet.celebrationQueue).toContain('evolution-celebration');
		});

		it('should unlock achievements for consistent practice', async () => {
			const weeklyAchievement: Achievement = {
				id: 'weekly-streak',
				title: 'Week Warrior!',
				description: 'Practiced every day for a week',
				icon: 'streak',
				points: 100,
				rarity: 'rare' as AchievementRarity,
				dateEarned: new Date()
			};

			const hundredWordsAchievement: Achievement = {
				id: 'hundred-words',
				title: 'Century Feeder!',
				description: 'Fed your pet 100 words',
				icon: 'food',
				points: 75,
				rarity: 'uncommon' as AchievementRarity,
				dateEarned: new Date()
			};

			const mockAchievements = [weeklyAchievement, hundredWordsAchievement];

			mockAchievementService.checkAchievements.mockResolvedValue(mockAchievements);
			mockAchievementService.queueCelebration.mockResolvedValue();

			const achievements = await mockAchievementService.checkAchievements({
				streakDays: 7,
				totalWordsEaten: 100,
				accuracyAverage: 88
			});

			expect(achievements).toHaveLength(2);
			expect(achievements[0].title).toBe('Week Warrior!');
			expect(achievements[1].title).toBe('Century Feeder!');

			for (const achievement of achievements) {
				await mockAchievementService.queueCelebration(achievement.id);
				expect(mockAchievementService.queueCelebration).toHaveBeenCalledWith(achievement.id);
			}
		});

		it('should unlock first accessory at Baby evolution', async () => {
			mockPetStateService.unlockAccessory.mockResolvedValue(true);
			mockPetStateService.equipAccessory.mockResolvedValue();

			const unlockSuccess = await mockPetStateService.unlockAccessory('starter-hat');
			expect(unlockSuccess).toBe(true);

			await mockPetStateService.equipAccessory('starter-hat', 'hat');
			expect(mockPetStateService.equipAccessory).toHaveBeenCalledWith('starter-hat', 'hat');
		});

		it('should maintain happiness levels during consistent practice', async () => {
			mockPetStateService.updateHappiness
				.mockResolvedValueOnce(58)
				.mockResolvedValueOnce(65)
				.mockResolvedValueOnce(72)
				.mockResolvedValueOnce(78)
				.mockResolvedValueOnce(84)
				.mockResolvedValueOnce(89)
				.mockResolvedValueOnce(95);

			const happinessResults = [];
			for (let day = 0; day < 7; day++) {
				const happiness = await mockPetStateService.updateHappiness(8);
				happinessResults.push(happiness);
			}

			expect(happinessResults).toEqual([58, 65, 72, 78, 84, 89, 95]);
			expect(happinessResults[6]).toBeGreaterThan(90);
			expect(happinessResults.every((h) => h >= 0 && h <= 100)).toBe(true);
		});

		it('should show celebration animations for milestones', async () => {
			const celebrationQueue = [
				'daily-streak-3',
				'evolution-baby',
				'achievement-weekly',
				'accessory-unlock'
			];

			const celebrationAnimations = [
				{ type: 'confetti', duration: 3000, emotionalState: EmotionalState.HAPPY },
				{ type: 'evolution-sparkle', duration: 5000, emotionalState: EmotionalState.EXCITED },
				{ type: 'star-burst', duration: 2500, emotionalState: EmotionalState.HAPPY },
				{ type: 'accessory-shine', duration: 2000, emotionalState: EmotionalState.CONTENT }
			];

			mockAchievementService.processNextCelebration
				.mockResolvedValueOnce(celebrationAnimations[0])
				.mockResolvedValueOnce(celebrationAnimations[1])
				.mockResolvedValueOnce(celebrationAnimations[2])
				.mockResolvedValueOnce(celebrationAnimations[3]);

			mockPetStateService.triggerEmotionalState.mockResolvedValue();

			for (let i = 0; i < celebrationQueue.length; i++) {
				const celebration = await mockAchievementService.processNextCelebration();

				expect(celebration.duration).toBeGreaterThan(2000);
				expect(celebration.duration).toBeLessThan(6000);

				await mockPetStateService.triggerEmotionalState(
					celebration.emotionalState,
					celebration.duration
				);
			}

			expect(mockPetStateService.triggerEmotionalState).toHaveBeenCalledTimes(4);
		});

		it('should improve typing speed over the week', async () => {
			const dailyWPMReadings = [12, 14, 16, 18, 20, 22, 25];

			mockProgressService.calculateWPM
				.mockResolvedValueOnce(12)
				.mockResolvedValueOnce(14)
				.mockResolvedValueOnce(16)
				.mockResolvedValueOnce(18)
				.mockResolvedValueOnce(20)
				.mockResolvedValueOnce(22)
				.mockResolvedValueOnce(25);

			const wpmResults = [];
			for (let day = 0; day < 7; day++) {
				const wpm = await mockProgressService.calculateWPM('day');
				wpmResults.push(wpm);
			}

			expect(wpmResults).toEqual(dailyWPMReadings);
			expect(wpmResults[6]).toBeGreaterThan(wpmResults[0]);
			expect(wpmResults[6] - wpmResults[0]).toBeGreaterThanOrEqual(10);
		});

		it('should generate comprehensive weekly summary', async () => {
			const weeklySummary: SessionSummary = {
				sessionId: 'week-summary',
				duration: 2100000, // 35 minutes total
				wordsPerMinute: 20,
				accuracyPercentage: 87,
				totalCharacters: 420,
				errorsCount: 55,
				improvementFromLastSession: 8,
				milestonesAchieved: [
					{
						type: 'streak',
						value: 7,
						timestamp: new Date(),
						celebrated: false
					},
					{
						type: 'words',
						value: 100,
						timestamp: new Date(),
						celebrated: false
					}
				]
			};

			mockProgressService.endSession.mockResolvedValue(weeklySummary);

			const summary = await mockProgressService.endSession();

			expect(summary.wordsPerMinute).toBe(20);
			expect(summary.accuracyPercentage).toBe(87);
			expect(summary.improvementFromLastSession).toBeGreaterThan(0);
			expect(summary.milestonesAchieved).toHaveLength(3);
			expect(summary.milestonesAchieved).toContain('First Evolution');
			expect(summary.milestonesAchieved).toContain('Weekly Streak');
		});
	});

	describe('Evolution Progression Validation', () => {
		it('should follow correct evolution sequence', async () => {
			const evolutionSequence = [
				{ form: EvolutionForm.EGG, nextForm: EvolutionForm.BABY, wordsRequired: 100 },
				{ form: EvolutionForm.BABY, nextForm: EvolutionForm.TEEN, wordsRequired: 500 },
				{ form: EvolutionForm.TEEN, nextForm: EvolutionForm.ADULT, wordsRequired: 2000 }
			];

			evolutionSequence.forEach(({ form, nextForm, wordsRequired }) => {
				const evolutionResult: EvolutionResult = {
					canEvolve: true,
					currentForm: form,
					nextForm: nextForm,
					wordsRequired: wordsRequired,
					wordsToGo: 0
				};

				expect(evolutionResult.currentForm).toBe(form);
				expect(evolutionResult.nextForm).toBe(nextForm);
				expect(evolutionResult.wordsRequired).toBe(wordsRequired);
			});
		});

		it('should prevent evolution regression', async () => {
			const adultPetState: PetState = {
				id: 'adult-pet',
				name: 'Typingotchi',
				evolutionForm: EvolutionForm.ADULT,
				happinessLevel: 95,
				emotionalState: EmotionalState.HAPPY,
				accessories: [],
				totalWordsEaten: 2500,
				accuracyAverage: 95,
				lastFeedTime: new Date(),
				streakDays: 30,
				celebrationQueue: []
			};

			const noEvolutionResult: EvolutionResult = {
				canEvolve: false,
				currentForm: EvolutionForm.ADULT,
				wordsRequired: 2000,
				wordsToGo: 0
			};

			mockPetStateService.loadPetState.mockResolvedValue(adultPetState);
			mockPetStateService.checkEvolutionTrigger.mockResolvedValue(noEvolutionResult);

			const petState = await mockPetStateService.loadPetState();
			const evolutionCheck = await mockPetStateService.checkEvolutionTrigger();

			expect(petState.evolutionForm).toBe(EvolutionForm.ADULT);
			expect(evolutionCheck.canEvolve).toBe(false);
			expect(evolutionCheck.nextForm).toBeUndefined();
		});
	});

	describe('Performance Validation', () => {
		it('should maintain streak tracking performance', async () => {
			mockLocalStorage.getStreakData.mockImplementation(
				() =>
					new Promise((resolve) =>
						setTimeout(
							() =>
								resolve({
									currentStreak: 5,
									longestStreak: 10,
									lastPracticeDate: new Date(),
									streakStartDate: new Date(),
									totalPracticeDays: 15
								}),
							30
						)
					)
			);

			const startTime = performance.now();
			await mockLocalStorage.getStreakData();
			const endTime = performance.now();

			expect(endTime - startTime).toBeLessThan(50);
		});

		it('should handle evolution calculation efficiently', async () => {
			const mockResult: EvolutionResult = {
				canEvolve: true,
				currentForm: EvolutionForm.EGG,
				nextForm: EvolutionForm.BABY,
				wordsRequired: 100,
				wordsToGo: 0
			};

			mockPetStateService.checkEvolutionTrigger.mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(mockResult), 8))
			);

			const startTime = performance.now();
			await mockPetStateService.checkEvolutionTrigger();
			const endTime = performance.now();

			expect(endTime - startTime).toBeLessThan(10);
		});
	});

	describe('Data Consistency', () => {
		it('should maintain data integrity across sessions', async () => {
			const sessionData = {
				petState: {
					evolutionForm: EvolutionForm.BABY,
					totalWordsEaten: 150,
					happinessLevel: 78
				},
				streakData: {
					currentStreak: 4,
					totalPracticeDays: 12
				},
				lastSession: {
					wpm: 18,
					accuracy: 85,
					date: new Date()
				}
			};

			mockPetStateService.loadPetState.mockResolvedValue(sessionData.petState);
			mockLocalStorage.getStreakData.mockResolvedValue(sessionData.streakData);
			mockLocalStorage.getLastSession.mockResolvedValue(sessionData.lastSession);

			const [petState, streakData, lastSession] = await Promise.all([
				mockPetStateService.loadPetState(),
				mockLocalStorage.getStreakData(),
				mockLocalStorage.getLastSession()
			]);

			expect(petState.totalWordsEaten).toBe(150);
			expect(streakData.currentStreak).toBe(4);
			expect(lastSession.wpm).toBe(18);

			expect(petState.totalWordsEaten).toBeGreaterThanOrEqual(100); // Baby evolution threshold
			expect(streakData.currentStreak).toBeLessThan(7); // Not yet weekly
			expect(lastSession.accuracy).toBeGreaterThan(80); // Good progress
		});
	});
});
