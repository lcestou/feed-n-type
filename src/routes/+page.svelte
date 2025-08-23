<script lang="ts">
	import TypingArea from '$lib/components/TypingArea.svelte';
	import VirtualKeyboard from '$lib/components/VirtualKeyboard.svelte';
	import Typingotchi from '$lib/components/Typingotchi.svelte';
	
	// Sample text for typing practice
	let practiceText = "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet at least once. It's perfect for typing practice because it helps you work on all the keys on your keyboard.";
	
	// Enhanced typing state with error tracking and performance metrics
	// Typing state
	let userInput = $state('');
	let currentPosition = $state(0);
	let pressedKey = $state<string>('');
	let startTime = $state<number | null>(null);
	
	// Typingotchi state
	let hasTypingError = $state(false);
	let currentWpm = $state(0);
	
	// Calculate WPM and detect errors
	let isTyping = $derived(userInput.length > 0 && currentPosition < practiceText.length);
	
	// Calculate WPM in real-time
	$effect(() => {
		if (startTime && userInput.length > 0) {
			const timeMinutes = (Date.now() - startTime) / 1000 / 60;
			const wordsTyped = userInput.trim().split(' ').length;
			currentWpm = Math.round(wordsTyped / timeMinutes) || 0;
		} else {
			currentWpm = 0;
		}
	});
	
	// Detect typing errors for Typingotchi feedback
	$effect(() => {
		if (userInput.length > 0) {
			const isCurrentCharCorrect = userInput[userInput.length - 1] === practiceText[userInput.length - 1];
			hasTypingError = !isCurrentCharCorrect;
			
			// Clear error state after a short delay
			if (hasTypingError) {
				setTimeout(() => {
					hasTypingError = false;
				}, 1000);
			}
		}
	});
	
	function handleKeyPress(key: string) {
		// Show visual feedback
		pressedKey = key;
		setTimeout(() => pressedKey = '', 150);
		
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
	
	function handleExerciseComplete() {
		const endTime = Date.now();
		const timeMinutes = (endTime - (startTime || endTime)) / 1000 / 60;
		const wordsTyped = practiceText.split(' ').length;
		const wpm = Math.round(wordsTyped / timeMinutes);
		
		alert(`Exercise complete! Your typing speed: ${wpm} WPM`);
		
		// Reset for next practice
		resetExercise();
	}
	
	function resetExercise() {
		userInput = '';
		currentPosition = 0;
		startTime = null;
		pressedKey = '';
		hasTypingError = false;
		currentWpm = 0;
	}
	
	// Handle physical keyboard input
	function handleKeydown(event: KeyboardEvent) {
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
		} else if (key.length === 1) {
			// Regular character
			key = key.toLowerCase();
		} else {
			// Ignore other keys
			return;
		}
		
		handleKeyPress(key);
	}
</script>

