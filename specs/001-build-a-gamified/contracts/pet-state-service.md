# Pet State Service Contract

**Service**: Pet State Management API
**Purpose**: Handle Typingotchi pet state, evolution, and emotional reactions
**Storage**: IndexedDB (`pet_states` store)

## Interface Definition

```typescript
interface PetStateService {
	// Pet State Management
	loadPetState(): Promise<PetState>;
	savePetState(state: PetState): Promise<void>;
	resetPet(): Promise<PetState>;

	// Feeding & Interaction
	feedWord(word: string, isCorrect: boolean): Promise<FeedingResult>;
	updateHappiness(accuracyDelta: number): Promise<number>;
	triggerEmotionalState(state: EmotionalState, duration?: number): Promise<void>;

	// Evolution System
	checkEvolutionTrigger(): Promise<EvolutionResult>;
	evolveToNextForm(): Promise<EvolutionForm>;
	canEvolve(): Promise<boolean>;

	// Accessories & Customization
	unlockAccessory(accessoryId: string): Promise<boolean>;
	equipAccessory(accessoryId: string, category: AccessoryCategory): Promise<void>;
	getAvailableAccessories(): Promise<Accessory[]>;
}

interface FeedingResult {
	wordAccepted: boolean;
	happinessChange: number;
	newEmotionalState: EmotionalState;
	evolutionTriggered: boolean;
	celebrationQueued: boolean;
}

interface EvolutionResult {
	canEvolve: boolean;
	currentForm: EvolutionForm;
	nextForm?: EvolutionForm;
	wordsRequired: number;
	wordsToGo: number;
}
```

## Contract Tests

### feedWord()

- **Input**: Word string and correctness boolean
- **Output**: FeedingResult with state changes
- **Validation**: Correct words increase happiness, errors trigger temporary sadness
- **Animation**: Trigger eating animation for correct words, poop emoji for errors

### updateHappiness()

- **Input**: Accuracy delta (-100 to +100)
- **Output**: New happiness level (0-100)
- **Validation**: Happiness bounded, accuracy weighted 3x over speed
- **Side Effect**: Emotional state change based on happiness thresholds

### checkEvolutionTrigger()

- **Input**: None (uses current pet state)
- **Output**: EvolutionResult with evolution status
- **Validation**: Word count thresholds: Egg(0-100), Baby(100-500), Child(500-1500), Teen(1500-5000), Adult(5000+)
- **Business Rule**: Evolution only advances, never regresses

## Error Handling

- **StateCorruption**: Reset to default pet state, log event
- **InvalidEvolution**: Prevent illegal state transitions
- **AccessoryConflict**: Only one accessory per category equipped
- **StorageFailure**: Queue state changes, retry on next interaction

## Performance Requirements

- State loading: <50ms
- State saving: <100ms (background operation)
- Animation triggers: <16ms (60fps requirement)
- Evolution calculations: <10ms
