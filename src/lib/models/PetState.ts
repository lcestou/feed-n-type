/**
 * @fileoverview PetState Model with Validation
 *
 * Manages the virtual pet (Typingotchi) that evolves based on the child's
 * typing performance. The pet serves as the central motivational element
 * of the gamified typing trainer, providing immediate feedback and long-term
 * progression goals for young learners.
 *
 * @module PetStateModel
 * @since 1.0.0
 */

import { EvolutionForm, EmotionalState } from '$lib/types/index.js';
import type { PetState, CelebrationEvent } from '$lib/types/index.js';

/**
 * Evolution thresholds defining when the Typingotchi can evolve to its next form.
 * Each evolution stage requires a specific number of correctly typed words.
 * Designed to provide clear progression milestones for young typists.
 *
 * @constant EVOLUTION_THRESHOLDS
 * @property {object} 1 - EGG stage: Starting form, evolves at 100 words
 * @property {object} 2 - BABY stage: First evolution, grows at 500 words
 * @property {object} 3 - CHILD stage: Second evolution, matures at 1500 words
 * @property {object} 4 - TEEN stage: Third evolution, becomes adult at 5000 words
 * @property {object} 5 - ADULT stage: Final form, no further evolution
 * @example
 * const eggThreshold = EVOLUTION_THRESHOLDS[1];
 * console.log(`${eggThreshold.name} needs ${eggThreshold.wordsRequired} words`);
 * // Output: "EGG needs 100 words"
 * @see {@link EvolutionForm} for evolution form enum
 * @since 1.0.0
 */
export const EVOLUTION_THRESHOLDS = {
	[1]: { wordsRequired: 100, name: 'EGG' }, // EGG -> BABY
	[2]: { wordsRequired: 500, name: 'BABY' }, // BABY -> CHILD
	[3]: { wordsRequired: 1500, name: 'CHILD' }, // CHILD -> TEEN
	[4]: { wordsRequired: 5000, name: 'TEEN' }, // TEEN -> ADULT
	[5]: { wordsRequired: Infinity, name: 'ADULT' } // ADULT is final form
} as const;

/**
 * Happiness level thresholds that determine the Typingotchi's emotional state.
 * The pet's mood changes based on its happiness level, affecting its animations
 * and responses to provide visual feedback to young users.
 *
 * @constant HAPPINESS_THRESHOLDS
 * @property {number} EXCITED - Threshold for excited state (95-100)
 * @property {number} HAPPY - Threshold for happy state (80-94)
 * @property {number} CONTENT - Threshold for content state (60-79)
 * @property {number} HUNGRY - Threshold for hungry state (40-59)
 * @property {number} SAD - Threshold for sad state (0-39)
 * @example
 * const happiness = 85;
 * if (happiness >= HAPPINESS_THRESHOLDS.HAPPY) {
 *   console.log('Pet is happy!');
 * }
 * @see {@link EmotionalState} for emotional state enum
 * @since 1.0.0
 */
export const HAPPINESS_THRESHOLDS = {
	EXCITED: 95,
	HAPPY: 80,
	CONTENT: 60,
	HUNGRY: 40,
	SAD: 0
} as const;

/**
 * Default initial state for a new Typingotchi pet.
 * Provides sensible starting values for all pet properties.
 *
 * @constant DEFAULT_PET_STATE
 * @property {string} name - Default pet name "Typingotchi"
 * @property {EvolutionForm} evolutionForm - Starting form (1 = EGG)
 * @property {number} happinessLevel - Starting happiness (50/100)
 * @property {EmotionalState} emotionalState - Starting emotion (CONTENT)
 * @property {string[]} accessories - Empty accessory array
 * @property {number} totalWordsEaten - Starting word count (0)
 * @property {number} accuracyAverage - Starting accuracy (0%)
 * @property {Date} lastFeedTime - Current timestamp
 * @property {number} streakDays - Starting streak (0 days)
 * @property {CelebrationEvent[]} celebrationQueue - Empty celebration queue
 * @example
 * const newPet = { id: 'pet-123', ...DEFAULT_PET_STATE };
 * @see {@link PetState} for complete state interface
 * @since 1.0.0
 */
