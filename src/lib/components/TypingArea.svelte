<script lang="ts">
	interface Props {
		text: string;
		userInput: string;
		currentPosition: number;
	}

	let { text, userInput, currentPosition }: Props = $props();

	// Split text into characters for individual styling
	// This allows us to highlight each character based on typing progress
	let characters = $derived(text.split(''));

	// Determine character states (correct, incorrect, current, upcoming)
	// Each character gets a state based on the user's typing progress
	let characterStates = $derived(
		characters.map((char, index) => {
			if (index < userInput.length) {
				return userInput[index] === char ? 'correct' : 'incorrect';
			} else if (index === currentPosition) {
				return 'current';
			} else {
				return 'upcoming';
			}
		})
	);
</script>

<div id="typing-area" class="typing-area" role="region" aria-label="Typing practice area">
	<div id="typing-header" class="mb-4 text-center">
		<h2 id="typing-title" class="text-xl font-semibold text-gray-800">Type the text below</h2>
		<div id="typing-progress" class="mt-1 text-sm text-gray-500" role="status" aria-live="polite">
			Progress: {userInput.length}/{text.length} characters
		</div>
	</div>

	<div
		id="text-display"
		class="text-display"
		role="textbox"
		aria-readonly="true"
		aria-label="Text to type"
	>
		{#each characters as char, index (index)}
			<span
				id="char-{index}"
				class="character {characterStates[index]}"
				class:space={char === ' '}
				aria-label="{char === ' ' ? 'space' : char} - {characterStates[index]}"
			>
				{char === ' ' ? '·' : char}
			</span>
		{/each}
	</div>

	<!-- Typing stats -->
	<div id="typing-stats" class="stats-bar" role="group" aria-label="Typing statistics">
		<div id="accuracy-container">
			{#if userInput.length > 0}
				<span id="accuracy-stat" class="accuracy" role="status" aria-live="polite">
					Accuracy: {Math.round(
						(userInput.split('').filter((char, i) => char === characters[i]).length /
							userInput.length) *
							100
					)}%
				</span>
			{:else}
				<span id="accuracy-placeholder">Start typing to see accuracy</span>
			{/if}
		</div>
		<div id="wpm-stat" class="wpm" role="status" aria-live="polite" aria-label="Words per minute">
			WPM: 0
		</div>
	</div>
</div>

<style>
	.character {
		transition:
			color 200ms,
			background-color 200ms;
	}

	.character.correct {
		background-color: rgb(187 247 208);
		color: rgb(22 101 52);
	}

	.character.incorrect {
		background-color: rgb(254 202 202);
		color: rgb(153 27 27);
	}

	.character.current {
		background-color: rgb(191 219 254);
		color: rgb(30 64 175);
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	.character.upcoming {
		color: rgb(75 85 99);
	}

	.character.space {
		display: inline-block;
	}

	.character.space.correct {
		background-color: rgb(187 247 208);
	}

	.character.space.incorrect {
		background-color: rgb(254 202 202);
	}

	.character.space.current {
		background-color: rgb(191 219 254);
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	.typing-area {
		background-color: white;
		border-radius: 0.5rem;
		box-shadow:
			0 10px 15px -3px rgb(0 0 0 / 0.1),
			0 4px 6px -4px rgb(0 0 0 / 0.1);
		padding: 1.5rem;
		height: 100%;
		overflow: auto;
	}

	.text-display {
		font-family:
			ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
		font-size: 1.125rem;
		line-height: 1.75;
		padding: 1rem;
		background-color: rgb(249 250 251);
		border-radius: 0.375rem;
		border: 1px solid rgb(229 231 235);
	}

	.stats-bar {
		margin-top: 1rem;
		display: flex;
		justify-content: space-between;
		font-size: 0.875rem;
		color: rgb(75 85 99);
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
</style>
