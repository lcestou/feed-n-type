<script lang="ts">
	interface TypingotchiProps {
		isTyping: boolean;
		hasError: boolean;
		wpm: number;
	}

	let { isTyping = false, hasError = false, wpm = 0 }: TypingotchiProps = $props();
	
	// ASCII art faces for different moods
	const asciiArt = {
		neutral: `
 ┌─────┐
 │ ◕ ◕ │
 │  ─  │
 │ [_] │
 └─────┘`,
		focused: `
 ┌─────┐
 │ ◔ ◔ │
 │  ○  │
 │ [_] │
 └─────┘`,
		happy: `
 ┌─────┐
 │ ◕ ◕ │
 │  ∩  │
 │ ◡_◡ │
 └─────┘`,
		excited: `
 ┌─────┐
 │ ★ ★ │
 │  ∆  │
 │ ◡_◡ │
 └─────┘`,
		worried: `
 ┌─────┐
 │ × × │
 │  ~  │
 │ ∪_∪ │
 └─────┘`
	};

	// Character states based on typing performance, user interaction, and emotional feedback
	let character = $derived(() => {
		if (hasError) {
			return { ascii: asciiArt.worried, status: 'Oops! Try again', mood: 'worried' };
		} else if (isTyping && wpm > 60) {
			return { ascii: asciiArt.excited, status: 'Amazing speed!', mood: 'excited' };
		} else if (isTyping && wpm > 30) {
			return { ascii: asciiArt.happy, status: 'Great job!', mood: 'happy' };
		} else if (isTyping) {
			return { ascii: asciiArt.focused, status: 'Keep going!', mood: 'focused' };
		} else {
			return { ascii: asciiArt.neutral, status: 'Ready to type!', mood: 'neutral' };
		}
	});

	// Animation classes based on mood
	let animationClass = $derived(() => {
		switch (character().mood) {
			case 'excited':
				return 'animate-bounce';
			case 'happy':
				return 'animate-pulse';
			case 'worried':
				return 'animate-ping';
			default:
				return '';
		}
	});
</script>

<div id="typingotchi-container" class="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 h-full flex flex-col items-center justify-center space-y-4" role="region" aria-label="Typingotchi pet">
	<!-- Pet Header -->
	<div id="typingotchi-header" class="text-center">
		<h3 id="typingotchi-title" class="text-lg font-semibold text-gray-800 mb-2">Key-otchi</h3>
		<div id="typingotchi-avatar" class="bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl p-3 border-2 border-purple-200 shadow-inner {animationClass()}">
			<pre id="typingotchi-ascii" class="text-xs leading-tight font-mono text-gray-700 select-none" role="img" aria-label="typing pet emotion: {character().mood}">{character().ascii}</pre>
		</div>
	</div>

	<!-- Status Message -->
	<div id="typingotchi-status" class="text-center">
		<p id="typingotchi-message" class="text-sm font-medium text-gray-700 mb-1" role="status" aria-live="polite">
			{character().status}
		</p>
		
		<!-- Stats -->
		<div id="typingotchi-stats" class="text-xs text-gray-500 space-y-1">
			{#if wpm > 0}
				<div id="typingotchi-wpm" aria-label="Words per minute">Speed: {wpm} WPM</div>
			{/if}
			
			<!-- Mood indicator -->
			<div id="typingotchi-mood" class="flex items-center justify-center gap-1" role="img" aria-label="Mood level: {character().mood}">
				<span class="text-xs">Mood:</span>
				<div class="flex gap-1">
					{#each Array(3) as _, i}
						<div id="mood-indicator-{i}" class="w-2 h-2 rounded-full {i < (character().mood === 'excited' ? 3 : character().mood === 'happy' ? 2 : character().mood === 'worried' ? 0 : 1) ? 'bg-green-400' : 'bg-gray-300'}"></div>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<!-- Simple care actions -->
	<div id="typingotchi-actions" class="flex gap-2" role="group" aria-label="Pet care actions">
		<button 
			id="typingotchi-feed"
			class="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors cursor-default font-mono"
			type="button"
			aria-label="Feed your Key-otchi"
		>
			◊ Feed
		</button>
		<button 
			id="typingotchi-play"
			class="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors cursor-default font-mono"
			type="button"
			aria-label="Play with your Key-otchi"
		>
			♦ Play
		</button>
	</div>
</div>