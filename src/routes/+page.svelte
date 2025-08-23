<script lang="ts">
	import TypingArea from '$lib/components/TypingArea.svelte';
	import VirtualKeyboard from '$lib/components/VirtualKeyboard.svelte';
	import Typingotchi from '$lib/components/Typingotchi.svelte';
	
	// Sample text for typing practice
	let practiceText = "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet at least once. It's perfect for typing practice because it helps you work on all the keys on your keyboard.";
	
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
	<title>Feed-n-Type</title>
	<meta name="description" content="Gamified typing practice with content you love" />
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
	<!-- Header -->
	<header class="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
		<div class="max-w-7xl mx-auto flex items-center justify-between">
			<div class="flex items-center space-x-3">
				<h1 class="text-2xl font-bold text-gray-900">Feed-n-Type</h1>
				<span class="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Practice Mode</span>
			</div>
			<div class="flex items-center space-x-4">
				<button 
					onclick={resetExercise}
					class="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
					type="button"
				>
					Reset
				</button>
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