export const DEFAULT_PET_STATE: Omit<PetState, 'id'> = {
	name: 'Typingotchi',
	evolutionForm: 1, // EvolutionForm.EGG
	happinessLevel: 50,
	emotionalState: EmotionalState.CONTENT,
	accessories: [],
	totalWordsEaten: 0,
	accuracyAverage: 0,
	lastFeedTime: new Date(),
	streakDays: 0,
	celebrationQueue: []
};

/**
 * Model class for managing the Typingotchi pet's state and behavior.
 * Handles pet evolution, happiness, feeding, and emotional responses.
 * Designed to provide engaging feedback for children learning to type.
 *
 * @class PetStateModel
 * @example
 * // Create a new pet
 * const pet = new PetStateModel({ name: 'Buddy' });
 *
 * // Feed the pet correct words
 * const result = pet.feedWord(true);
 * if (result.evolutionTriggered) {
 *   console.log('Pet evolved!');
 * }
 *
 * // Check evolution progress
 * const progress = pet.getEvolutionProgress();
 * console.log(`${progress.progressPercentage}% to next evolution`);
 * @since 1.0.0
 */
export class PetStateModel {
	private _state: PetState;

	constructor(state: Partial<PetState> = {}) {
		this._state = this.validateAndNormalize({
			id: state.id || `pet-${Date.now()}`,
			...DEFAULT_PET_STATE,
			...state
		});
	}

	/**
	 * Get a deep copy of the current pet state.
	 * Returns immutable copy to prevent external modifications.
	 *
	 * @returns {PetState} Complete pet state data
	 * @example
	 * const currentState = pet.state;
	 * console.log(`${currentState.name} is ${currentState.emotionalState}`);
	 * @since 1.0.0
	 */
	get state(): PetState {
		return { ...this._state };
	}

	/**
	 * Get the unique identifier for this pet instance.
	 *
	 * @returns {string} Pet's unique ID
	 * @example
	 * const petId = pet.id; // 'pet-1234567890'
	 * @since 1.0.0
	 */
	get id(): string {
		return this._state.id;
	}

	/**
	 * Get the pet's custom name set by the child.
	 * Defaults to "Typingotchi" if no custom name is set.
	 *
	 * @returns {string} Pet's display name
	 * @example
	 * const petName = pet.name; // 'Buddy' or 'Typingotchi'
	 * @since 1.0.0
	 */
	get name(): string {
		return this._state.name;
	}

	/**
	 * Get the pet's current evolution form.
	 * Forms progress from EGG (1) to ADULT (5) based on words typed.
	 *
	 * @returns {EvolutionForm} Current evolution stage (1-5)
	 * @example
	 * const form = pet.evolutionForm;
	 * console.log(`Pet is in form ${form}`);
	 * @see {@link EvolutionForm} for evolution stages
	 * @see {@link EVOLUTION_THRESHOLDS} for evolution requirements
	 * @since 1.0.0
	 */
	get evolutionForm(): EvolutionForm {
		return this._state.evolutionForm;
	}

	/**
	 * Get the pet's current happiness level (0-100).
	 * Happiness affects the pet's emotional state and animations.
	 *
	 * @returns {number} Happiness level from 0 (very sad) to 100 (extremely happy)
	 * @example
	 * const happiness = pet.happinessLevel; // 75
	 * console.log(`Pet happiness: ${happiness}%`);
	 * @see {@link HAPPINESS_THRESHOLDS} for happiness thresholds
	 * @since 1.0.0
	 */
	get happinessLevel(): number {
		return this._state.happinessLevel;
	}

	/**
	 * Get the pet's current emotional state.
	 * Automatically calculated based on happiness level and recent actions.
	 *
	 * @returns {EmotionalState} Current emotional state
	 * @example
	 * const mood = pet.emotionalState;
	 * if (mood === EmotionalState.HUNGRY) {
	 *   console.log('Pet needs more correct words!');
	 * }
	 * @see {@link EmotionalState} for available states
	 * @since 1.0.0
	 */
	get emotionalState(): EmotionalState {
		return this._state.emotionalState;
	}

	/**
	 * Get the total number of correctly typed words the pet has "eaten".
	 * This metric drives evolution progress and achievement unlocks.
	 *
	 * @returns {number} Total words successfully typed
	 * @example
	 * const wordsEaten = pet.totalWordsEaten; // 1,250
	 * console.log(`Pet has eaten ${wordsEaten} words!`);
	 * @since 1.0.0
	 */
	get totalWordsEaten(): number {
		return this._state.totalWordsEaten;
	}

