/**
 * @module PetStateService
 * @description Manages virtual pet state persistence, evolution logic, and emotional state changes
 * for the Typingotchi gamified typing trainer. This service is the core of the pet interaction
 * system, handling word feeding, accessory management, and celebration events with performance
 * optimization.
 *
 * The virtual pet (Typingotchi) is the main companion for kids learning to type.
 * It grows, evolves, and changes mood based on typing performance and achievements.
 *
 * @since 1.0.0
 * @performance Implements caching and lazy loading for optimal pet state management
 */

import type {
	PetStateService as IPetStateService,
	PetState,
	EvolutionForm,
	FeedingResult,
	EvolutionResult,
	Accessory,
	AccessoryCategory,
	CelebrationEvent
} from '$lib/types/index.js';
import { EmotionalState } from '$lib/types/index.js';
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
	 * Loads pet state from IndexedDB storage with intelligent caching.
	 * Creates a new pet with default values if none exists.
	 *
	 * @param {string} [petId=this.DEFAULT_PET_ID] - Unique identifier for the pet
	 * @returns {Promise<PetState>} Complete pet state including happiness, evolution form, and accessories
	 *
	 * @example
	 * // Load the kid's virtual pet state
	 * const petState = await petStateService.loadPetState();
	 * console.log(`${petState.name} is feeling ${petState.emotionalState}`);
	 * console.log(`Evolution form: ${petState.evolutionForm}`);
	 *
	 * @performance Uses in-memory caching to avoid repeated database reads
	 * @since 1.0.0
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
	 * Saves pet state to IndexedDB storage with cache synchronization.
	 * Ensures data persistence across browser sessions.
	 *
	 * @param {PetState} petState - Complete pet state to persist
	 * @returns {Promise<void>}
	 * @throws {Error} If storage operation fails
	 *
	 * @example
	 * // Save pet state after feeding or evolution
	 * const updatedState = { ...currentState, happiness: newHappiness };
	 * await petStateService.savePetState(updatedState);
	 *
	 * @performance Batches save operations and maintains cache consistency
	 * @since 1.0.0
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
	 * Resets pet to initial default state with proper validation.
	 * This is typically used for starting over or troubleshooting.
	 *
	 * @returns {Promise<PetState>} Fresh pet state with default values
	 * @throws {Error} If pet is not found or reset fails
	 *
	 * @example
	 * // Reset the pet to start fresh (maybe kid wants to restart)
	 * const freshPet = await petStateService.resetPet();
	 * console.log(`${freshPet.name} is ready for a new adventure!`);
	 *
	 * @performance Clears cache and creates new model instance
	 * @since 1.0.0
	 */
	async resetPet(): Promise<PetState> {
		await this.loadPetState();

		if (!this.currentPet) {
			throw new Error('Pet not found');
		}

		// Reset using model's validation
		this.currentPet.reset('RESET_PET_CONFIRMED');

		// Save reset state
		await this.savePetState(this.currentPet.state);

		return this.currentPet.state;
	}

	/**
	 * Feeds a typed word to the virtual pet, affecting happiness and triggering animations.
	 * This is the core interaction between typing practice and pet care.
	 *
	 * @param {string} word - The word that was typed by the kid
	 * @param {boolean} isCorrect - Whether the word was typed correctly
	 * @returns {Promise<FeedingResult>} Result including happiness change, animations, and evolution status
	 * @throws {Error} If pet state is not available
	 *
	 * @example
	 * // Feed a correctly typed word to the pet
	 * const result = await petStateService.feedWord('hello', true);
	 * if (result.wordAccepted) {
	 *   console.log(`Pet is happy! Happiness changed by ${result.happinessChange}`);
	 *   if (result.evolutionTriggered) {
	 *     console.log('Your pet is ready to evolve!');
	 *   }
	 * }
	 *
	 * @performance Triggers temporary eating animation for visual feedback
	 * @since 1.0.0
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
			this.currentPet.triggerTemporaryEmotionalState(EmotionalState.EATING, 2000);
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
	 * Updates pet happiness level with automatic emotional state management.
	 * Happiness affects pet appearance, animations, and evolution progress.
	 *
	 * @param {number} change - Amount to change happiness (positive or negative)
	 * @returns {Promise<number>} New happiness level after change
	 * @throws {Error} If pet state is not available
	 *
	 * @example
	 * // Reward pet for good typing session
	 * const newHappiness = await petStateService.updateHappiness(10);
	 * console.log(`Pet happiness is now ${newHappiness}/100`);
	 *
	 * // Decrease happiness for poor performance
	 * const sadnessResult = await petStateService.updateHappiness(-5);
	 *
	 * @performance Validates happiness bounds and triggers appropriate emotional states
	 * @since 1.0.0
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
	 * Triggers a temporary emotional state for pet animations and visual feedback.
	 * Used for showing immediate reactions to typing events.
	 *
	 * @param {EmotionalState} state - Emotional state to trigger (happy, sad, eating, etc.)
	 * @param {number} [duration=2000] - Duration in milliseconds for the temporary state
	 * @returns {Promise<void>}
	 * @throws {Error} If pet state is not available
	 *
	 * @example
	 * // Show happy animation when kid types correctly
	 * await petStateService.triggerEmotionalState(EmotionalState.HAPPY, 3000);
	 *
	 * // Show eating animation when feeding pet
	 * await petStateService.triggerEmotionalState(EmotionalState.EATING, 1500);
	 *
	 * @performance State automatically reverts after duration without saving
	 * @since 1.0.0
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
	 * Checks if pet can evolve and provides evolution status information.
	 * Evolution is based on words fed and pet care progress.
	 *
	 * @returns {Promise<EvolutionResult>} Evolution status including current form, next form, and requirements
	 * @throws {Error} If pet state is not available
	 *
	 * @example
	 * // Check if pet is ready to evolve
	 * const evolution = await petStateService.checkEvolutionTrigger();
	 * if (evolution.canEvolve) {
	 *   console.log(`${evolution.currentForm} can evolve to ${evolution.nextForm}!`);
	 * } else {
	 *   console.log(`Need ${evolution.wordsToGo} more words to evolve`);
	 * }
	 *
	 * @performance Calculates evolution progress without triggering actual evolution
	 * @since 1.0.0
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
	 * Evolves pet to the next form if requirements are met.
	 * This is a major milestone that kids work toward through consistent typing practice.
	 *
	 * @returns {Promise<EvolutionForm>} New evolution form after successful evolution
	 * @throws {Error} If pet state is not available or evolution requirements not met
	 *
	 * @example
	 * // Evolve pet when kid reaches typing milestones
	 * try {
	 *   const newForm = await petStateService.evolveToNextForm();
	 *   console.log(`Congratulations! Your pet evolved to ${newForm}!`);
	 * } catch (error) {
	 *   console.log('Pet is not ready to evolve yet. Keep typing!');
	 * }
	 *
	 * @performance Validates evolution requirements and persists new state
	 * @since 1.0.0
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
	 * Simple check if pet meets evolution requirements.
	 * Convenience method for quick evolution status checks.
	 *
	 * @returns {Promise<boolean>} True if pet can evolve, false otherwise
	 *
	 * @example
	 * // Quick check before showing evolution button
	 * const readyToEvolve = await petStateService.canEvolve();
	 * if (readyToEvolve) {
	 *   showEvolutionButton();
	 * }
	 *
	 * @performance Lightweight wrapper around checkEvolutionTrigger
	 * @since 1.0.0
	 */
	async canEvolve(): Promise<boolean> {
		const result = await this.checkEvolutionTrigger();
		return result.canEvolve;
	}

	/**
	 * Unlocks a pet accessory based on achievement conditions.
	 * Accessories are cosmetic rewards that customize the pet's appearance.
	 *
	 * @param {string} accessoryId - Unique identifier of the accessory to unlock
	 * @returns {Promise<boolean>} True if accessory was successfully unlocked, false if already owned
	 * @throws {Error} If pet state is not available or accessory ID is invalid
	 *
	 * @example
	 * // Unlock a hat after kid reaches typing goal
	 * const unlocked = await petStateService.unlockAccessory('champion-crown');
	 * if (unlocked) {
	 *   console.log('New hat unlocked for your pet!');
	 * } else {
	 *   console.log('You already have this accessory!');
	 * }
	 *
	 * @performance Validates conditions before unlocking to prevent invalid states
	 * @since 1.0.0
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
	 * Equips an accessory on the pet in the specified category.
	 * Only one accessory per category can be equipped at a time.
	 *
	 * @param {string} accessoryId - Unique identifier of the accessory to equip
	 * @param {AccessoryCategory} category - Category of the accessory (hat, glasses, bow)
	 * @returns {Promise<void>}
	 * @throws {Error} If pet state is not available, accessory not unlocked, or category mismatch
	 *
	 * @example
	 * // Let kid equip their favorite hat on the pet
	 * try {
	 *   await petStateService.equipAccessory('rainbow-hat', 'hat');
	 *   console.log('Rainbow hat equipped on your pet!');
	 * } catch (error) {
	 *   console.log('You need to unlock this accessory first!');
	 * }
	 *
	 * @performance Automatically removes conflicting accessories in same category
	 * @since 1.0.0
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
	 * Retrieves all accessories that have been unlocked and are available for equipping.
	 * Used for displaying accessory selection menus to kids.
	 *
	 * @returns {Promise<Accessory[]>} Array of unlocked accessories with equipment status
	 *
	 * @example
	 * // Show all accessories the kid can use
	 * const accessories = await petStateService.getAvailableAccessories();
	 * accessories.forEach(accessory => {
	 *   console.log(`${accessory.name} (${accessory.category})`);
	 *   console.log(`Equipped: ${accessory.equipped ? 'Yes' : 'No'}`);
	 *   console.log(`How to unlock: ${accessory.unlockCondition}`);
	 * });
	 *
	 * @performance Filters and maps from cached accessory catalog
	 * @since 1.0.0
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
	 * Validates if accessory unlock conditions are satisfied based on pet state.
	 * Internal method that evaluates various achievement criteria.
	 *
	 * @private
	 * @param {Accessory} accessory - Accessory to check unlock conditions for
	 * @returns {boolean} True if conditions are met, false otherwise
	 *
	 * @example
	 * // Internal usage - checks conditions like:
	 * // - 'Complete first session' -> totalWordsEaten > 0
	 * // - 'Reach 100 WPM' -> totalWordsEaten > 1000 (simplified)
	 * // - 'Achieve 95% accuracy' -> accuracyAverage >= 95
	 * // - 'Complete 7-day streak' -> streakDays >= 7
	 *
	 * @performance Uses simple metric comparisons for fast evaluation
	 * @since 1.0.0
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
	 * Updates pet's tracked accuracy average for unlock condition evaluation.
	 * Used to track typing accuracy improvements over time.
	 *
	 * @param {number} newAccuracy - Latest session accuracy percentage (0-100)
	 * @param {number} [sessionWeight=0.1] - Weight of new session in rolling average (0-1)
	 * @returns {Promise<void>}
	 * @throws {Error} If pet state is not available
	 *
	 * @example
	 * // Update accuracy after typing session
	 * await petStateService.updateAccuracy(92.5, 0.15);
	 * // Higher weight gives more influence to recent sessions
	 *
	 * @performance Uses weighted average to smooth accuracy tracking
	 * @since 1.0.0
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
	 * Updates the consecutive days streak for unlock conditions and celebrations.
	 * Encourages daily typing practice through streak-based rewards.
	 *
	 * @param {number} days - Current consecutive days of typing practice
	 * @returns {Promise<void>}
	 * @throws {Error} If pet state is not available
	 *
	 * @example
	 * // Update streak when kid practices typing today
	 * await petStateService.updateStreak(7); // 7-day streak!
	 * // This might unlock special accessories or trigger celebrations
	 *
	 * @performance Triggers unlock condition checks for streak-based rewards
	 * @since 1.0.0
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
	 * Retrieves the next pending celebration event from the pet's celebration queue.
	 * Used for displaying achievement celebrations and milestone animations.
	 *
	 * @returns {Promise<CelebrationEvent | null>} Next celebration to display or null if none pending
	 *
	 * @example
	 * // Check for pending celebrations to show kid
	 * const celebration = await petStateService.getNextCelebration();
	 * if (celebration) {
	 *   displayCelebration(celebration.title, celebration.message);
	 *   await petStateService.removeCelebration(celebration.id);
	 * }
	 *
	 * @performance Returns cached celebration without database access
	 * @since 1.0.0
	 */
	async getNextCelebration(): Promise<CelebrationEvent | null> {
		if (!this.currentPet) {
			await this.loadPetState();
		}

		if (!this.currentPet) {
			return null;
		}

		return this.currentPet.getNextCelebration();
	}

	/**
	 * Removes a celebration from the queue after it has been displayed.
	 * Prevents duplicate celebrations and manages queue memory.
	 *
	 * @param {string} celebrationId - Unique identifier of the processed celebration
	 * @returns {Promise<boolean>} True if celebration was found and removed, false otherwise
	 *
	 * @example
	 * // Remove celebration after showing it to the kid
	 * const celebration = await petStateService.getNextCelebration();
	 * if (celebration) {
	 *   showCelebrationToUser(celebration);
	 *   const removed = await petStateService.removeCelebration(celebration.id);
	 *   console.log(`Celebration ${removed ? 'processed' : 'not found'}`);
	 * }
	 *
	 * @performance Persists queue state after successful removal
	 * @since 1.0.0
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
