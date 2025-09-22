<script lang="ts">
	import TypingArea from '$lib/components/TypingArea.svelte';
	import VirtualKeyboard from '$lib/components/VirtualKeyboard.svelte';
	import Typingotchi from '$lib/components/Typingotchi.svelte';
	import { ContentService } from '$lib/services/ContentService.js';
	import { PetStateService } from '$lib/services/PetStateService.js';
	import { ProgressTrackingService } from '$lib/services/ProgressTrackingService.js';
	import { AchievementService } from '$lib/services/AchievementService.js';
	import { EvolutionForm, EmotionalState } from '$lib/types/index.js';
	import type { CelebrationEvent, KeyAnalysis, ContentItem, SessionId } from '$lib/types/index.js';
	import { ContentSource, DifficultyLevel } from '$lib/types/index.js';

	/** Dynamic practice text loaded from ContentService */
	let practiceText = $state('Loading practice content...');

	/** Current content item being practiced */
	let currentContent = $state<ContentItem | null>(null);

	/** ContentService instance for loading practice content */
	const contentService = new ContentService();

	/** PetStateService instance for managing pet state and feeding */
	const petStateService = new PetStateService();

	/** ProgressTrackingService instance for session tracking and metrics */
	const progressTrackingService = new ProgressTrackingService();

	/** AchievementService instance for milestone detection and celebrations */
	const achievementService = new AchievementService();

	/** Current session ID for progress tracking */
	let currentSessionId = $state<SessionId | null>(null);

	// Enhanced typing state with error tracking and performance metrics

	/** User's typed input string */
	let userInput = $state('');

	/** Current position/index in the practice text */
	let currentPosition = $state(0);

	/** Currently pressed key for visual feedback */
	let pressedKey = $state<string>('');

	/** Timestamp when typing session began (null if not started) */
	let startTime = $state<number | null>(null);

	// Typingotchi state
	/** Whether there's currently a typing error for pet feedback */
	let hasTypingError = $state(false);

	/** Current words per minute calculation */
	let currentWpm = $state(0);

	/** Caps Lock state tracking */
	let capsLockOn = $state(false);

	// Feeding system state
	/** Array of words that are falling/available for the pet to eat */
	let fallingWords = $state<
		Array<{
			id: string;
			word: string;
			x: number; // horizontal position (0-100%)
			y: number; // vertical position for animation
			timestamp: number;
			opacity: number; // for eating animation fade-out
			isBeingEaten: boolean; // flag for eating state
		}>
	>([]);

	/** Current word being typed (for detection when space is pressed) */
	let currentWord = $state('');

	/** Counter for poop emojis (mistakes) */
	let poopCount = $state(0);

	/** Dynamic offset for centering Typingotchi based on stats box width */
	let typingotchiOffset = $state(0);

	/** Content loading state */
	let isLoadingContent = $state(false);

	// Gamification state
	/** Current streak count (consecutive days of practice) */
	let currentStreak = $state(3); // Demo value

	/** Total words eaten by the pet */
	let totalWordsEaten = $state(25); // Demo value

	/** Current evolution form of the pet */
	let evolutionForm = $state<EvolutionForm>(2); // Baby form for demo

	/** Current emotional state of the pet */
	let emotionalState = $state<EmotionalState>('content');

	/** Queue of celebrations to display */
	let celebrationQueue = $state<CelebrationEvent[]>([]);

	/** Show evolution animation flag */
	let showEvolutionAnimation = $state(false);

	/** Achievement celebration overlay state */
	let showAchievementCelebration = $state(false);
	let currentAchievement = $state<string | null>(null);

	/** Challenging keys for keyboard highlighting */
	let challengingKeys = $state<KeyAnalysis[]>([
		{
			key: 'q',
			errorRate: 0.25,
			attempts: 20,
			improvementTrend: 'improving',
			practiceRecommendation: 'Focus on Q key placement'
		},
		{
			key: 'x',
			errorRate: 0.35,
			attempts: 15,
			improvementTrend: 'declining',
			practiceRecommendation: 'Practice X key with ring finger'
		},
		{
			key: 'z',
			errorRate: 0.15,
			attempts: 30,
			improvementTrend: 'stable',
			practiceRecommendation: 'Good progress on Z key'
		}
	]);

	/** Session tracking for progress integration */
	let sessionActive = $state(false);
	let sessionProgress = $state({ wpm: 0, accuracy: 100 });

	/** Derived next expected key for keyboard highlighting */
	let nextExpectedKey = $derived(() => {
		if (currentPosition < practiceText.length) {
			return practiceText[currentPosition];
		}
		return '';
	});

	/**
	 * Invisible CapsLock detection using hidden auto-focus input
	 */
	$effect(() => {
		if (typeof window === 'undefined') return;

		// Create invisible input for CapsLock detection
		const hiddenInput = document.createElement('input');
		hiddenInput.type = 'text';
		hiddenInput.style.position = 'absolute';
		hiddenInput.style.left = '-9999px';
		hiddenInput.style.top = '-9999px';
		hiddenInput.style.width = '1px';
		hiddenInput.style.height = '1px';
		hiddenInput.style.opacity = '0';
		hiddenInput.setAttribute('tabindex', '-1');
		hiddenInput.setAttribute('aria-hidden', 'true');

		document.body.appendChild(hiddenInput);

		// Auto-focus the hidden input
		setTimeout(() => {
			hiddenInput.focus();
		}, 100);

		const detectCapsLock = (event: KeyboardEvent) => {
			if (event.getModifierState) {
				capsLockOn = event.getModifierState('CapsLock');

				// Remove listeners and hidden input
				hiddenInput.removeEventListener('keydown', detectCapsLock);
				hiddenInput.removeEventListener('keyup', detectCapsLock);
				document.body.removeChild(hiddenInput);

				// Transfer focus back to page
				hiddenInput.blur();
			}
		};

		// Listen on the hidden input
		hiddenInput.addEventListener('keydown', detectCapsLock);
		hiddenInput.addEventListener('keyup', detectCapsLock);

		// Fallback: detect on any page interaction after 2 seconds
		const fallbackTimeout = setTimeout(() => {
			const globalDetect = (event: KeyboardEvent | MouseEvent) => {
				if ('getModifierState' in event) {
					capsLockOn = event.getModifierState('CapsLock');

					// Cleanup
					window.removeEventListener('keydown', globalDetect as EventListener);
					window.removeEventListener('click', globalDetect as EventListener);
					if (document.body.contains(hiddenInput)) {
						document.body.removeChild(hiddenInput);
					}
				}
			};

			window.addEventListener('keydown', globalDetect as EventListener);
			window.addEventListener('click', globalDetect as EventListener);
		}, 2000);

		return () => {
			clearTimeout(fallbackTimeout);
			if (document.body.contains(hiddenInput)) {
				hiddenInput.removeEventListener('keydown', detectCapsLock);
				hiddenInput.removeEventListener('keyup', detectCapsLock);
				document.body.removeChild(hiddenInput);
			}
		};
	});

	/**
	 * Dynamic centering effect for Typingotchi.
	 * Centers Typingotchi within the main playground area, accounting for stats box.
	 */
	$effect(() => {
		if (typeof window === 'undefined') return;

		const updateOffset = () => {
			const playground = document.querySelector('.gameboy-lcd') as HTMLElement;
			const statsBox = document.querySelector('[data-testid="stats-box"]') as HTMLElement;

			if (playground && statsBox) {
				// Center Typingotchi in the ENTIRE green area
				// Simple offset: half the stats box width (typically ~80px, so 40px offset)
				typingotchiOffset = 40;
			}
		};

		// Initial calculation with delay to ensure DOM is ready
		setTimeout(updateOffset, 150);

		// Update on window resize
		window.addEventListener('resize', updateOffset);

		// Cleanup
		return () => {
			window.removeEventListener('resize', updateOffset);
		};
	});

	/**
	 * Load initial practice content when component mounts
	 */
	$effect(() => {
		loadNewContent();
	});

	/**
	 * Load initial pet state when component mounts
	 */
	$effect(() => {
		loadPetState();
	});

	/**
	 * Load pet state from PetStateService
	 */
	async function loadPetState() {
		try {
			const petState = await petStateService.loadPetState();

			// Update local state with loaded pet data
			evolutionForm = petState.evolutionForm;
			emotionalState = petState.emotionalState;
			totalWordsEaten = petState.totalWordsEaten;
			currentStreak = petState.streakDays;

			// Load any pending celebrations
			const celebration = await petStateService.getNextCelebration();
			if (celebration) {
				celebrationQueue = [celebration];
			}
		} catch (error) {
			console.error('Failed to load pet state:', error);
			// Use default values already set in state
		}
	}

	/**
	 * Load new practice content from ContentService
	 */
	async function loadNewContent() {
		if (isLoadingContent) return;

		isLoadingContent = true;

		try {
			// Get random content appropriate for the user's level
			const content = await contentService.getRandomContent({
				difficulty: DifficultyLevel.BEGINNER, // TODO: Base this on user progress
				maxWords: 50, // Keep sessions manageable for kids
				excludeUsed: true
			});

			currentContent = content;
			practiceText = content.text;

			// Reset typing state for new content
			resetExercise();
		} catch (error) {
			console.error('Failed to load new content:', error);

			// Fallback to default text if content loading fails
			practiceText =
				'The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet at least once.';
			currentContent = null;
		} finally {
			isLoadingContent = false;
		}
	}

	/**
	 * Load content from specific source (Pokemon, Nintendo, Roblox)
	 */
	async function loadContentFromSource(source: ContentSource) {
		if (isLoadingContent) return;

		isLoadingContent = true;

		try {
			const content = await contentService.getRandomContent({
				source,
				difficulty: DifficultyLevel.BEGINNER, // TODO: Base this on user progress
				maxWords: 50,
				excludeUsed: true
			});

			currentContent = content;
			practiceText = content.text;

			// Reset typing state for new content
			resetExercise();
		} catch (error) {
			console.error(`Failed to load ${source} content:`, error);
		} finally {
			isLoadingContent = false;
		}
	}

	/** Derived state indicating if user is actively typing */
	let isTyping = $derived(userInput.length > 0 && currentPosition < practiceText.length);

	/**
	 * Real-time WPM calculation effect.
	 * Updates current WPM based on elapsed time and words typed.
	 * Runs whenever typing state changes.
	 */
	$effect(() => {
		if (startTime && userInput.length > 0) {
			const timeMinutes = (Date.now() - startTime) / 1000 / 60;
			const wordsTyped = userInput.trim().split(' ').length;
			currentWpm = Math.round(wordsTyped / timeMinutes) || 0;
		} else {
			currentWpm = 0;
		}
	});

	/**
	 * Typing error detection effect for Typingotchi feedback.
	 * Compares the last typed character with expected character
	 * and sets error state with automatic timeout.
	 */
	$effect(() => {
		if (userInput.length > 0) {
			const isCurrentCharCorrect =
				userInput[userInput.length - 1] === practiceText[userInput.length - 1];
			hasTypingError = !isCurrentCharCorrect;

			// Clear error state after a short delay
			if (hasTypingError) {
				setTimeout(() => {
					hasTypingError = false;
				}, 1000);
			}
		}
	});

	/**
	 * Start a typing session with progress tracking
	 */
	async function startSession() {
		try {
			// Start session with ProgressTrackingService
			const contentId = currentContent?.id || 'default-content';
			currentSessionId = await progressTrackingService.startSession(contentId);

			sessionActive = true;
			sessionProgress = { wpm: 0, accuracy: 100 };
		} catch (error) {
			console.error('Failed to start progress tracking session:', error);
			// Fall back to basic session tracking
			sessionActive = true;
			sessionProgress = { wpm: 0, accuracy: 100 };
		}
	}

	/**
	 * End typing session and check for achievements
	 */
	async function endSession() {
		try {
			// End session with ProgressTrackingService
			if (currentSessionId) {
				const sessionSummary = await progressTrackingService.endSession();

				// Update local session progress with final summary
				sessionProgress = {
					wpm: sessionSummary.wordsPerMinute,
					accuracy: sessionSummary.accuracyPercentage
				};

				// Check for achievements and milestones with AchievementService
				try {
					const newAchievements = await achievementService.checkAchievements(sessionSummary);
					if (newAchievements.length > 0) {
						console.log('New achievements unlocked:', newAchievements);
						// Queue celebrations for new achievements
						for (const achievement of newAchievements) {
							await achievementService.queueCelebration({
								type: 'milestone',
								title: `Achievement Unlocked: ${achievement.title}!`,
								message: achievement.description,
								animation: 'bounce',
								duration: 3000,
								soundEffect: 'achievement-unlock',
								priority: 'high',
								autoTrigger: true
							});
						}
					}
				} catch (achievementError) {
					console.error('Failed to check achievements:', achievementError);
				}

				currentSessionId = null;
			}

			sessionActive = false;
			checkForAchievements();
		} catch (error) {
			console.error('Failed to end progress tracking session:', error);
			// Fall back to basic session ending
			sessionActive = false;
			checkForAchievements();
		}
	}

	/**
	 * Handle progress updates from TypingArea component
	 */
	function handleProgressUpdate(wpm: number, accuracy: number) {
		sessionProgress = { wpm, accuracy };

		// Update emotional state based on performance
		if (accuracy >= 95) {
			emotionalState = EmotionalState.HAPPY;
		} else if (accuracy >= 80) {
			emotionalState = EmotionalState.CONTENT;
		} else if (accuracy >= 60) {
			emotionalState = EmotionalState.HUNGRY;
		} else {
			emotionalState = EmotionalState.SAD;
		}

		// Check for real-time milestone achievements and personal bests
		checkRealtimeMilestones(wpm, accuracy);
	}

	/**
	 * Check for real-time milestone achievements during active typing
	 */
	async function checkRealtimeMilestones(wpm: number, accuracy: number) {
		try {
			// Check for personal best WPM achievements
			const currentProgress = await achievementService.getProgress();

			// WPM milestone achievements (every 5 WPM improvement)
			const wpmMilestones = [10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100];
			for (const milestone of wpmMilestones) {
				if (wpm >= milestone && currentProgress.personalBestWPM < milestone) {
					await achievementService.queueCelebration({
						type: 'milestone',
						title: `${milestone} WPM Milestone!`,
						message: `You're typing at ${milestone} words per minute!`,
						animation: 'glow',
						duration: 2000,
						soundEffect: 'milestone-achieved',
						priority: 'medium',
						autoTrigger: true
					});
				}
			}

			// Accuracy milestone achievements (95%, 98%, 99%, 100%)
			const accuracyMilestones = [95, 98, 99, 100];
			for (const milestone of accuracyMilestones) {
				if (accuracy >= milestone && currentProgress.personalBestAccuracy < milestone) {
					await achievementService.queueCelebration({
						type: 'milestone',
						title: `${milestone}% Accuracy!`,
						message: `Perfect typing performance!`,
						animation: 'sparkle',
						duration: 2000,
						soundEffect: 'accuracy-perfect',
						priority: 'medium',
						autoTrigger: true
					});
				}
			}

			// Perfect streak achievements (during session)
			if (accuracy === 100 && wpm >= 20) {
				await achievementService.queueCelebration({
					type: 'milestone',
					title: 'Perfect Performance!',
					message: 'Amazing typing with 100% accuracy!',
					animation: 'rainbow',
					duration: 1500,
					soundEffect: 'perfect-streak',
					priority: 'medium',
					autoTrigger: true
				});
			}
		} catch (error) {
			console.error('Failed to check real-time milestones:', error);
		}
	}

	/**
	 * Check for achievements and trigger celebrations
	 */
	async function checkForAchievements() {
		try {
			// Check for pending celebrations from AchievementService
			const nextCelebration = await achievementService.getNextCelebration();
			if (nextCelebration) {
				// Show the celebration
				currentAchievement = nextCelebration;
				showAchievementCelebration = true;

				// Mark celebration as shown
				setTimeout(async () => {
					await achievementService.markCelebrationShown(nextCelebration.id);
					// Check for more celebrations
					checkForAchievements();
				}, nextCelebration.duration);
			}

			// Check for evolution milestones (legacy logic)
			if (totalWordsEaten >= 100 && evolutionForm === 2) {
				triggerEvolution();
			}
		} catch (error) {
			console.error('Failed to check for achievements:', error);
		}
	}

	/**
	 * Trigger pet evolution
	 */
	function triggerEvolution() {
		showEvolutionAnimation = true;

		// Complete evolution after animation
		setTimeout(() => {
			evolutionForm = Math.min(5, evolutionForm + 1) as EvolutionForm;
			showEvolutionAnimation = false;
		}, 2500);
	}

	/**
	 * Handle evolution completion callback
	 */
	function handleEvolutionComplete() {
		showEvolutionAnimation = false;
		emotionalState = EmotionalState.EXCITED;

		// Reset emotional state after celebration
		setTimeout(() => {
			emotionalState = EmotionalState.CONTENT;
		}, 3000);
	}

	/**
	 * Handle celebration completion callback
	 */
	async function handleCelebrationComplete(eventId: string) {
		// Remove from local queue
		celebrationQueue = celebrationQueue.filter((event) => event.id !== eventId);

		// Remove from PetStateService queue
		try {
			await petStateService.removeCelebration(eventId);
		} catch (error) {
			console.error('Failed to remove celebration from service:', error);
		}
	}

	/**
	 * Handles key press events from both virtual and physical keyboards.
	 * Processes special keys (Backspace, Enter, Tab, Shift) and regular characters.
	 * Manages typing state, position tracking, and exercise completion.
	 *
	 * @param key - The key that was pressed
	 */
	function handleKeyPress(key: string) {
		// Show visual feedback
		pressedKey = key;
		setTimeout(() => (pressedKey = ''), 150);

		// Handle special keys - DISABLED BACKSPACE FOR FORWARD-ONLY PROGRESSION
		if (key === 'Backspace') {
			// Backspace disabled - forward progression only!
			return;
		}

		if (key === 'Enter') {
			// For now, just add a newline if it exists in the practice text
			if (practiceText[currentPosition] === '\n') {
				userInput += '\n';
				currentPosition++;
			}
			return;
		}

		if (key === 'Tab' || key === 'Shift') {
			// These keys don't add characters in our simple implementation
			return;
		}

		// Start timer and session on first keystroke
		if (startTime === null) {
			startTime = Date.now();
			startSession();
		}

		// Check if character is correct and add to input or send poop emoji
		if (currentPosition < practiceText.length) {
			const expectedChar = practiceText[currentPosition];
			const isCorrect = key === expectedChar;

			// Record keypress for progress tracking
			if (currentSessionId) {
				progressTrackingService.recordKeypress(key, isCorrect);
			}

			if (isCorrect) {
				// Correct character - add to input
				userInput += key;
				currentPosition++;

				// Build current word for feeding system
				if (key === ' ') {
					// Word completed - add to falling words and feed pet
					const trimmedWord = currentWord.trim();
					if (trimmedWord.length > 0) {
						addFallingWord(trimmedWord);
						feedWordToPet(trimmedWord, true); // Correct word
					}
					currentWord = '';
				} else {
					currentWord += key;
				}
			} else {
				// Wrong character - add poop emoji to playground and increment counter!
				addFallingWord('💩');
				poopCount++;
				feedWordToPet('error', false); // Incorrect keystroke
			}
		}

		// Check if exercise is complete
		if (currentPosition >= practiceText.length) {
			handleExerciseComplete();
		}
	}

	/**
	 * Handles completion of the typing exercise.
	 * Calculates final WPM, shows completion alert, and resets for next practice.
	 */
	async function handleExerciseComplete() {
		const endTime = Date.now();
		const timeMinutes = (endTime - (startTime || endTime)) / 1000 / 60;
		const wordsTyped = practiceText.split(' ').length;
		const wpm = Math.round(wordsTyped / timeMinutes);

		// Calculate session accuracy
		const accuracy = sessionProgress.accuracy;

		// End session and trigger achievement checks
		endSession();

		// Update pet state with session results
		try {
			await petStateService.updateAccuracy(accuracy);
			// Note: Streak updates would typically happen daily, not per session
		} catch (error) {
			console.error('Failed to update pet state after session:', error);
		}

		// Update total words eaten count
		totalWordsEaten += wordsTyped;

		// Show completion message
		alert(`Exercise complete! Your typing speed: ${wpm} WPM, Accuracy: ${accuracy}%`);

		// Reset for next practice
		resetExercise();
	}

	/**
	 * Resets all typing state variables to initial values.
	 * Clears user input, position, timers, and error states.
	 */
	function resetExercise() {
		userInput = '';
		currentPosition = 0;
		startTime = null;
		pressedKey = '';
		hasTypingError = false;
		currentWpm = 0;
		fallingWords = [];
		currentWord = '';

		// Reset session state
		sessionActive = false;
		sessionProgress = { wpm: 0, accuracy: 100 };

		// Reset emotional state to content
		emotionalState = EmotionalState.CONTENT;
	}

	/**
	 * Reset exercise and load new content
	 */
	function resetAndLoadNewContent() {
		resetExercise();
		loadNewContent();
	}

	/**
	 * Feed word to pet using PetStateService
	 */
	async function feedWordToPet(word: string, isCorrect: boolean) {
		try {
			const feedingResult = await petStateService.feedWord(word, isCorrect);

			// Update local state based on feeding result
			if (feedingResult.happinessChange !== 0) {
				// Happiness changed, emotional state might have changed too
				emotionalState = feedingResult.newEmotionalState;
			}

			// Check for evolution
			if (feedingResult.evolutionTriggered) {
				const evolutionResult = await petStateService.checkEvolutionTrigger();
				if (evolutionResult.canEvolve) {
					showEvolutionAnimation = true;
					evolutionForm = await petStateService.evolveToNextForm();
				}
			}

			// Check for celebrations
			if (feedingResult.celebrationQueued) {
				const celebration = await petStateService.getNextCelebration();
				if (celebration) {
					celebrationQueue = [...celebrationQueue, celebration];
				}
			}

			// Update word count
			if (isCorrect) {
				totalWordsEaten++;
			}
		} catch (error) {
			console.error('Failed to feed word to pet:', error);
		}
	}

	/**
	 * Adds a completed word to the falling words array for the pet to eat.
	 * Creates a new falling word with random horizontal position and animation properties.
	 * Includes performance optimizations to prevent excessive word accumulation.
	 *
	 * @param word - The completed word to add to the playground
	 */
	function addFallingWord(word: string) {
		// Filter out short words (less than 2 characters) for better gameplay
		if (word.length < 2) {
			return;
		}

		// Performance optimization: limit maximum number of words on screen
		const maxWords = 8;
		let updatedWords = [...fallingWords];

		if (updatedWords.length >= maxWords) {
			// Remove oldest word to make room for new one
			updatedWords = updatedWords.slice(1);
		}

		const newWord = {
			id: `${Date.now()}-${Math.random()}`,
			word: word,
			x: Math.random() * 80 + 10, // Random x position between 10% and 90%
			y: Math.random() * 60 + 10, // Random y position between 10% and 70% of lawn height
			timestamp: Date.now(),
			opacity: 1, // Start fully visible
			isBeingEaten: false // Not being eaten initially
		};

		// Single state update to avoid multiple mutations
		fallingWords = [...updatedWords, newWord];

		// Auto-cleanup old words after 20 seconds to prevent memory buildup
		// Use queueMicrotask to defer the cleanup outside reactive cycle
		setTimeout(() => {
			queueMicrotask(() => {
				fallingWords = fallingWords.filter((w) => w.id !== newWord.id);
			});
		}, 20000);
	}

	/**
	 * Removes a word from the falling words array (when eaten by pet).
	 *
	 * @param wordId - The unique ID of the word to remove
	 */
	function removeWord(wordId: string) {
		startEatingWord(wordId);
	}

	/**
	 * Starts eating animation for a word - marks for eating and schedules removal.
	 *
	 * @param wordId - ID of the word to start eating
	 */
	function startEatingWord(wordId: string) {
		// Mark word as being eaten and set opacity to 0 for CSS transition
		// Use single state update to prevent multiple mutations
		fallingWords = fallingWords.map((w) =>
			w.id === wordId ? { ...w, isBeingEaten: true, opacity: 0 } : w
		);

		// Remove word after animation completes
		// Use queueMicrotask to defer removal outside reactive cycle
		setTimeout(() => {
			queueMicrotask(() => {
				fallingWords = fallingWords.filter((w) => w.id !== wordId);
			});
		}, 1000); // 1 second total eating time
	}

	/**
	 * Handles physical keyboard input events.
	 * Maps keyboard events to appropriate key strings and delegates to handleKeyPress.
	 * Prevents default browser behavior and normalizes key representations.
	 *
	 * @param event - The keyboard event from the browser
	 */
	function handleKeydown(event: KeyboardEvent) {
		// Don't prevent default for browser shortcuts (Cmd/Ctrl combinations)
		if (event.metaKey || event.ctrlKey) {
			return;
		}

		event.preventDefault();

		let key = event.key;

		// Map special keys
		if (key === ' ') {
			key = ' ';
		} else if (key === 'Backspace') {
			key = 'Backspace';
		} else if (key === 'Enter') {
			key = 'Enter';
		} else if (key === 'Tab') {
			key = 'Tab';
		} else if (key === 'Shift') {
			key = 'Shift';
		} else if (key === 'CapsLock') {
			// Use getModifierState for accurate CapsLock detection
			capsLockOn = event.getModifierState('CapsLock');
			return;
		} else if (key.length === 1) {
			// Regular character - preserve case
			// key stays as-is to match exact case in practice text
		} else {
			// Ignore other keys
			return;
		}

		handleKeyPress(key);
	}
