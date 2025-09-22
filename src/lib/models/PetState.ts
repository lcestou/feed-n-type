/**
 * PetState Model with Validation
 *
 * Represents the current state and evolution of the user's Typingotchi pet.
 * Includes validation rules and state management logic.
 */

import { EvolutionForm, EmotionalState } from '$lib/types/index.js';
import type { PetState, CelebrationEvent } from '$lib/types/index.js';

export const EVOLUTION_THRESHOLDS = {
	[1]: { wordsRequired: 100, name: 'EGG' }, // EGG -> BABY
	[2]: { wordsRequired: 500, name: 'BABY' }, // BABY -> CHILD
	[3]: { wordsRequired: 1500, name: 'CHILD' }, // CHILD -> TEEN
	[4]: { wordsRequired: 5000, name: 'TEEN' }, // TEEN -> ADULT
	[5]: { wordsRequired: Infinity, name: 'ADULT' } // ADULT is final form
} as const;

export const HAPPINESS_THRESHOLDS = {
	EXCITED: 95,
	HAPPY: 80,
	CONTENT: 60,
	HUNGRY: 40,
	SAD: 0
} as const;

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
	 * Get current pet state
	 */
	get state(): PetState {
		return { ...this._state };
	}

	/**
	 * Get specific properties
	 */
	get id(): string {
		return this._state.id;
	}

	get name(): string {
		return this._state.name;
	}

	get evolutionForm(): EvolutionForm {
		return this._state.evolutionForm;
	}

	get happinessLevel(): number {
		return this._state.happinessLevel;
	}

	get emotionalState(): EmotionalState {
		return this._state.emotionalState;
	}

	get totalWordsEaten(): number {
		return this._state.totalWordsEaten;
	}

	get accuracyAverage(): number {
		return this._state.accuracyAverage;
	}

	get accessories(): string[] {
		return [...this._state.accessories];
	}

	get celebrationQueue(): CelebrationEvent[] {
		return [...this._state.celebrationQueue];
	}

	/**
	 * Validate and normalize pet state data
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
	 * Update pet name
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
	 * Feed the pet a word (correct or incorrect)
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
	 * Update happiness level with validation
	 */
	updateHappiness(change: number): number {
		const newHappiness = Math.max(0, Math.min(100, this._state.happinessLevel + change));
		this._state.happinessLevel = newHappiness;

		// Update emotional state based on new happiness
		this._state.emotionalState = this.calculateEmotionalState();

		return newHappiness;
	}

	/**
	 * Calculate emotional state based on happiness level
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
	 * Trigger temporary emotional state (for animations)
	 */
	triggerTemporaryEmotionalState(state: EmotionalState, duration: number = 2000): void {
		this._state.emotionalState = state;

		// Revert to calculated state after duration
		setTimeout(() => {
			this._state.emotionalState = this.calculateEmotionalState();
		}, duration);
	}

	/**
	 * Check if pet can evolve to next form
	 */
	checkEvolutionTrigger(): boolean {
		const currentForm = this._state.evolutionForm;
		const threshold = EVOLUTION_THRESHOLDS[currentForm];

		return this._state.totalWordsEaten >= threshold.wordsRequired && currentForm < 5;
	}

	/**
	 * Get evolution progress information
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
	 * Evolve to next form
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
	 * Update accuracy average with new session data
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
	 * Add accessory to pet
	 */
	addAccessory(accessoryId: string): boolean {
		if (this._state.accessories.includes(accessoryId)) {
			return false; // Already equipped
		}

		this._state.accessories.push(accessoryId);
		return true;
	}

	/**
	 * Remove accessory from pet
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
	 * Queue celebration event
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
	 * Get next celebration in queue
	 */
	getNextCelebration(): CelebrationEvent | null {
		return this._state.celebrationQueue.length > 0 ? this._state.celebrationQueue[0] : null;
	}

	/**
	 * Remove celebration from queue
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
	 * Update streak days
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
	 * Export state for persistence
	 */
	toJSON(): PetState {
		return { ...this._state };
	}

	/**
	 * Create instance from persisted data
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
	 * Reset pet to initial state (with confirmation)
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
	 * Validate model state integrity
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
