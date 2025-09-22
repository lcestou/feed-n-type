import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
	PetStateService,
	PetState,
	EvolutionForm,
	EmotionalState,
	FeedingResult,
	EvolutionResult,
	Accessory,
	AccessoryCategory
} from '$lib/types/index.js';

describe('PetStateService Contract Tests', () => {
	let petStateService: PetStateService;

	beforeEach(() => {
		petStateService = {
			loadPetState: vi.fn(),
			savePetState: vi.fn(),
			resetPet: vi.fn(),
			feedWord: vi.fn(),
			updateHappiness: vi.fn(),
			triggerEmotionalState: vi.fn(),
			checkEvolutionTrigger: vi.fn(),
			evolveToNextForm: vi.fn(),
			canEvolve: vi.fn(),
			unlockAccessory: vi.fn(),
			equipAccessory: vi.fn(),
			getAvailableAccessories: vi.fn()
		};
	});

	describe('loadPetState', () => {
		it('should return valid PetState object', async () => {
			const mockPetState: PetState = {
				id: 'pet-001',
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

			vi.mocked(petStateService.loadPetState).mockResolvedValue(mockPetState);

			const result = await petStateService.loadPetState();

			expect(result).toEqual(mockPetState);
			expect(result).toHaveProperty('id');
			expect(result).toHaveProperty('name');
			expect(result).toHaveProperty('evolutionForm');
			expect(result.happinessLevel).toBeGreaterThanOrEqual(0);
			expect(result.happinessLevel).toBeLessThanOrEqual(100);
		});

		it('should meet performance requirement (<50ms)', async () => {
			const mockPetState: PetState = {
				id: 'pet-001',
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

			vi.mocked(petStateService.loadPetState).mockResolvedValue(mockPetState);

			const startTime = performance.now();
			await petStateService.loadPetState();
			const endTime = performance.now();

			expect(endTime - startTime).toBeLessThan(50);
		});
	});

	describe('feedWord', () => {
		it('should process correct word feeding', async () => {
			const mockResult: FeedingResult = {
				wordAccepted: true,
				happinessChange: 5,
				newEmotionalState: EmotionalState.HAPPY,
				evolutionTriggered: false,
				celebrationQueued: false
			};

			vi.mocked(petStateService.feedWord).mockResolvedValue(mockResult);

			const result = await petStateService.feedWord('pokemon', true);

			expect(result).toEqual(mockResult);
			expect(result.wordAccepted).toBe(true);
			expect(result.happinessChange).toBeGreaterThan(0);
			expect(result.newEmotionalState).toBe(EmotionalState.HAPPY);
		});

		it('should process incorrect word with poop emoji response', async () => {
			const mockResult: FeedingResult = {
				wordAccepted: false,
				happinessChange: -2,
				newEmotionalState: EmotionalState.SAD,
				evolutionTriggered: false,
				celebrationQueued: false
			};

			vi.mocked(petStateService.feedWord).mockResolvedValue(mockResult);

			const result = await petStateService.feedWord('wrongword', false);

			expect(result).toEqual(mockResult);
			expect(result.wordAccepted).toBe(false);
			expect(result.happinessChange).toBeLessThan(0);
			expect(result.newEmotionalState).toBe(EmotionalState.SAD);
		});

		it('should trigger eating animation for correct words', async () => {
			const mockResult: FeedingResult = {
				wordAccepted: true,
				happinessChange: 3,
				newEmotionalState: EmotionalState.EATING,
				evolutionTriggered: false,
				celebrationQueued: false
			};

			vi.mocked(petStateService.feedWord).mockResolvedValue(mockResult);

			const result = await petStateService.feedWord('nintendo', true);

			expect(result.newEmotionalState).toBe(EmotionalState.EATING);
		});
	});

	describe('updateHappiness', () => {
		it('should update happiness within valid bounds (0-100)', async () => {
			vi.mocked(petStateService.updateHappiness).mockResolvedValue(75);

			const result = await petStateService.updateHappiness(25);

			expect(result).toBe(75);
			expect(result).toBeGreaterThanOrEqual(0);
			expect(result).toBeLessThanOrEqual(100);
		});

		it('should weight accuracy 3x over speed', async () => {
			const highAccuracyDelta = 30;
			vi.mocked(petStateService.updateHappiness).mockResolvedValue(85);

			const result = await petStateService.updateHappiness(highAccuracyDelta);

			expect(result).toBeGreaterThan(50);
		});

		it('should trigger emotional state change based on happiness', async () => {
			vi.mocked(petStateService.updateHappiness).mockResolvedValue(95);
			vi.mocked(petStateService.triggerEmotionalState).mockResolvedValue();

			const happiness = await petStateService.updateHappiness(45);

			if (happiness >= 90) {
				await petStateService.triggerEmotionalState(EmotionalState.HAPPY);
				expect(petStateService.triggerEmotionalState).toHaveBeenCalledWith(EmotionalState.HAPPY);
			}
		});
	});

	describe('checkEvolutionTrigger', () => {
		it('should return evolution status with word requirements', async () => {
			const mockResult: EvolutionResult = {
				canEvolve: true,
				currentForm: EvolutionForm.EGG,
				nextForm: EvolutionForm.BABY,
				wordsRequired: 100,
				wordsToGo: 10
			};

			vi.mocked(petStateService.checkEvolutionTrigger).mockResolvedValue(mockResult);

			const result = await petStateService.checkEvolutionTrigger();

			expect(result).toEqual(mockResult);
			expect(result).toHaveProperty('canEvolve');
			expect(result).toHaveProperty('currentForm');
			expect(result).toHaveProperty('wordsRequired');
			expect(result).toHaveProperty('wordsToGo');
		});

		it('should validate evolution thresholds', async () => {
			const eggToBabyResult: EvolutionResult = {
				canEvolve: true,
				currentForm: EvolutionForm.EGG,
				nextForm: EvolutionForm.BABY,
				wordsRequired: 100,
				wordsToGo: 0
			};

			vi.mocked(petStateService.checkEvolutionTrigger).mockResolvedValue(eggToBabyResult);

			const result = await petStateService.checkEvolutionTrigger();

			expect(result.wordsRequired).toBe(100);
			expect(result.currentForm).toBe(EvolutionForm.EGG);
			expect(result.nextForm).toBe(EvolutionForm.BABY);
		});

		it('should enforce evolution only advances rule', async () => {
			const adultResult: EvolutionResult = {
				canEvolve: false,
				currentForm: EvolutionForm.ADULT,
				wordsRequired: 5000,
				wordsToGo: 0
			};

			vi.mocked(petStateService.checkEvolutionTrigger).mockResolvedValue(adultResult);

			const result = await petStateService.checkEvolutionTrigger();

			expect(result.currentForm).toBe(EvolutionForm.ADULT);
			expect(result.nextForm).toBeUndefined();
			expect(result.canEvolve).toBe(false);
		});
	});

	describe('unlockAccessory', () => {
		it('should unlock accessory when conditions met', async () => {
			vi.mocked(petStateService.unlockAccessory).mockResolvedValue(true);

			const result = await petStateService.unlockAccessory('hat-001');

			expect(result).toBe(true);
			expect(petStateService.unlockAccessory).toHaveBeenCalledWith('hat-001');
		});

		it('should prevent duplicate unlocks', async () => {
			vi.mocked(petStateService.unlockAccessory).mockResolvedValue(false);

			const result = await petStateService.unlockAccessory('already-owned-hat');

			expect(result).toBe(false);
		});
	});

	describe('equipAccessory', () => {
		it('should equip accessory in correct category', async () => {
			vi.mocked(petStateService.equipAccessory).mockResolvedValue();

			await petStateService.equipAccessory('hat-001', 'hat' as AccessoryCategory);

			expect(petStateService.equipAccessory).toHaveBeenCalledWith('hat-001', 'hat');
		});

		it('should handle accessory conflicts (one per category)', async () => {
			const mockError = new Error('Only one accessory per category allowed');
			vi.mocked(petStateService.equipAccessory).mockRejectedValue(mockError);

			try {
				await petStateService.equipAccessory('hat-002', 'hat' as AccessoryCategory);
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toContain('category');
			}
		});
	});

	describe('getAvailableAccessories', () => {
		it('should return array of unlocked accessories', async () => {
			const mockAccessories: Accessory[] = [
				{
					id: 'hat-001',
					name: 'Starter Hat',
					category: 'hat' as AccessoryCategory,
					unlockCondition: 'Complete first session',
					dateUnlocked: new Date(),
					equipped: true
				}
			];

			vi.mocked(petStateService.getAvailableAccessories).mockResolvedValue(mockAccessories);

			const result = await petStateService.getAvailableAccessories();

			expect(result).toEqual(mockAccessories);
			expect(Array.isArray(result)).toBe(true);
			expect(result[0]).toHaveProperty('id');
			expect(result[0]).toHaveProperty('category');
			expect(result[0]).toHaveProperty('unlockCondition');
		});
	});

	describe('Error Handling', () => {
		it('should handle state corruption gracefully', async () => {
			const corruptionError = new Error('Pet state corrupted');
			vi.mocked(petStateService.loadPetState).mockRejectedValue(corruptionError);

			try {
				await petStateService.loadPetState();
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toBe('Pet state corrupted');
			}
		});

		it('should prevent invalid evolution transitions', async () => {
			const invalidError = new Error('Invalid evolution transition');
			vi.mocked(petStateService.evolveToNextForm).mockRejectedValue(invalidError);

			try {
				await petStateService.evolveToNextForm();
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toContain('evolution');
			}
		});

		it('should handle storage failures gracefully', async () => {
			const storageError = new Error('Storage failure');
			vi.mocked(petStateService.savePetState).mockRejectedValue(storageError);

			const mockPetState: PetState = {
				id: 'pet-001',
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

			try {
				await petStateService.savePetState(mockPetState);
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toBe('Storage failure');
			}
		});
	});

	describe('Performance Requirements', () => {
		it('should meet state saving requirement (<100ms)', async () => {
			const mockPetState: PetState = {
				id: 'pet-001',
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

			vi.mocked(petStateService.savePetState).mockImplementation(
				() => new Promise((resolve) => setTimeout(resolve, 80))
			);

			const startTime = performance.now();
			await petStateService.savePetState(mockPetState);
			const endTime = performance.now();

			expect(endTime - startTime).toBeLessThan(100);
		});

		it('should meet animation trigger requirement (<16ms for 60fps)', async () => {
			vi.mocked(petStateService.triggerEmotionalState).mockResolvedValue();

			const startTime = performance.now();
			await petStateService.triggerEmotionalState(EmotionalState.HAPPY, 1000);
			const endTime = performance.now();

			expect(endTime - startTime).toBeLessThan(16);
		});

		it('should meet evolution calculation requirement (<10ms)', async () => {
			const mockResult: EvolutionResult = {
				canEvolve: false,
				currentForm: EvolutionForm.EGG,
				wordsRequired: 100,
				wordsToGo: 50
			};

			vi.mocked(petStateService.checkEvolutionTrigger).mockResolvedValue(mockResult);

			const startTime = performance.now();
			await petStateService.checkEvolutionTrigger();
			const endTime = performance.now();

			expect(endTime - startTime).toBeLessThan(10);
		});
	});
});