</script>

<svelte:head>
	<title>Feed-n-Type - Interactive Typing Learning</title>
	<meta
		name="description"
		content="Interactive typing learning with engaging content - Practice Mode. WCAG AAA compliant gamified typing trainer for children."
	/>
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta name="author" content="Feed-n-Type Team" />
	<meta
		name="keywords"
		content="typing, practice, gamified, learning, keyboard, speed, accuracy, accessible, WCAG"
	/>
	<!-- Accessibility meta tags -->
	<meta name="theme-color" content="#4f43ae" />
	<meta name="color-scheme" content="light" />
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div
	id="main-app-container"
	class="flex flex-1 flex-col bg-gradient-to-br from-blue-50 to-indigo-100"
	data-testid="main-app-container"
	role="application"
	aria-label="Feed-n-Type - Interactive Typing Learning Game"
>
	<!-- ARIA Live Regions for Screen Reader Announcements -->
	<div aria-live="polite" aria-atomic="true" class="sr-only" data-testid="typing-announcements">
		{#if sessionActive && currentWpm > 0}
			Current typing speed: {currentWpm} words per minute
		{/if}
	</div>

	<div aria-live="assertive" aria-atomic="true" class="sr-only" data-testid="error-announcements">
		{#if hasTypingError}
			Typing error detected
		{/if}
	</div>

	<div
		aria-live="polite"
		aria-atomic="true"
		class="sr-only"
		data-testid="achievement-announcements"
	>
		{#if showAchievementCelebration && currentAchievement}
			Achievement unlocked: {currentAchievement}
		{/if}
	</div>

	<div aria-live="polite" aria-atomic="true" class="sr-only" data-testid="progress-announcements">
		{#if currentPosition > 0}
			Progress: {Math.round((currentPosition / practiceText.length) * 100)} percent complete
		{/if}
	</div>

	<!-- Header with navigation icons, title and reset button -->
	<header
		id="main-header"
		class="border-b border-[#4f43ae] bg-[#4f43ae]"
		data-testid="main-header"
		role="banner"
	>
		<div id="header-wrapper" class="mx-auto max-w-6xl px-6" data-testid="header-wrapper">
			<div
				id="header-content"
				class="flex h-16 items-center justify-between"
				data-testid="header-content"
			>
				<!-- Left: Title -->
				<div id="app-title-container" class="flex items-center" data-testid="app-title-container">
					<h1 id="app-title" class="text-2xl font-bold text-white" data-testid="app-title">
						Feed-n-Type
					</h1>
				</div>

				<!-- Right: Navigation Icons and Reset Button -->
				<div id="header-controls" class="flex items-center space-x-4" data-testid="header-controls">
					<nav
						id="navigation-controls"
						class="flex items-center space-x-3"
						data-testid="navigation-controls"
						aria-label="Application settings and options"
					>
						<button
							id="keyboard-settings-button"
							class="rounded-lg p-2 transition-colors hover:bg-[#b5b6e4] focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#4f43ae] focus:outline-none"
							aria-label="Open keyboard settings (Not yet implemented)"
							data-testid="keyboard-settings-button"
							type="button"
							title="Keyboard settings"
						>
							<svg
								class="h-6 w-6 text-white"
								fill="currentColor"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 640 640"
							>
								<path
									d="M96 176C87.2 176 80 183.2 80 192L80 448C80 456.8 87.2 464 96 464L544 464C552.8 464 560 456.8 560 448L560 192C560 183.2 552.8 176 544 176L96 176zM32 192C32 156.7 60.7 128 96 128L544 128C579.3 128 608 156.7 608 192L608 448C608 483.3 579.3 512 544 512L96 512C60.7 512 32 483.3 32 448L32 192zM208 384L432 384C440.8 384 448 391.2 448 400L448 416C448 424.8 440.8 432 432 432L208 432C199.2 432 192 424.8 192 416L192 400C192 391.2 199.2 384 208 384zM136 312C136 303.2 143.2 296 152 296L168 296C176.8 296 184 303.2 184 312L184 328C184 336.8 176.8 344 168 344L152 344C143.2 344 136 336.8 136 328L136 312zM152 216L168 216C176.8 216 184 223.2 184 232L184 248C184 256.8 176.8 264 168 264L152 264C143.2 264 136 256.8 136 248L136 232C136 223.2 143.2 216 152 216zM216 312C216 303.2 223.2 296 232 296L248 296C256.8 296 264 303.2 264 312L264 328C264 336.8 256.8 344 248 344L232 344C223.2 344 216 336.8 216 328L216 312zM232 216L248 216C256.8 216 264 223.2 264 232L264 248C264 256.8 256.8 264 248 264L232 264C223.2 264 216 256.8 216 248L216 232C216 223.2 223.2 216 232 216zM296 312C296 303.2 303.2 296 312 296L328 296C336.8 296 344 303.2 344 312L344 328C344 336.8 336.8 344 328 344L312 344C303.2 344 296 336.8 296 328L296 312zM312 216L328 216C336.8 216 344 223.2 344 232L344 248C344 256.8 336.8 264 328 264L312 264C303.2 264 296 256.8 296 248L296 232C296 223.2 303.2 216 312 216zM376 312C376 303.2 383.2 296 392 296L408 296C416.8 296 424 303.2 424 312L424 328C424 336.8 416.8 344 408 344L392 344C383.2 344 376 336.8 376 328L376 312zM392 216L408 216C416.8 216 424 223.2 424 232L424 248C424 256.8 416.8 264 408 264L392 264C383.2 264 376 256.8 376 248L376 232C376 223.2 383.2 216 392 216zM456 312C456 303.2 463.2 296 472 296L488 296C496.8 296 504 303.2 504 312L504 328C504 336.8 496.8 344 488 344L472 344C463.2 344 456 336.8 456 328L456 312zM472 216L488 216C496.8 216 504 223.2 504 232L504 248C504 256.8 496.8 264 488 264L472 264C463.2 264 456 256.8 456 248L256 232C456 223.2 463.2 216 472 216z"
								></path>
							</svg>
						</button>
						<button
							id="sound-settings-button"
							class="rounded-lg p-2 transition-colors hover:bg-[#b5b6e4] focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#4f43ae] focus:outline-none"
							aria-label="Open sound settings (Not yet implemented)"
							data-testid="sound-settings-button"
							type="button"
							title="Sound settings"
						>
							<svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z"
								></path>
							</svg>
						</button>
					</nav>
					<!-- Content Source Selection -->
					<div
						class="flex items-center space-x-2"
						role="group"
						aria-label="Content theme selection"
					>
						<button
							onclick={() => loadContentFromSource(ContentSource.POKEMON)}
							class="min-h-[44px] min-w-[44px] rounded-lg bg-yellow-400 px-3 py-2 text-xs font-medium text-yellow-900 transition-colors hover:bg-yellow-300 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:outline-none"
							disabled={isLoadingContent}
							aria-label="Load Pokemon themed content"
							type="button"
							title="Pokemon themed content"
						>
							⚡
						</button>
						<button
							onclick={() => loadContentFromSource(ContentSource.NINTENDO)}
							class="min-h-[44px] min-w-[44px] rounded-lg bg-red-400 px-3 py-2 text-xs font-medium text-red-900 transition-colors hover:bg-red-300 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
							disabled={isLoadingContent}
							aria-label="Load Nintendo themed content"
							type="button"
							title="Nintendo themed content"
						>
							🍄
						</button>
						<button
							onclick={() => loadContentFromSource(ContentSource.ROBLOX)}
							class="min-h-[44px] min-w-[44px] rounded-lg bg-blue-400 px-3 py-2 text-xs font-medium text-blue-900 transition-colors hover:bg-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
							disabled={isLoadingContent}
							aria-label="Load Roblox themed content"
							type="button"
							title="Roblox themed content"
						>
							🎮
						</button>
					</div>

					<button
						id="new-content-button"
						onclick={resetAndLoadNewContent}
						class="flex min-h-[44px] items-center space-x-2 rounded-lg bg-[#b5b6e4] px-3 py-2 text-[#4f43ae] transition-colors hover:bg-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#4f43ae] focus:outline-none"
						type="button"
						disabled={isLoadingContent}
						data-testid="new-content-button"
						aria-label="Load new typing content"
						title="Get new practice text"
						aria-describedby={isLoadingContent ? 'loading-content-description' : ''}
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
							/>
						</svg>
						<span class="text-sm">{isLoadingContent ? 'Loading...' : 'New Content'}</span>
					</button>
				</div>
			</div>
		</div>
	</header>

	<!-- Skip to main content link for keyboard users -->
	<a
		href="#typing-area-section"
		class="sr-only z-50 rounded-lg bg-white px-4 py-2 font-medium text-[#4f43ae] focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:ring-2 focus:ring-[#4f43ae] focus:outline-none"
	>
		Skip to typing area
	</a>

	<!-- Main content area with vertical layout -->
	<main
		id="main-content"
		class="mx-auto w-full max-w-6xl flex-1 p-4"
		data-testid="main-content"
		role="main"
	>
		<div
			id="main-layout-container"
			class="flex h-full flex-col gap-4"
			data-testid="main-layout-container"
		>
			<!-- Content source indicator -->
			{#if currentContent}
				<section
					class="flex items-center justify-between rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 p-3 shadow-sm"
					data-testid="content-info"
					role="region"
					aria-label="Current content information"
				>
					<div class="flex items-center space-x-3">
						<div
							class="flex h-8 w-8 items-center justify-center rounded-full"
							class:bg-yellow-200={currentContent.source === ContentSource.POKEMON}
							class:bg-red-200={currentContent.source === ContentSource.NINTENDO}
							class:bg-blue-200={currentContent.source === ContentSource.ROBLOX}
						>
							{#if currentContent.source === ContentSource.POKEMON}⚡
							{:else if currentContent.source === ContentSource.NINTENDO}🍄
							{:else if currentContent.source === ContentSource.ROBLOX}🎮
							{/if}
						</div>
						<div>
							<h2 class="text-sm font-semibold text-gray-800">{currentContent.title}</h2>
							<p class="text-xs text-gray-600">
								{currentContent.source.charAt(0).toUpperCase() + currentContent.source.slice(1)} •
								{currentContent.difficulty} •
								{currentContent.wordCount} words
							</p>
						</div>
					</div>
					<button
						onclick={resetAndLoadNewContent}
						class="min-h-[44px] rounded-md bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
						disabled={isLoadingContent}
						aria-label="Load next content"
						type="button"
					>
						{isLoadingContent ? 'Loading...' : 'Next'}
					</button>
				</section>
			{/if}

			<!-- Combined typing area with Typingotchi -->
			<section
				id="typing-area-section"
				class="min-h-0 flex-[3] rounded-lg bg-white shadow-lg"
				data-testid="typing-area-container"
				role="region"
				aria-label="Typing practice and virtual pet area"
				tabindex="-1"
			>
				<div class="flex h-full flex-col">
					<!-- Text display area -->
					<div class="flex-1">
						<TypingArea
							text={practiceText}
							{userInput}
							{currentPosition}
							{sessionActive}
							onProgressUpdate={handleProgressUpdate}
							data-component-id="typing-area"
						/>
					</div>

					<!-- Typingotchi playground - Game Boy LCD style -->
					<section
						class="gameboy-lcd relative flex h-28 overflow-hidden border-t border-[#6b7b2f] bg-[#9bbc0f]"
						role="region"
						aria-label="Virtual pet playground - Typingotchi responds to your typing"
					>
						<div
							class="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/5"
						></div>
						<div
							class="absolute inset-0"
							style="background-image: radial-gradient(circle at 1px 1px, rgba(15, 56, 15, 0.15) 1px, transparent 0); background-size: 4px 4px;"
						></div>

						<!-- Main playground area (left side) -->
						<div class="relative flex-1">
							<div class="relative z-10" style="margin-left: {typingotchiOffset}px">
								<Typingotchi
									{isTyping}
									hasError={hasTypingError}
									wpm={currentWpm}
									streak={currentStreak}
									fireLevel={Math.min(5, Math.floor(currentWpm / 10))}
									{poopCount}
									{fallingWords}
									onEatWord={removeWord}
									{evolutionForm}
									{emotionalState}
									{celebrationQueue}
									{showEvolutionAnimation}
									onEvolutionComplete={handleEvolutionComplete}
									onCelebrationComplete={handleCelebrationComplete}
									data-component-id="typingotchi"
								/>
							</div>
						</div>

						<!-- Status box (right side) - content-aware size -->
						<aside
							class="relative z-10 min-w-20 border-l border-[#6b7b2f] bg-[#9bbc0f]/80"
							data-testid="stats-box"
							role="complementary"
							aria-label="Real-time typing statistics"
						>
							<div class="flex h-full flex-col justify-center gap-0.5 px-2 py-1 text-[#0f380f]">
								<div
									class="font-mono text-xs font-bold"
									aria-label="Words per minute: {currentWpm}"
								>
									WPM: {currentWpm}
								</div>
								<div
									class="font-mono text-xs font-bold"
									aria-label="Available words: {fallingWords.length}"
								>
									Words: {fallingWords.length}
								</div>
								<div class="font-mono text-xs font-bold" aria-label="Typing errors: {poopCount}">
									💩: {poopCount}
								</div>
							</div>
						</aside>
					</section>

					<!-- Progress bar - flush against lawn, rounded bottom only -->
					<div
						class="relative h-8 w-full rounded-b-lg bg-slate-600 shadow-inner"
						role="progressbar"
						aria-label="Typing progress"
						aria-valuenow={Math.round((currentPosition / practiceText.length) * 100)}
						aria-valuemin="0"
						aria-valuemax="100"
						aria-valuetext="{Math.round(
							(currentPosition / practiceText.length) * 100
						)} percent complete"
					>
						<div
							class="relative h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500 ease-out"
							style="width: {currentPosition > 0
								? (currentPosition / practiceText.length) * 100
								: 0}%"
							data-testid="progress-bar"
						></div>
						<!-- Progress percentage and message -->
						<div
							class="absolute inset-0 flex items-center justify-center text-sm font-bold text-white"
							aria-hidden="true"
						>
							{#if currentPosition === 0}
								Start typing!
							{:else}
								{Math.round((currentPosition / practiceText.length) * 100)}% Complete
							{/if}
						</div>
					</div>
				</div>
			</section>

			<!-- Bottom: Virtual keyboard -->
			<section
				id="virtual-keyboard-section"
				class="flex min-h-0 flex-[2] items-center justify-center"
				data-testid="virtual-keyboard-container"
				role="region"
				aria-label="Virtual keyboard for typing practice"
			>
				<div
					id="virtual-keyboard-wrapper"
					class="w-full max-w-4xl"
					data-testid="virtual-keyboard-wrapper"
				>
					<VirtualKeyboard
						onKeyPress={handleKeyPress}
						{pressedKey}
						{capsLockOn}
						onCapsLockToggle={() => (capsLockOn = !capsLockOn)}
						nextKey={nextExpectedKey()}
						{challengingKeys}
						showChallengingKeys={true}
						data-component-id="virtual-keyboard"
					/>
				</div>
			</section>
		</div>
	</main>

	<!-- Achievement Celebration Overlay -->
	{#if showAchievementCelebration && currentAchievement}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
			role="dialog"
			aria-modal="true"
			aria-labelledby="achievement-title"
			aria-describedby="achievement-message"
			data-testid="achievement-overlay"
			tabindex="-1"
			onclick={() => {
				showAchievementCelebration = false;
				currentAchievement = null;
			}}
			onkeydown={(e) => {
				if (e.key === 'Escape') {
					showAchievementCelebration = false;
					currentAchievement = null;
				}
			}}
		>
			<div
				class="relative mx-4 max-w-md rounded-xl bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500 p-1 shadow-2xl"
				role="document"
			>
				<div class="rounded-lg bg-white p-6 text-center">
					<!-- Celebration Icon -->
					<div class="mb-4 flex justify-center">
						<div class="relative">
							<div class="text-6xl">🎉</div>
							<div class="absolute -top-2 -right-2 animate-bounce text-2xl">✨</div>
							<div class="absolute -bottom-2 -left-2 animate-pulse text-2xl">🌟</div>
						</div>
					</div>

					<!-- Achievement Title -->
					<h2
						id="achievement-title"
						class="mb-3 text-2xl font-bold text-gray-900"
						data-testid="achievement-title"
					>
						Achievement Unlocked!
					</h2>

					<!-- Achievement Message -->
					<p
						id="achievement-message"
						class="mb-6 text-lg font-medium text-gray-700"
						data-testid="achievement-message"
					>
						{currentAchievement}
					</p>

					<!-- Close Button -->
					<button
						class="min-h-[44px] rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 font-semibold text-white transition-all hover:from-purple-700 hover:to-blue-700 hover:shadow-lg focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none"
						onclick={() => {
							showAchievementCelebration = false;
							currentAchievement = null;
						}}
						data-testid="achievement-close-button"
						type="button"
						aria-label="Close achievement celebration"
						autofocus
					>
						Awesome!
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Screen reader only content */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.sr-only:focus {
		position: static;
		width: auto;
		height: auto;
		padding: inherit;
		margin: inherit;
		overflow: visible;
		clip: auto;
		white-space: normal;
	}

	/* Focus visible improvements for keyboard navigation */
	.focus\:not-sr-only:focus {
		position: static;
		width: auto;
		height: auto;
		padding: 1rem;
		margin: 0;
		overflow: visible;
		clip: auto;
		white-space: normal;
	}
</style>