	/**
	 * Get the pet's running average typing accuracy.
	 * Calculated from all typing sessions using weighted averaging.
	 *
	 * @returns {number} Average accuracy percentage (0-100)
	 * @example
	 * const accuracy = pet.accuracyAverage; // 87.5
	 * console.log(`Pet's average accuracy: ${accuracy.toFixed(1)}%`);
	 * @since 1.0.0
	 */
	get accuracyAverage(): number {
		return this._state.accuracyAverage;
	}

	/**
	 * Get a copy of all accessories currently equipped on the pet.
	 * Accessories are cosmetic items that customize the pet's appearance.
	 *
	 * @returns {string[]} Array of equipped accessory IDs
	 * @example
	 * const accessories = pet.accessories;
	 * console.log(`Pet is wearing: ${accessories.join(', ')}`);
	 * @see {@link addAccessory} to equip accessories
	 * @see {@link removeAccessory} to unequip accessories
	 * @since 1.0.0
	 */
	get accessories(): string[] {
		return [...this._state.accessories];
	}

	/**
	 * Get a copy of all pending celebration events for this pet.
	 * Celebrations are queued when the pet evolves or achieves milestones.
	 *
	 * @returns {CelebrationEvent[]} Array of pending celebrations
	 * @example
	 * const celebrations = pet.celebrationQueue;
	 * if (celebrations.length > 0) {
	 *   showCelebration(celebrations[0]);
	 * }
	 * @see {@link CelebrationEvent} for event structure
	 * @since 1.0.0
	 */
	get celebrationQueue(): CelebrationEvent[] {
		return [...this._state.celebrationQueue];
	}

	/**
	 * Validate and normalize pet state data to ensure data integrity.
	 * Clamps values to valid ranges and provides safe defaults.
	 *
	 * @private
	 * @param {PetState} state - Raw pet state data to validate
	 * @returns {PetState} Validated and normalized pet state
	 * @example
	 * // Internal use only - called by constructor
	 * const safeState = this.validateAndNormalize(rawState);
	 * @since 1.0.0
	 */
	private validateAndNormalize(state: PetState): PetState {
		// Validate happiness level (0-100)
		const happiness = Math.max(0, Math.min(100, state.happinessLevel || 50));

		// Validate evolution form (1-5)
		const evolutionForm = Math.max(1, Math.min(5, state.evolutionForm || 1)) as EvolutionForm;

		// Validate accuracy average (0-100)
		const accuracyAverage = Math.max(0, Math.min(100, state.accuracyAverage || 0));

		// Validate total words eaten (non-negative)
		const totalWordsEaten = Math.max(0, state.totalWordsEaten || 0);

		// Validate streak days (non-negative)
		const streakDays = Math.max(0, state.streakDays || 0);

		// Ensure lastFeedTime is a valid Date
		const lastFeedTime =
			state.lastFeedTime instanceof Date
				? state.lastFeedTime
				: new Date(state.lastFeedTime || Date.now());

		// Validate emotional state
		const validEmotionalStates: EmotionalState[] = [
			EmotionalState.HAPPY,
			EmotionalState.CONTENT,
			EmotionalState.HUNGRY,
			EmotionalState.SAD,
			EmotionalState.EXCITED,
			EmotionalState.EATING
		];
		const emotionalState = validEmotionalStates.includes(state.emotionalState)
			? state.emotionalState
			: EmotionalState.CONTENT;

		return {
			id: state.id,
			name: state.name || 'Typingotchi',
			evolutionForm,
			happinessLevel: happiness,
			emotionalState,
			accessories: Array.isArray(state.accessories) ? [...state.accessories] : [],
			totalWordsEaten,
			accuracyAverage,
			lastFeedTime,
			streakDays,
			celebrationQueue: Array.isArray(state.celebrationQueue) ? [...state.celebrationQueue] : []
		};
	}

