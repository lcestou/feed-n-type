<script lang="ts">
	/**
	 * Props interface for the TypingArea component.
	 * Displays practice text with real-time typing feedback and progress tracking.
	 */
	interface Props {
		text: string;
		userInput: string;
		currentPosition: number;
		'data-component-id'?: string;
	}

	let { text, userInput, currentPosition, 'data-component-id': componentId }: Props = $props();

	/**
	 * Split practice text into individual characters for granular styling.
	 * This enables highlighting each character based on typing progress and accuracy.
	 */
	let characters = $derived(text.split(''));

	/**
	 * Determine visual states for each character based on typing progress.
	 *
	 * Character states:
	 * - 'correct': User typed the character correctly
	 * - 'incorrect': User typed the wrong character
	 * - 'current': Character at the current typing position
	 * - 'upcoming': Characters not yet reached
	 *
	 * @returns Array of state strings corresponding to each character
	 */
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

<div
	id="typing-area"
	class="typing-area"
	role="region"
	aria-label="Typing practice area"
	data-component-id={componentId}
	data-testid="typing-area"
>
	<!-- Removed "Type the text below" header for cleaner design -->

	<div
		id="text-display"
		class="text-display"
		role="textbox"
		aria-readonly="true"
		aria-label="Text to type"
		data-testid="text-display"
	>
		{#each characters as char, index (index)}
			<span
				id="char-{index}"
				class="character {characterStates[index]}"
				class:space={char === ' '}
				aria-label="{char === ' ' ? 'space' : char} - {characterStates[index]}"
				data-testid="character-{index}"
			>
				{char === ' ' ? '·' : char}
			</span>
		{/each}
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
