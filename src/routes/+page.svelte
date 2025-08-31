<script lang="ts">
	import TypingArea from '$lib/components/TypingArea.svelte';
	import VirtualKeyboard from '$lib/components/VirtualKeyboard.svelte';
	import Typingotchi from '$lib/components/Typingotchi.svelte';

	/** Sample pangram text for comprehensive typing practice covering all alphabet letters */
	let practiceText =
		"The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet at least once. It's perfect for typing practice because it helps you work on all the keys on your keyboard.";

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

		// Handle special keys
		if (key === 'Backspace') {
			if (userInput.length > 0) {
				userInput = userInput.slice(0, -1);
				currentPosition = Math.max(0, currentPosition - 1);
			}
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

		// Start timer on first keystroke
		if (startTime === null) {
			startTime = Date.now();
		}

		// Add character to user input
		if (currentPosition < practiceText.length) {
			userInput += key;
			currentPosition++;
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
	function handleExerciseComplete() {
		const endTime = Date.now();
		const timeMinutes = (endTime - (startTime || endTime)) / 1000 / 60;
		const wordsTyped = practiceText.split(' ').length;
		const wpm = Math.round(wordsTyped / timeMinutes);

		alert(`Exercise complete! Your typing speed: ${wpm} WPM`);

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
		content="Interactive typing learning with engaging content - Practice Mode"
	/>
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta name="author" content="Feed-n-Type Team" />
	<meta name="keywords" content="typing, practice, gamified, learning, keyboard, speed, accuracy" />
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div
	id="main-app-container"
	class="flex flex-1 flex-col bg-gradient-to-br from-blue-50 to-indigo-100"
	data-testid="main-app-container"
>
	<!-- Header with navigation icons, title and reset button -->
	<header id="main-header" class="border-b border-gray-200 bg-white" data-testid="main-header">
		<div id="header-wrapper" class="mx-auto max-w-6xl px-6" data-testid="header-wrapper">
			<div
				id="header-content"
				class="flex h-16 items-center justify-between"
				role="banner"
				data-testid="header-content"
			>
				<!-- Left: Navigation Icons -->
				<nav
					id="navigation-controls"
					class="flex items-center space-x-8"
					data-testid="navigation-controls"
				>
					<button
						id="keyboard-settings-button"
						class="rounded-lg p-2 transition-colors hover:bg-gray-100"
						aria-label="Keyboard settings"
						data-testid="keyboard-settings-button"
					>
						<svg
							class="h-6 w-6 text-gray-600"
							fill="currentColor"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 640 640"
						>
							<path
								d="M96 176C87.2 176 80 183.2 80 192L80 448C80 456.8 87.2 464 96 464L544 464C552.8 464 560 456.8 560 448L560 192C560 183.2 552.8 176 544 176L96 176zM32 192C32 156.7 60.7 128 96 128L544 128C579.3 128 608 156.7 608 192L608 448C608 483.3 579.3 512 544 512L96 512C60.7 512 32 483.3 32 448L32 192zM208 384L432 384C440.8 384 448 391.2 448 400L448 416C448 424.8 440.8 432 432 432L208 432C199.2 432 192 424.8 192 416L192 400C192 391.2 199.2 384 208 384zM136 312C136 303.2 143.2 296 152 296L168 296C176.8 296 184 303.2 184 312L184 328C184 336.8 176.8 344 168 344L152 344C143.2 344 136 336.8 136 328L136 312zM152 216L168 216C176.8 216 184 223.2 184 232L184 248C184 256.8 176.8 264 168 264L152 264C143.2 264 136 256.8 136 248L136 232C136 223.2 143.2 216 152 216zM216 312C216 303.2 223.2 296 232 296L248 296C256.8 296 264 303.2 264 312L264 328C264 336.8 256.8 344 248 344L232 344C223.2 344 216 336.8 216 328L216 312zM232 216L248 216C256.8 216 264 223.2 264 232L264 248C264 256.8 256.8 264 248 264L232 264C223.2 264 216 256.8 216 248L216 232C216 223.2 223.2 216 232 216zM296 312C296 303.2 303.2 296 312 296L328 296C336.8 296 344 303.2 344 312L344 328C344 336.8 336.8 344 328 344L312 344C303.2 344 296 336.8 296 328L296 312zM312 216L328 216C336.8 216 344 223.2 344 232L344 248C344 256.8 336.8 264 328 264L312 264C303.2 264 296 256.8 296 248L296 232C296 223.2 303.2 216 312 216zM376 312C376 303.2 383.2 296 392 296L408 296C416.8 296 424 303.2 424 312L424 328C424 336.8 416.8 344 408 344L392 344C383.2 344 376 336.8 376 328L376 312zM392 216L408 216C416.8 216 424 223.2 424 232L424 248C424 256.8 416.8 264 408 264L392 264C383.2 264 376 256.8 376 248L376 232C376 223.2 383.2 216 392 216zM456 312C456 303.2 463.2 296 472 296L488 296C496.8 296 504 303.2 504 312L504 328C504 336.8 496.8 344 488 344L472 344C463.2 344 456 336.8 456 328L456 312zM472 216L488 216C496.8 216 504 223.2 504 232L504 248C504 256.8 496.8 264 488 264L472 264C463.2 264 456 256.8 456 248L456 232C456 223.2 463.2 216 472 216z"
							></path>
						</svg>
					</button>
					<button
						id="sound-settings-button"
						class="rounded-lg p-2 transition-colors hover:bg-gray-100"
						aria-label="Sound settings"
						data-testid="sound-settings-button"
					>
						<svg
							class="h-6 w-6 text-gray-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z"
							></path>
						</svg>
					</button>
				</nav>

				<!-- Center: Title -->
				<div
					id="app-title-container"
					class="flex flex-col items-center"
					data-testid="app-title-container"
				>
					<h1 id="app-title" class="text-2xl font-bold text-gray-900" data-testid="app-title">
						Feed-n-Type
					</h1>
				</div>

				<!-- Right: WPM Stats and Reset Button -->
				<div
					id="header-stats-controls"
					class="flex items-center space-x-4"
					data-testid="header-stats-controls"
				>
					<div
						id="wpm-display"
						class="flex items-center space-x-2 text-gray-600"
						data-testid="wpm-display"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/>
						</svg>
						<span id="wpm-value" class="text-sm font-medium" data-testid="wpm-value"
							>{currentWpm} WPM</span
						>
					</div>
					<button
						id="reset-exercise-button"
						onclick={resetExercise}
						class="flex items-center space-x-2 rounded-lg bg-indigo-600 px-3 py-2 text-white transition-colors hover:bg-indigo-700"
						type="button"
						data-testid="reset-exercise-button"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
							/>
						</svg>
						<span class="text-sm">Reset</span>
					</button>
				</div>
			</div>
		</div>
	</header>

	<!-- Main content area with three-column layout -->
	<main id="main-content" class="mx-auto w-full max-w-7xl flex-1 p-4" data-testid="main-content">
		<div id="main-layout-container" class="flex h-full gap-4" data-testid="main-layout-container">
			<!-- Left + Center: Original typing interface -->
			<div
				id="typing-interface-container"
				class="flex flex-1 flex-col gap-4"
				data-testid="typing-interface-container"
			>
				<!-- Upper portion: Text display area (60% of space) -->
				<div id="typing-area-section" class="min-h-0 flex-[3]" data-testid="typing-area-container">
					<TypingArea
						text={practiceText}
						{userInput}
						{currentPosition}
						data-component-id="typing-area"
					/>
				</div>

				<!-- Lower portion: Virtual keyboard (40% of space) -->
				<div
					id="virtual-keyboard-section"
					class="flex min-h-0 flex-[2] items-center justify-center"
					data-testid="virtual-keyboard-container"
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
							data-component-id="virtual-keyboard"
						/>
					</div>
				</div>
			</div>

			<!-- Right: Typingotchi -->
			<div id="typingotchi-section" class="w-64 flex-shrink-0" data-testid="typingotchi-container">
				<Typingotchi
					{isTyping}
					hasError={hasTypingError}
					wpm={currentWpm}
					streak={0}
					fireLevel={0}
					data-component-id="typingotchi"
				/>
			</div>
		</div>
	</main>
</div>