<svelte:head>
	<title>Feed-n-Type - Gamified Typing Practice</title>
	<meta name="description" content="Gamified typing practice with content you love - Practice Mode" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta name="author" content="Feed-n-Type Team" />
	<meta name="keywords" content="typing, practice, gamified, learning, keyboard, speed, accuracy" />
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
	<!-- Header with navigation icons, title and reset button -->
	<header class="bg-white border-b border-gray-200">
		<div class="max-w-6xl mx-auto px-6">
			<div class="flex items-center justify-between h-16" role="banner">
				<!-- Left: Navigation Icons -->
				<nav class="flex items-center space-x-8">
					<button id="keyboard-toggle" class="p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Keyboard settings">
						<svg class="w-6 h-6 text-gray-600" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
							<path d="M96 176C87.2 176 80 183.2 80 192L80 448C80 456.8 87.2 464 96 464L544 464C552.8 464 560 456.8 560 448L560 192C560 183.2 552.8 176 544 176L96 176zM32 192C32 156.7 60.7 128 96 128L544 128C579.3 128 608 156.7 608 192L608 448C608 483.3 579.3 512 544 512L96 512C60.7 512 32 483.3 32 448L32 192zM208 384L432 384C440.8 384 448 391.2 448 400L448 416C448 424.8 440.8 432 432 432L208 432C199.2 432 192 424.8 192 416L192 400C192 391.2 199.2 384 208 384zM136 312C136 303.2 143.2 296 152 296L168 296C176.8 296 184 303.2 184 312L184 328C184 336.8 176.8 344 168 344L152 344C143.2 344 136 336.8 136 328L136 312zM152 216L168 216C176.8 216 184 223.2 184 232L184 248C184 256.8 176.8 264 168 264L152 264C143.2 264 136 256.8 136 248L136 232C136 223.2 143.2 216 152 216zM216 312C216 303.2 223.2 296 232 296L248 296C256.8 296 264 303.2 264 312L264 328C264 336.8 256.8 344 248 344L232 344C223.2 344 216 336.8 216 328L216 312zM232 216L248 216C256.8 216 264 223.2 264 232L264 248C264 256.8 256.8 264 248 264L232 264C223.2 264 216 256.8 216 248L216 232C216 223.2 223.2 216 232 216zM296 312C296 303.2 303.2 296 312 296L328 296C336.8 296 344 303.2 344 312L344 328C344 336.8 336.8 344 328 344L312 344C303.2 344 296 336.8 296 328L296 312zM312 216L328 216C336.8 216 344 223.2 344 232L344 248C344 256.8 336.8 264 328 264L312 264C303.2 264 296 256.8 296 248L296 232C296 223.2 303.2 216 312 216zM376 312C376 303.2 383.2 296 392 296L408 296C416.8 296 424 303.2 424 312L424 328C424 336.8 416.8 344 408 344L392 344C383.2 344 376 336.8 376 328L376 312zM392 216L408 216C416.8 216 424 223.2 424 232L424 248C424 256.8 416.8 264 408 264L392 264C383.2 264 376 256.8 376 248L376 232C376 223.2 383.2 216 392 216zM456 312C456 303.2 463.2 296 472 296L488 296C496.8 296 504 303.2 504 312L504 328C504 336.8 496.8 344 488 344L472 344C463.2 344 456 336.8 456 328L456 312zM472 216L488 216C496.8 216 504 223.2 504 232L504 248C504 256.8 496.8 264 488 264L472 264C463.2 264 456 256.8 456 248L456 232C456 223.2 463.2 216 472 216z"></path>
						</svg>
					</button>
					<button id="sound-toggle" class="p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Sound settings">
						<svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z"></path>
						</svg>
					</button>
				</nav>
				
				<!-- Center: Title and Mode -->
				<div class="flex flex-col items-center">
					<h1 class="text-2xl font-bold text-gray-900">Feed-n-Type</h1>
					<span class="text-sm text-gray-500">Practice Mode</span>
				</div>
				
				<!-- Right: WPM Stats and Reset Button -->
				<div class="flex items-center space-x-4">
					<div class="flex items-center space-x-2 text-gray-600">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
						</svg>
						<span class="text-sm font-medium">{currentWpm} WPM</span>
					</div>
					<button 
						onclick={resetExercise}
						class="flex items-center space-x-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
						type="button"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
						</svg>
						<span class="text-sm">Reset</span>
					</button>
				</div>
			</div>
		</div>
	</header>
	
	<!-- Main content area with three-column layout -->
	<main class="flex-1 p-4 max-w-7xl mx-auto w-full">
		<div class="h-full flex gap-4">
			<!-- Left + Center: Original typing interface -->
			<div class="flex-1 flex flex-col gap-4">
				<!-- Upper portion: Text display area (60% of space) -->
				<div class="flex-[3] min-h-0">
					<TypingArea 
						text={practiceText}
						userInput={userInput}
						currentPosition={currentPosition}
					/>
				</div>
				
				<!-- Lower portion: Virtual keyboard (40% of space) -->
				<div class="flex-[2] min-h-0 flex items-center justify-center">
					<div class="w-full max-w-4xl">
						<VirtualKeyboard 
							onKeyPress={handleKeyPress}
							pressedKey={pressedKey}
						/>
					</div>
				</div>
			</div>
			
			<!-- Right: Typingotchi -->
			<div class="w-64 flex-shrink-0">
				<Typingotchi 
					isTyping={isTyping}
					hasError={hasTypingError}
					wpm={currentWpm}
				/>
			</div>
		</div>
	</main>
</div>

