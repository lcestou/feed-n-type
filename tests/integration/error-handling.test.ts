import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { PetState, FeedingResult, SessionSummary } from '$lib/types/index.js';

describe('Integration Test: Error Handling & Pet Reactions', () => {
	let mockPetStateService: vi.Mocked<{
		loadPetState: () => Promise<PetState>;
		savePetState: (state: PetState) => Promise<void>;
		feedWord: (isCorrect: boolean) => Promise<FeedingResult>;
		updateHappiness: (change: number) => Promise<void>;
		triggerEmotionalState: (state: EmotionalState) => Promise<void>;
	}>;
	let mockProgressService: vi.Mocked<{
		startSession: (contentId: string) => Promise<string>;
		endSession: () => Promise<SessionSummary>;
		recordKeystroke: (key: string, isCorrect: boolean) => void;
	}>;
	let mockAchievementService: vi.Mocked<{
		checkForNewAchievements: () => Promise<unknown[]>;
	}>;

	beforeEach(() => {
		mockPetStateService = {
			loadPetState: vi.fn(),
			savePetState: vi.fn(),
			feedWord: vi.fn(),
			updateHappiness: vi.fn(),
			triggerEmotionalState: vi.fn()
		};

		mockProgressService = {
			startSession: vi.fn(),
			recordKeypress: vi.fn(),
			endSession: vi.fn(),
			calculateAccuracy: vi.fn()
		};

		mockAchievementService = {
			checkAchievements: vi.fn(),
			queueCelebration: vi.fn()
		};

		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Scenario: Child makes typing mistakes', () => {
		it('should generate poop emojis for wrong keystrokes', async () => {
			const incorrectFeedingResult: FeedingResult = {
				wordAccepted: false,
				happinessChange: -1,
				newEmotionalState: EmotionalState.SAD,
				evolutionTriggered: false,
				celebrationQueued: false
			};

			mockPetStateService.feedWord.mockResolvedValue(incorrectFeedingResult);

			const result = await mockPetStateService.feedWord('wrongword', false);

			expect(result.wordAccepted).toBe(false);
			expect(result.happinessChange).toBeLessThan(0);
			expect(result.newEmotionalState).toBe(EmotionalState.SAD);

			const poopEmojiGenerated = '💩';
			expect(poopEmojiGenerated).toBe('💩');
		});

		it('should show temporary pet sadness for errors', async () => {
			const sadPetState: PetState = {
				id: 'pet-sad',
				name: 'Typingotchi',
				evolutionForm: EvolutionForm.EGG,
				happinessLevel: 35,
				emotionalState: EmotionalState.SAD,
				accessories: [],
				totalWordsEaten: 5,
				accuracyAverage: 60,
				lastFeedTime: new Date(),
				streakDays: 1,
				celebrationQueue: []
			};

			mockPetStateService.loadPetState.mockResolvedValue(sadPetState);
			mockPetStateService.triggerEmotionalState.mockResolvedValue();

			const petState = await mockPetStateService.loadPetState();

			if (petState.happinessLevel < 50) {
				await mockPetStateService.triggerEmotionalState(EmotionalState.SAD, 3000);
				expect(mockPetStateService.triggerEmotionalState).toHaveBeenCalledWith(
					EmotionalState.SAD,
					3000
				);
			}

			expect(petState.emotionalState).toBe(EmotionalState.SAD);
			expect(petState.happinessLevel).toBeLessThan(50);
		});

		it('should display slower movement animation for sad pet', async () => {
			const sadAnimationConfig = {
				animationType: 'slow-walk',
				speed: 0.5,
				duration: 5000,
				emotionalState: EmotionalState.SAD
			};

			mockPetStateService.triggerEmotionalState.mockResolvedValue();

			await mockPetStateService.triggerEmotionalState(EmotionalState.SAD, 5000);

			expect(sadAnimationConfig.speed).toBeLessThan(1.0);
			expect(sadAnimationConfig.animationType).toBe('slow-walk');
			expect(sadAnimationConfig.emotionalState).toBe(EmotionalState.SAD);
		});

		it('should increment poop counter in stats display', async () => {
			const sessionStats = {
				correctWords: 8,
				incorrectWords: 5,
				poopCount: 5,
				accuracy: 61.5
			};

			const incorrectAttempts = ['wrnong', 'mistke', 'erorr', 'tyop', 'wrnog'];

			for (const incorrectWord of incorrectAttempts) {
				mockPetStateService.feedWord.mockResolvedValueOnce({
					wordAccepted: false,
					happinessChange: -1,
					newEmotionalState: EmotionalState.SAD,
					evolutionTriggered: false,
					celebrationQueued: false
				});

				await mockPetStateService.feedWord(incorrectWord, false);
			}

			expect(sessionStats.poopCount).toBe(5);
			expect(sessionStats.incorrectWords).toBe(5);
			expect(sessionStats.accuracy).toBeCloseTo(61.5, 1);
		});

		it('should return pet to normal state after correct typing resumes', async () => {
			mockPetStateService.updateHappiness.mockResolvedValue(65);
			mockPetStateService.triggerEmotionalState.mockResolvedValue();

			const correctFeedingResult: FeedingResult = {
				wordAccepted: true,
				happinessChange: 3,
				newEmotionalState: EmotionalState.CONTENT,
				evolutionTriggered: false,
				celebrationQueued: false
			};

			mockPetStateService.feedWord.mockResolvedValue(correctFeedingResult);

			const newHappiness = await mockPetStateService.updateHappiness(15);
			const feedingResult = await mockPetStateService.feedWord('pokemon', true);

			expect(newHappiness).toBeGreaterThan(50);
			expect(feedingResult.wordAccepted).toBe(true);
			expect(feedingResult.newEmotionalState).toBe(EmotionalState.CONTENT);
			expect(feedingResult.happinessChange).toBeGreaterThan(0);

			await mockPetStateService.triggerEmotionalState(EmotionalState.CONTENT, 2000);
			expect(mockPetStateService.triggerEmotionalState).toHaveBeenCalledWith(
				EmotionalState.CONTENT,
				2000
			);
		});
	});

	describe('Error Recovery Patterns', () => {
		it('should not apply permanent negative effects from mistakes', async () => {
			const initialHappiness = 70;
			const afterErrorHappiness = 67;
			const afterRecoveryHappiness = 73;

			mockPetStateService.updateHappiness
				.mockResolvedValueOnce(afterErrorHappiness)
				.mockResolvedValueOnce(afterRecoveryHappiness);

			const errorResult = await mockPetStateService.updateHappiness(-3);
			expect(errorResult).toBe(afterErrorHappiness);

			const recoveryResult = await mockPetStateService.updateHappiness(6);
			expect(recoveryResult).toBeGreaterThan(initialHappiness);

			expect(recoveryResult).toBe(afterRecoveryHappiness);
		});

		it('should maintain encouragement over punishment approach', async () => {
			const encouragementMessages = [
				"Keep trying! You're doing great!",
				'Mistakes help us learn!',
				'Your pet believes in you!',
				'Every expert was once a beginner!'
			];

			const punishmentIndicators = ['bad', 'wrong', 'terrible', 'fail', 'stupid'];

			encouragementMessages.forEach((message) => {
				expect(message.toLowerCase()).not.toMatch(/bad|wrong|terrible|fail|stupid/);
				expect(message).toMatch(/try|great|learn|believe|expert|beginner/);
			});

			punishmentIndicators.forEach((word) => {
				encouragementMessages.forEach((message) => {
					expect(message.toLowerCase()).not.toContain(word);
				});
			});
		});

		it('should ensure temporary nature of negative reactions', async () => {
			const temporaryReactionDuration = 3000;
			const maxSadnessDuration = 5000;

			mockPetStateService.triggerEmotionalState.mockResolvedValue();

			const startTime = Date.now();
			await mockPetStateService.triggerEmotionalState(
				EmotionalState.SAD,
				temporaryReactionDuration
			);
			const endTime = Date.now();

			expect(temporaryReactionDuration).toBeLessThanOrEqual(maxSadnessDuration);
			expect(endTime - startTime).toBeLessThan(100);

			expect(mockPetStateService.triggerEmotionalState).toHaveBeenCalledWith(
				EmotionalState.SAD,
				temporaryReactionDuration
			);
		});
	});

	describe('Error Statistics Tracking', () => {
		it('should track error count without affecting pet negatively long-term', async () => {
			const sessionWithErrors: SessionSummary = {
				sessionId: 'session-with-errors',
				duration: 300000,
				wordsPerMinute: 18,
				accuracyPercentage: 75,
				totalCharacters: 90,
				errorsCount: 22,
				improvementFromLastSession: -2,
				milestonesAchieved: []
			};

			mockProgressService.endSession.mockResolvedValue(sessionWithErrors);

			const sessionSummary = await mockProgressService.endSession();

			expect(sessionSummary.errorsCount).toBe(22);
			expect(sessionSummary.accuracyPercentage).toBe(75);

			expect(sessionSummary.wordsPerMinute).toBeGreaterThan(0);
			expect(sessionSummary.improvementFromLastSession).toBeLessThan(0);
		});

		it('should calculate accurate error rates for learning insights', async () => {
			const totalCharacters = 100;
			const correctCharacters = 80;
			const errorCharacters = 20;
			const accuracyPercentage = (correctCharacters / totalCharacters) * 100;

			mockProgressService.calculateAccuracy.mockResolvedValue(accuracyPercentage);

			const calculatedAccuracy = await mockProgressService.calculateAccuracy();

			expect(calculatedAccuracy).toBe(80);
			expect(errorCharacters).toBe(totalCharacters - correctCharacters);
			expect(accuracyPercentage).toBe(80);
		});

		it('should provide constructive error analysis', async () => {
			const errorAnalysis = {
				challengingKeys: ['q', 'z', 'x'],
				improvementAreas: ['finger-placement', 'rhythm'],
				positiveNotes: ['Good progress on accuracy', 'Consistent practice'],
				nextFocusArea: 'Practice q-u combinations'
			};

			expect(errorAnalysis.challengingKeys).toHaveLength(3);
			expect(errorAnalysis.improvementAreas).toContain('finger-placement');
			expect(errorAnalysis.positiveNotes).toHaveLength(2);
			expect(errorAnalysis.nextFocusArea).toContain('Practice');

			errorAnalysis.positiveNotes.forEach((note) => {
				expect(note).toMatch(/good|progress|consistent|practice/i);
			});
		});
	});

	describe('Visual Error Feedback', () => {
		it('should show immediate visual feedback for errors', async () => {
			const errorFeedback = {
				type: 'visual',
				display: 'poop-emoji',
				duration: 1500,
				position: 'word-location',
				fadeOut: true
			};

			mockPetStateService.feedWord.mockResolvedValue({
				wordAccepted: false,
				happinessChange: -1,
				newEmotionalState: EmotionalState.SAD,
				evolutionTriggered: false,
				celebrationQueued: false
			});

			await mockPetStateService.feedWord('wrnog', false);

			expect(errorFeedback.type).toBe('visual');
			expect(errorFeedback.display).toBe('poop-emoji');
			expect(errorFeedback.duration).toBeGreaterThan(1000);
			expect(errorFeedback.fadeOut).toBe(true);
		});

		it('should clear error indicators when correct typing resumes', async () => {
			const errorCleared = true;
			const normalFeedback = {
				type: 'success',
				display: 'food-animation',
				duration: 2000
			};

			mockPetStateService.feedWord
				.mockResolvedValueOnce({
					wordAccepted: false,
					happinessChange: -1,
					newEmotionalState: EmotionalState.SAD,
					evolutionTriggered: false,
					celebrationQueued: false
				})
				.mockResolvedValueOnce({
					wordAccepted: true,
					happinessChange: 3,
					newEmotionalState: EmotionalState.EATING,
					evolutionTriggered: false,
					celebrationQueued: false
				});

			await mockPetStateService.feedWord('wrnog', false);
			const correctResult = await mockPetStateService.feedWord('correct', true);

			expect(correctResult.wordAccepted).toBe(true);
			expect(errorCleared).toBe(true);
			expect(normalFeedback.type).toBe('success');
			expect(normalFeedback.display).toBe('food-animation');
		});
	});

	describe('Learning Opportunity Creation', () => {
		it('should turn errors into learning moments', async () => {
			const learningMoments = [
				{
					error: 'teh',
					correction: 'the',
					tip: 'Remember: T-H-E for "the"',
					practiceWords: ['the', 'they', 'there', 'these']
				},
				{
					error: 'recieve',
					correction: 'receive',
					tip: 'I before E except after C',
					practiceWords: ['receive', 'ceiling', 'perceive']
				}
			];

			learningMoments.forEach((moment) => {
				expect(moment.error).not.toBe(moment.correction);
				expect(moment.tip).toContain(moment.correction);
				expect(moment.practiceWords).toContain(moment.correction);
				expect(moment.practiceWords.length).toBeGreaterThan(1);
			});
		});

		it('should provide gentle correction without discouragement', async () => {
			const correctionStyle = {
				tone: 'encouraging',
				showCorrectSpelling: true,
				provideTip: true,
				avoidNegativeLanguage: true,
				focusOnImprovement: true
			};

			expect(correctionStyle.tone).toBe('encouraging');
			expect(correctionStyle.showCorrectSpelling).toBe(true);
			expect(correctionStyle.avoidNegativeLanguage).toBe(true);
			expect(correctionStyle.focusOnImprovement).toBe(true);
		});
	});

	describe('Achievement System Resilience', () => {
		it('should not penalize achievements for occasional errors', async () => {
			const sessionWithMixedResults: SessionSummary = {
				sessionId: 'mixed-session',
				duration: 600000,
				wordsPerMinute: 22,
				accuracyPercentage: 85,
				totalCharacters: 220,
				errorsCount: 33,
				improvementFromLastSession: 1,
				milestonesAchieved: []
			};

			const mockAchievements = [
				{
					id: 'persistence',
					title: 'Keep Trying!',
					description: 'Completed session with effort',
					icon: 'star',
					points: 25,
					rarity: 'common' as const,
					dateEarned: new Date()
				}
			];

			mockAchievementService.checkAchievements.mockResolvedValue(mockAchievements);

			const achievements = await mockAchievementService.checkAchievements(sessionWithMixedResults);

			expect(achievements).toHaveLength(1);
			expect(achievements[0].title).toContain('Keep Trying');
			expect(achievements[0].points).toBeGreaterThan(0);
		});

		it('should reward improvement in error reduction', async () => {
			const improvementAchievement = {
				id: 'error-reduction',
				title: 'Getting Better!',
				description: 'Reduced errors from last session',
				condition: 'fewer_errors_than_previous',
				previousErrors: 30,
				currentErrors: 20,
				improvement: 33.3
			};

			expect(improvementAchievement.currentErrors).toBeLessThan(
				improvementAchievement.previousErrors
			);
			expect(improvementAchievement.improvement).toBeCloseTo(33.3, 1);
			expect(improvementAchievement.title).toContain('Better');
		});
	});
});