	/**
	 * Update the pet's display name with validation.
	 * Names must be non-empty strings with a maximum length of 20 characters.
	 *
	 * @param {string} name - New name for the pet
	 * @throws {Error} When name is empty, not a string, or too long
	 * @example
	 * pet.setName('Buddy');
	 * console.log(pet.name); // 'Buddy'
	 *
	 * // Validation examples
	 * pet.setName(''); // Throws: Pet name must be a non-empty string
	 * pet.setName('A'.repeat(25)); // Throws: Pet name must be 20 characters or less
	 * @since 1.0.0
	 */
	setName(name: string): void {
		if (typeof name !== 'string' || name.trim().length === 0) {
			throw new Error('Pet name must be a non-empty string');
		}
		if (name.length > 20) {
			throw new Error('Pet name must be 20 characters or less');
		}
		this._state.name = name.trim();
	}

	/**
	 * Feed the pet a word based on typing correctness.
	 * Correct words increase happiness and word count, incorrect words slightly decrease happiness.
	 * This is the core interaction method that drives pet progression.
	 *
	 * @param {boolean} isCorrect - Whether the typed word was correct
	 * @returns {object} Result of feeding action
	 * @returns {number} returns.happinessChange - Change in happiness (-2 to +5)
	 * @returns {EmotionalState} returns.newEmotionalState - Updated emotional state
	 * @returns {boolean} returns.evolutionTriggered - Whether pet can now evolve
	 * @example
	 * // Feed correct word
	 * const result = pet.feedWord(true);
	 * console.log(`Happiness changed by ${result.happinessChange}`);
	 * if (result.evolutionTriggered) {
	 *   pet.evolveToNextForm();
	 * }
	 *
	 * // Feed incorrect word (shows sad animation)
	 * const sadResult = pet.feedWord(false);
	 * // Pet shows disappointment but minimal happiness loss
	 * @see {@link evolveToNextForm} for handling evolution
	 * @since 1.0.0
	 */
	feedWord(isCorrect: boolean): {
		happinessChange: number;
		newEmotionalState: EmotionalState;
		evolutionTriggered: boolean;
	} {
		let happinessChange = 0;

		if (isCorrect) {
			// Correct word feeding
			this._state.totalWordsEaten++;
			this._state.lastFeedTime = new Date();

			// Happiness increases more for correct words
			happinessChange = Math.min(5, 100 - this._state.happinessLevel);
			this._state.happinessLevel = Math.min(100, this._state.happinessLevel + happinessChange);
		} else {
			// Incorrect word (poop emoji response)
			// Small happiness decrease but no punishment
			happinessChange = Math.max(-2, -this._state.happinessLevel);
			this._state.happinessLevel = Math.max(0, this._state.happinessLevel + happinessChange);
		}

		// Update emotional state based on new happiness
		const newEmotionalState = this.calculateEmotionalState();
		this._state.emotionalState = newEmotionalState;

		// Check for evolution trigger
		const evolutionTriggered = this.checkEvolutionTrigger();

		return {
			happinessChange,
			newEmotionalState,
			evolutionTriggered
		};
	}

	/**
	 * Update the pet's happiness level by a specified amount.
	 * Automatically clamps the result to the valid range (0-100) and updates emotional state.
	 *
	 * @param {number} change - Amount to change happiness (positive or negative)
	 * @returns {number} New happiness level after change
	 * @example
	 * const newHappiness = pet.updateHappiness(10);
	 * console.log(`Happiness is now ${newHappiness}`);
	 *
	 * // Happiness is automatically bounded
	 * pet.updateHappiness(1000); // Will cap at 100
	 * pet.updateHappiness(-1000); // Will floor at 0
	 * @since 1.0.0
	 */
	updateHappiness(change: number): number {
		const newHappiness = Math.max(0, Math.min(100, this._state.happinessLevel + change));
		this._state.happinessLevel = newHappiness;

		// Update emotional state based on new happiness
		this._state.emotionalState = this.calculateEmotionalState();

		return newHappiness;
	}

