/**
 * PetStateService Implementation
 *
 * Manages pet state persistence, evolution logic, and emotional state changes
 * for the Typingotchi gamified typing trainer. Handles word feeding, accessory
 * management, and celebration events with performance optimization.
 */

import type {
	PetStateService as IPetStateService,
	PetState,
	EvolutionForm,
	EmotionalState,
	FeedingResult,
	EvolutionResult,
	Accessory,
	AccessoryCategory
} from '$lib/types/index.js';
import { PetStateModel } from '$lib/models/PetState.js';
import { dbManager } from '$lib/storage/db.js';

export class PetStateService implements IPetStateService {
	private currentPet: PetStateModel | null = null;
	private readonly DEFAULT_PET_ID = 'main-pet';

	// Accessory definitions with unlock conditions
	private readonly ACCESSORY_CATALOG: Accessory[] = [
		{
			id: 'hat-001',
			name: 'Starter Hat',
			category: 'hat',
			unlockCondition: 'Complete first session',
			dateUnlocked: new Date(),
			equipped: false
		},
		{
			id: 'hat-002',
			name: 'Champion Crown',
			category: 'hat',
			unlockCondition: 'Reach 100 WPM',
			dateUnlocked: new Date(),
			equipped: false
		},
		{
			id: 'glasses-001',
			name: 'Smart Glasses',
			category: 'glasses',
			unlockCondition: 'Achieve 95% accuracy',
			dateUnlocked: new Date(),
			equipped: false
		},
		{
			id: 'bow-001',
			name: 'Rainbow Bow',
			category: 'bow',
			unlockCondition: 'Complete 7-day streak',
			dateUnlocked: new Date(),
			equipped: false
		}
	];

	/**
	 * Load pet state from storage with caching
	 */
	async loadPetState(petId: string = this.DEFAULT_PET_ID): Promise<PetState> {
		try {
			// Check if already loaded and cached
			if (this.currentPet && this.currentPet.id === petId) {
				return this.currentPet.state;
			}

			// Load from IndexedDB
			const storedState = await dbManager.get('pet_states', petId);

			if (storedState) {
				// Validate and restore from stored data
				this.currentPet = PetStateModel.fromJSON(storedState);
			} else {
				// Create new pet with default values
				this.currentPet = new PetStateModel({
					id: petId,
					name: 'Typingotchi'
				});

				// Save initial state
				await this.savePetState(this.currentPet.state);
			}

			return this.currentPet.state;
		} catch (error) {
			console.error('Failed to load pet state:', error);

			// Fallback to default pet
			this.currentPet = new PetStateModel({
				id: petId,
				name: 'Typingotchi'
			});

			return this.currentPet.state;
		}
	}

	/**
	 * Save pet state to storage with performance optimization
	 */
	async savePetState(petState: PetState): Promise<void> {
		try {
			// Update current cached instance
			if (this.currentPet && this.currentPet.id === petState.id) {
				// Already updated in memory, just persist
			} else {
				this.currentPet = new PetStateModel(petState);
			}

			// Save to IndexedDB
			await dbManager.put('pet_states', petState);
		} catch (error) {
			console.error('Failed to save pet state:', error);
			throw new Error('Storage failure');
		}
	}

	/**
	 * Reset pet to initial state with confirmation
	 */
	async resetPet(
		petId: string = this.DEFAULT_PET_ID,
		confirmation: string = 'RESET_PET_CONFIRMED'
	): Promise<void> {
		await this.loadPetState(petId);

		if (!this.currentPet) {
			throw new Error('Pet not found');
		}

		// Reset using model's validation
		this.currentPet.reset(confirmation);

		// Save reset state
		await this.savePetState(this.currentPet.state);
	}

