<script lang="ts">
	interface TypingotchiProps {
		isTyping: boolean;
		hasError: boolean;
		wpm: number;
	}

	let { isTyping = false, hasError = false, wpm = 0 }: TypingotchiProps = $props();
	
	// Character states based on typing performance, user interaction, and emotional feedback
	let character = $derived(() => {
		if (hasError) {
			return { emoji: '😓', status: 'Oops! Try again', mood: 'worried' };
		} else if (isTyping && wpm > 60) {
			return { emoji: '🤩', status: 'Amazing speed!', mood: 'excited' };
		} else if (isTyping && wpm > 30) {
			return { emoji: '😊', status: 'Great job!', mood: 'happy' };
		} else if (isTyping) {
			return { emoji: '😌', status: 'Keep going!', mood: 'focused' };
		} else {
			return { emoji: '🙂', status: 'Ready to type!', mood: 'neutral' };
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

<div class="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 h-full flex flex-col items-center justify-center space-y-4">
	<!-- Pet Header -->
	<div class="text-center">
		<h3 class="text-lg font-semibold text-gray-800 mb-2">Typingotchi</h3>
		<div class="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center border-2 border-purple-200">
			<span class="text-3xl {animationClass()}" role="img" aria-label="typing pet">
				{character().emoji}
			</span>
		</div>
	</div>

	<!-- Status Message -->
	<div class="text-center">
		<p class="text-sm font-medium text-gray-700 mb-1">
			{character().status}
		</p>
		
		<!-- Stats -->
		<div class="text-xs text-gray-500 space-y-1">
			{#if wpm > 0}
				<div>Speed: {wpm} WPM</div>
			{/if}
			
			<!-- Mood indicator -->
			<div class="flex items-center justify-center gap-1">
				<span class="text-xs">Mood:</span>
				<div class="flex gap-1">
					{#each Array(3) as _, i}
						<div class="w-2 h-2 rounded-full {i < (character().mood === 'excited' ? 3 : character().mood === 'happy' ? 2 : character().mood === 'worried' ? 0 : 1) ? 'bg-green-400' : 'bg-gray-300'}"></div>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<!-- Simple care actions -->
	<div class="flex gap-2">
		<button 
			class="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors cursor-default"
			type="button"
		>
			🍎 Feed
		</button>
		<button 
			class="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors cursor-default"
			type="button"
		>
			🎮 Play
		</button>
	</div>
</div>