	/**
	 * Calculate the appropriate emotional state based on current happiness level.
	 * Uses predefined thresholds to determine pet mood.
	 *
	 * @private
	 * @returns {EmotionalState} Emotional state matching current happiness
	 * @example
	 * // Internal use only
	 * const emotion = this.calculateEmotionalState();
	 * @see {@link HAPPINESS_THRESHOLDS} for threshold values
	 * @since 1.0.0
	 */
	private calculateEmotionalState(): EmotionalState {
		const happiness = this._state.happinessLevel;

		if (happiness >= HAPPINESS_THRESHOLDS.EXCITED) return EmotionalState.EXCITED;
		if (happiness >= HAPPINESS_THRESHOLDS.HAPPY) return EmotionalState.HAPPY;
		if (happiness >= HAPPINESS_THRESHOLDS.CONTENT) return EmotionalState.CONTENT;
		if (happiness >= HAPPINESS_THRESHOLDS.HUNGRY) return EmotionalState.HUNGRY;
		return EmotionalState.SAD;
	}

	/**
	 * Temporarily override the pet's emotional state for animations.
	 * Useful for showing immediate feedback like eating or celebrating animations.
	 *
	 * @param {EmotionalState} state - Temporary emotional state to display
	 * @param {number} [duration=2000] - Duration in milliseconds before reverting
	 * @example
	 * // Show eating animation when word is typed
	 * pet.triggerTemporaryEmotionalState(EmotionalState.EATING, 1500);
	 *
	 * // Show excitement during celebrations
	 * pet.triggerTemporaryEmotionalState(EmotionalState.EXCITED, 3000);
	 * @see {@link EmotionalState} for available states
	 * @since 1.0.0
	 */
	triggerTemporaryEmotionalState(state: EmotionalState, duration: number = 2000): void {
		this._state.emotionalState = state;

		// Revert to calculated state after duration
		setTimeout(() => {
			this._state.emotionalState = this.calculateEmotionalState();
		}, duration);
	}

	/**
	 * Check if the pet has met the requirements to evolve to the next form.
	 * Evolution is based on total words eaten and current form level.
	 *
	 * @returns {boolean} True if pet can evolve, false otherwise
	 * @example
	 * if (pet.checkEvolutionTrigger()) {
	 *   console.log('Ready to evolve!');
	 *   pet.evolveToNextForm();
	 * }
	 * @see {@link EVOLUTION_THRESHOLDS} for evolution requirements
	 * @see {@link evolveToNextForm} to trigger evolution
	 * @since 1.0.0
	 */
	checkEvolutionTrigger(): boolean {
		const currentForm = this._state.evolutionForm;
		const threshold = EVOLUTION_THRESHOLDS[currentForm];

		return this._state.totalWordsEaten >= threshold.wordsRequired && currentForm < 5;
	}

	/**
	 * Get detailed information about the pet's evolution progress.
	 * Provides data for progress bars and evolution status displays.
	 *
	 * @returns {object} Evolution progress data
	 * @returns {boolean} returns.canEvolve - Whether pet can evolve now
	 * @returns {EvolutionForm} returns.currentForm - Current evolution stage
	 * @returns {EvolutionForm} [returns.nextForm] - Next evolution stage (if not final)
	 * @returns {number} returns.wordsRequired - Words needed for current stage
	 * @returns {number} returns.wordsToGo - Remaining words until evolution
	 * @returns {number} returns.progressPercentage - Progress within current stage (0-100)
	 * @example
	 * const progress = pet.getEvolutionProgress();
	 * console.log(`${progress.progressPercentage}% to ${progress.nextForm}`);
	 * console.log(`${progress.wordsToGo} words remaining`);
	 *
	 * // Show progress bar
	 * updateProgressBar(progress.progressPercentage);
	 * @see {@link EvolutionForm} for evolution stages
	 * @since 1.0.0
	 */
	getEvolutionProgress(): {
		canEvolve: boolean;
		currentForm: EvolutionForm;
		nextForm?: EvolutionForm;
		wordsRequired: number;
		wordsToGo: number;
		progressPercentage: number;
	} {
		const currentForm = this._state.evolutionForm;
		const currentThreshold = EVOLUTION_THRESHOLDS[currentForm];
		const nextForm = (currentForm + 1) as EvolutionForm;

		const canEvolve = this.checkEvolutionTrigger();
		const wordsToGo = Math.max(0, currentThreshold.wordsRequired - this._state.totalWordsEaten);

		// Calculate progress percentage for current evolution stage
		const previousThreshold =
			currentForm > 1 ? EVOLUTION_THRESHOLDS[(currentForm - 1) as EvolutionForm].wordsRequired : 0;
		const progressRange = currentThreshold.wordsRequired - previousThreshold;
		const currentProgress = this._state.totalWordsEaten - previousThreshold;
		const progressPercentage = Math.min(100, Math.max(0, (currentProgress / progressRange) * 100));

		return {
			canEvolve,
			currentForm,
			nextForm: currentForm < 5 ? nextForm : undefined,
			wordsRequired: currentThreshold.wordsRequired,
			wordsToGo,
			progressPercentage
		};
	}