	/**
	 * Feed word to pet with happiness and evolution logic
	 */
	async feedWord(word: string, isCorrect: boolean): Promise<FeedingResult> {
		if (!this.currentPet) {
			await this.loadPetState();
		}

		if (!this.currentPet) {
			throw new Error('Pet state not available');
		}

		// Use model's feeding logic
		const feedingResponse = this.currentPet.feedWord(isCorrect);

		// Trigger temporary eating animation for correct words
		if (isCorrect) {
			this.currentPet.triggerTemporaryEmotionalState('eating', 2000);
		}

		// Check for celebration queue events
		const celebration = this.currentPet.getNextCelebration();
		const celebrationQueued = celebration !== null;

		// Save updated state
		await this.savePetState(this.currentPet.state);

		return {
			wordAccepted: isCorrect,
			happinessChange: feedingResponse.happinessChange,
			newEmotionalState: feedingResponse.newEmotionalState,
			evolutionTriggered: feedingResponse.evolutionTriggered,
			celebrationQueued
		};
	}

	/**
	 * Update happiness level with validation and emotional state changes
	 */
	async updateHappiness(change: number): Promise<number> {
		if (!this.currentPet) {
			await this.loadPetState();
		}

		if (!this.currentPet) {
			throw new Error('Pet state not available');
		}

		const newHappiness = this.currentPet.updateHappiness(change);

		// Save updated state
		await this.savePetState(this.currentPet.state);

		return newHappiness;
	}

	/**
	 * Trigger temporary emotional state for animations
	 */
	async triggerEmotionalState(state: EmotionalState, duration: number = 2000): Promise<void> {
		if (!this.currentPet) {
			await this.loadPetState();
		}

		if (!this.currentPet) {
			throw new Error('Pet state not available');
		}

		// Use model's temporary state logic
		this.currentPet.triggerTemporaryEmotionalState(state, duration);

		// Note: We don't save immediately for temporary states as they revert automatically
		// The model handles the timeout and reversion logic internally
	}

	/**
	 * Check evolution trigger status and requirements
	 */
	async checkEvolutionTrigger(): Promise<EvolutionResult> {
		if (!this.currentPet) {
			await this.loadPetState();
		}

		if (!this.currentPet) {
			throw new Error('Pet state not available');
		}

		const evolutionProgress = this.currentPet.getEvolutionProgress();

		return {
			canEvolve: evolutionProgress.canEvolve,
			currentForm: evolutionProgress.currentForm,
			nextForm: evolutionProgress.nextForm,
			wordsRequired: evolutionProgress.wordsRequired,
			wordsToGo: evolutionProgress.wordsToGo
		};
	}

	/**
	 * Evolve pet to next form with validation
	 */
	async evolveToNextForm(): Promise<EvolutionForm> {
		if (!this.currentPet) {
			await this.loadPetState();
		}

		if (!this.currentPet) {
			throw new Error('Pet state not available');
		}

		const newForm = this.currentPet.evolveToNextForm();

		if (!newForm) {
			throw new Error('Invalid evolution transition');
		}

		// Save evolved state
		await this.savePetState(this.currentPet.state);

		return newForm;
	}

	/**
	 * Check if pet can evolve
	 */
	async canEvolve(): Promise<boolean> {
		const result = await this.checkEvolutionTrigger();
		return result.canEvolve;
	}

	/**
	 * Unlock accessory based on conditions
	 */
	async unlockAccessory(accessoryId: string): Promise<boolean> {
		if (!this.currentPet) {
			await this.loadPetState();
		}

		if (!this.currentPet) {
			throw new Error('Pet state not available');
		}

		// Check if already unlocked
		const currentAccessories = this.currentPet.accessories;
		if (currentAccessories.includes(accessoryId)) {
			return false; // Already unlocked
		}

		// Find accessory in catalog
		const accessory = this.ACCESSORY_CATALOG.find((acc) => acc.id === accessoryId);
		if (!accessory) {
			throw new Error(`Accessory ${accessoryId} not found`);
		}

		// Check unlock conditions (simplified - in real implementation would check actual conditions)
		const canUnlock = this.checkAccessoryUnlockConditions(accessory);

		if (canUnlock) {
			const success = this.currentPet.addAccessory(accessoryId);
			if (success) {
				await this.savePetState(this.currentPet.state);
			}
			return success;
		}

		return false;
	}