	/**
	 * Evolve the pet to its next form if requirements are met.
	 * Automatically queues a celebration event for the evolution.
	 *
	 * @returns {EvolutionForm | null} New evolution form, or null if cannot evolve
	 * @example
	 * const newForm = pet.evolveToNextForm();
	 * if (newForm) {
	 *   console.log(`Pet evolved to form ${newForm}!`);
	 *   playEvolutionAnimation();
	 * } else {
	 *   console.log('Pet cannot evolve yet');
	 * }
	 * @see {@link checkEvolutionTrigger} to check before evolving
	 * @see {@link EVOLUTION_THRESHOLDS} for evolution requirements
	 * @since 1.0.0
	 */
	evolveToNextForm(): EvolutionForm | null {
		if (!this.checkEvolutionTrigger()) {
			return null;
		}

		const newForm = (this._state.evolutionForm + 1) as EvolutionForm;
		if (newForm > 5) {
			return null; // Already at max evolution
		}

		this._state.evolutionForm = newForm;

		// Add evolution celebration to queue
		this.queueCelebration({
			type: 'evolution',
			title: `Evolution Complete!`,
			message: `Your Typingotchi has evolved to ${EVOLUTION_THRESHOLDS[newForm].name} form!`,
			animation: 'glow',
			duration: 3000,
			soundEffect: 'evolution-fanfare',
			priority: 'high',
			autoTrigger: true
		});

		return newForm;
	}

	/**
	 * Update the pet's running accuracy average with new session data.
	 * Uses weighted averaging to incorporate new sessions while preserving history.
	 *
	 * @param {number} newAccuracy - Accuracy percentage from current session (0-100)
	 * @param {number} [sessionWeight=0.1] - Weight for new session (0.0-1.0)
	 * @example
	 * // Update with 95% accuracy from current session
	 * pet.updateAccuracy(95);
	 *
	 * // Give more weight to important sessions
	 * pet.updateAccuracy(88, 0.2);
	 *
	 * console.log(`Average accuracy: ${pet.accuracyAverage.toFixed(1)}%`);
	 * @since 1.0.0
	 */
	updateAccuracy(newAccuracy: number, sessionWeight: number = 0.1): void {
		if (this._state.accuracyAverage === 0) {
			// First session
			this._state.accuracyAverage = Math.max(0, Math.min(100, newAccuracy));
		} else {
			// Weighted average with previous sessions
			const weightedAverage =
				this._state.accuracyAverage * (1 - sessionWeight) + newAccuracy * sessionWeight;
			this._state.accuracyAverage = Math.max(0, Math.min(100, weightedAverage));
		}
	}

	/**
	 * Add an accessory to the pet's equipped items.
	 * Accessories provide visual customization for the Typingotchi.
	 *
	 * @param {string} accessoryId - Unique identifier of the accessory to equip
	 * @returns {boolean} True if accessory was added, false if already equipped
	 * @example
	 * const equipped = pet.addAccessory('crown_of_accuracy');
	 * if (equipped) {
	 *   console.log('Pet is now wearing the Crown of Accuracy!');
	 * }
	 * @see {@link removeAccessory} to unequip accessories
	 * @since 1.0.0
	 */
	addAccessory(accessoryId: string): boolean {
		if (this._state.accessories.includes(accessoryId)) {
			return false; // Already equipped
		}

		this._state.accessories.push(accessoryId);
		return true;
	}

	/**
	 * Remove an accessory from the pet's equipped items.
	 *
	 * @param {string} accessoryId - Unique identifier of the accessory to remove
	 * @returns {boolean} True if accessory was removed, false if not equipped
	 * @example
	 * const removed = pet.removeAccessory('old_hat');
	 * if (removed) {
	 *   console.log('Hat removed from pet');
	 * }
	 * @see {@link addAccessory} to equip accessories
	 * @since 1.0.0
	 */
	removeAccessory(accessoryId: string): boolean {
		const index = this._state.accessories.indexOf(accessoryId);
		if (index === -1) {
			return false; // Not equipped
		}

		this._state.accessories.splice(index, 1);
		return true;
	}

	/**
	 * Queue a celebration event for display to the user.
	 * Celebrations provide positive feedback for achievements and milestones.
	 *
	 * @param {Omit<CelebrationEvent, 'id'>} celebration - Celebration data without ID
	 * @example
	 * pet.queueCelebration({
	 *   type: 'evolution',
	 *   title: 'Amazing Growth!',
	 *   message: 'Your Typingotchi is getting stronger!',
	 *   animation: 'glow',
	 *   duration: 2500,
	 *   soundEffect: 'level-up',
	 *   priority: 'high',
	 *   autoTrigger: true
	 * });
	 * @see {@link CelebrationEvent} for event structure
	 * @since 1.0.0
	 */
	queueCelebration(celebration: Omit<CelebrationEvent, 'id'>): void {
		const event: CelebrationEvent = {
			id: `celebration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			...celebration
		};

		this._state.celebrationQueue.push(event);

		// Limit queue size to prevent memory issues
		if (this._state.celebrationQueue.length > 10) {
			this._state.celebrationQueue.shift();
		}
	}

	/**
	 * Get the next celebration event from the queue without removing it.
	 * Returns the first celebration in the queue for display processing.
	 *
	 * @returns {CelebrationEvent | null} Next celebration to show, or null if queue empty
	 * @example
	 * const nextEvent = pet.getNextCelebration();
	 * if (nextEvent) {
	 *   displayCelebration(nextEvent);
	 *   pet.removeCelebration(nextEvent.id);
	 * }
	 * @see {@link removeCelebration} to remove after displaying
	 * @since 1.0.0
	 */
	getNextCelebration(): CelebrationEvent | null {
		return this._state.celebrationQueue.length > 0 ? this._state.celebrationQueue[0] : null;
	}

	/**
	 * Remove a specific celebration from the queue by ID.
	 * Call this after displaying a celebration to prevent re-showing.
	 *
	 * @param {string} celebrationId - Unique ID of celebration to remove
	 * @returns {boolean} True if celebration was found and removed, false otherwise
	 * @example
	 * const celebration = pet.getNextCelebration();
	 * if (celebration) {
	 *   showCelebrationModal(celebration);
	 *   pet.removeCelebration(celebration.id);
	 * }
	 * @since 1.0.0
	 */
	removeCelebration(celebrationId: string): boolean {
		const index = this._state.celebrationQueue.findIndex((c) => c.id === celebrationId);
		if (index === -1) {
			return false;
		}

		this._state.celebrationQueue.splice(index, 1);
		return true;
	}

	/**
	 * Update the pet's practice streak in days.
	 * Automatically triggers happiness bonuses and celebrations for streak milestones.
	 *
	 * @param {number} days - Current streak length in days
	 * @example
	 * pet.updateStreak(7); // Triggers weekly milestone celebration
	 * pet.updateStreak(14); // Another celebration!
	 * pet.updateStreak(0); // Streak broken, no celebration
	 *
	 * // Check current streak
	 * console.log(`Current streak: ${pet.state.streakDays} days`);
	 * @since 1.0.0
	 */
	updateStreak(days: number): void {
		this._state.streakDays = Math.max(0, days);

		// Streak milestones can trigger happiness boosts
		if (days > 0 && days % 7 === 0) {
			this.updateHappiness(10); // Weekly streak bonus
			this.queueCelebration({
				type: 'streak',
				title: `${days} Day Streak!`,
				message: `Amazing! You've maintained a ${days} day typing streak!`,
				animation: 'bounce',
				duration: 2000,
				soundEffect: 'streak-celebration',
				priority: 'high',
				autoTrigger: true
			});
		}
	}

	/**
	 * Export the current pet state for persistence to storage.
	 * Returns a plain object suitable for JSON serialization.
	 *
	 * @returns {PetState} Plain object representation of pet state
	 * @example
	 * const petData = pet.toJSON();
	 * localStorage.setItem('pet-state', JSON.stringify(petData));
	 * @since 1.0.0
	 */
	toJSON(): PetState {
		return { ...this._state };
	}

	/**
	 * Create a PetStateModel instance from persisted JSON data.
	 * Handles date deserialization and data validation.
	 *
	 * @static
	 * @param {unknown} data - Raw data from storage (JSON parsed)
	 * @returns {PetStateModel} New model instance with restored pet state
	 * @throws {Error} When data is invalid or corrupted
	 * @example
	 * const savedData = JSON.parse(localStorage.getItem('pet-state'));
	 * const pet = PetStateModel.fromJSON(savedData);
	 *
	 * // Handle missing data gracefully
	 * try {
	 *   const pet = PetStateModel.fromJSON(data);
	 * } catch (error) {
	 *   console.error('Failed to load pet:', error);
	 *   const pet = new PetStateModel(); // Fresh pet
	 * }
	 * @since 1.0.0
	 */
	static fromJSON(data: unknown): PetStateModel {
		if (!data || typeof data !== 'object') {
			throw new Error('Invalid pet state data');
		}

		const dataObj = data as Record<string, unknown>;

		// Convert date strings back to Date objects if needed
		if (dataObj.lastFeedTime && typeof dataObj.lastFeedTime === 'string') {
			dataObj.lastFeedTime = new Date(dataObj.lastFeedTime);
		}

		return new PetStateModel(dataObj as unknown as PetState);
	}

	/**
	 * Reset the pet to its initial state with safety confirmation.
	 * Requires explicit confirmation string to prevent accidental resets.
	 *
	 * @param {string} confirmation - Must be 'RESET_PET_CONFIRMED' to proceed
	 * @throws {Error} When confirmation string is incorrect
	 * @example
	 * // Safe reset with confirmation
	 * pet.reset('RESET_PET_CONFIRMED');
	 *
	 * // This will throw an error
	 * pet.reset('yes'); // Error: Pet reset requires confirmation
	 *
	 * // Pet keeps ID and custom name after reset
	 * const originalId = pet.id;
	 * const originalName = pet.name;
	 * pet.reset('RESET_PET_CONFIRMED');
	 * console.log(pet.id === originalId); // true
	 * console.log(pet.name === originalName); // true
	 * @since 1.0.0
	 */
	reset(confirmation: string): void {
		if (confirmation !== 'RESET_PET_CONFIRMED') {
			throw new Error('Pet reset requires confirmation');
		}

		const newState = {
			...DEFAULT_PET_STATE,
			id: this._state.id, // Keep the same ID
			name: this._state.name // Keep the custom name
		};

		this._state = this.validateAndNormalize(newState);
	}

	/**
	 * Validate the current state of the pet for data integrity issues.
	 * Checks all properties are within valid ranges and types.
	 *
	 * @returns {object} Validation result
	 * @returns {boolean} returns.isValid - True if all validations pass
	 * @returns {string[]} returns.errors - Array of validation error messages
	 * @example
	 * const validation = pet.validateState();
	 * if (!validation.isValid) {
	 *   console.error('Pet state has issues:');
	 *   validation.errors.forEach(error => console.error(`- ${error}`));
	 * }
	 *
	 * // Use for debugging or data migration
	 * if (validation.isValid) {
	 *   savePetData(pet.toJSON());
	 * } else {
	 *   reportDataCorruption(validation.errors);
	 * }
	 * @since 1.0.0
	 */
	validateState(): { isValid: boolean; errors: string[] } {
		const errors: string[] = [];

		if (!this._state.id || typeof this._state.id !== 'string') {
			errors.push('Pet ID is required and must be a string');
		}

		if (this._state.happinessLevel < 0 || this._state.happinessLevel > 100) {
			errors.push('Happiness level must be between 0 and 100');
		}

		if (this._state.evolutionForm < 1 || this._state.evolutionForm > 5) {
			errors.push('Evolution form must be between 1 and 5');
		}

		if (this._state.totalWordsEaten < 0) {
			errors.push('Total words eaten cannot be negative');
		}

		if (this._state.accuracyAverage < 0 || this._state.accuracyAverage > 100) {
			errors.push('Accuracy average must be between 0 and 100');
		}

		if (!(this._state.lastFeedTime instanceof Date)) {
			errors.push('Last feed time must be a valid Date object');
		}

		return {
			isValid: errors.length === 0,
			errors
		};
	}
}