	/**
	 * Equip accessory in specific category
	 */
	async equipAccessory(accessoryId: string, category: AccessoryCategory): Promise<void> {
		if (!this.currentPet) {
			await this.loadPetState();
		}

		if (!this.currentPet) {
			throw new Error('Pet state not available');
		}

		// Check if accessory is unlocked
		const currentAccessories = this.currentPet.accessories;
		if (!currentAccessories.includes(accessoryId)) {
			throw new Error('Accessory not unlocked');
		}

		// Find accessory in catalog
		const accessory = this.ACCESSORY_CATALOG.find((acc) => acc.id === accessoryId);
		if (!accessory || accessory.category !== category) {
			throw new Error('Invalid accessory or category mismatch');
		}

		// Remove any existing accessory in this category (one per category rule)
		const existingInCategory = this.ACCESSORY_CATALOG.filter(
			(acc) => acc.category === category && currentAccessories.includes(acc.id)
		);

		for (const existing of existingInCategory) {
			this.currentPet.removeAccessory(existing.id);
		}

		// Add the new accessory
		this.currentPet.addAccessory(accessoryId);

		await this.savePetState(this.currentPet.state);
	}

	/**
	 * Get available (unlocked) accessories
	 */
	async getAvailableAccessories(): Promise<Accessory[]> {
		if (!this.currentPet) {
			await this.loadPetState();
		}

		if (!this.currentPet) {
			return [];
		}

		const unlockedIds = this.currentPet.accessories;

		return this.ACCESSORY_CATALOG.filter((accessory) => unlockedIds.includes(accessory.id)).map(
			(accessory) => ({
				...accessory,
				equipped: unlockedIds.includes(accessory.id)
			})
		);
	}

	/**
	 * Check if accessory unlock conditions are met
	 */
	private checkAccessoryUnlockConditions(accessory: Accessory): boolean {
		if (!this.currentPet) {
			return false;
		}

		// Simplified condition checking
		// In a real implementation, this would check actual user metrics
		switch (accessory.unlockCondition) {
			case 'Complete first session':
				return this.currentPet.totalWordsEaten > 0;

			case 'Reach 100 WPM':
				// Would check actual WPM metrics from progress data
				return this.currentPet.totalWordsEaten > 1000;

			case 'Achieve 95% accuracy':
				return this.currentPet.accuracyAverage >= 95;

			case 'Complete 7-day streak':
				return this.currentPet.state.streakDays >= 7;

			default:
				return false;
		}
	}

	/**
	 * Update accuracy average for accessory unlock conditions
	 */
	async updateAccuracy(newAccuracy: number, sessionWeight: number = 0.1): Promise<void> {
		if (!this.currentPet) {
			await this.loadPetState();
		}

		if (!this.currentPet) {
			throw new Error('Pet state not available');
		}

		this.currentPet.updateAccuracy(newAccuracy, sessionWeight);
		await this.savePetState(this.currentPet.state);
	}

	/**
	 * Update streak for celebration triggers
	 */
	async updateStreak(days: number): Promise<void> {
		if (!this.currentPet) {
			await this.loadPetState();
		}

		if (!this.currentPet) {
			throw new Error('Pet state not available');
		}

		this.currentPet.updateStreak(days);
		await this.savePetState(this.currentPet.state);
	}

	/**
	 * Get next celebration from queue
	 */
	async getNextCelebration(): Promise<any> {
		if (!this.currentPet) {
			await this.loadPetState();
		}

		if (!this.currentPet) {
			return null;
		}

		return this.currentPet.getNextCelebration();
	}

	/**
	 * Remove processed celebration from queue
	 */
	async removeCelebration(celebrationId: string): Promise<boolean> {
		if (!this.currentPet) {
			await this.loadPetState();
		}

		if (!this.currentPet) {
			return false;
		}

		const success = this.currentPet.removeCelebration(celebrationId);
		if (success) {
			await this.savePetState(this.currentPet.state);
		}

		return success;
	}
}

// Export singleton instance
export const petStateService = new PetStateService();
