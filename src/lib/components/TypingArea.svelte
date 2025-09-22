<script lang="ts">
	import type { ProgressTrackingService } from '$lib/types/index.js';

	/**
	 * Props interface for the TypingArea component.
	 * Displays practice text with real-time typing feedback and progress tracking.
	 */
	interface Props {
		text: string;
		userInput: string;
		currentPosition: number;
		progressService?: ProgressTrackingService;
		sessionActive?: boolean;
		onProgressUpdate?: (wpm: number, accuracy: number) => void;
		'data-component-id'?: string;
	}

	let {
		text,
		userInput,
		currentPosition,
		progressService,
		sessionActive = false,
		onProgressUpdate,
		'data-component-id': componentId
	}: Props = $props();

	/**
	 * Split practice text into individual characters for granular styling.
	 * This enables highlighting each character based on typing progress and accuracy.
	 */
	let characters = $derived(text.split(''));

	/**
	 * Progress tracking state for real-time metrics calculation
	 */
	let sessionStartTime = $state<number | null>(null);
	let keystrokeCount = $state(0);
	let errorCount = $state(0);
	let lastKeystrokeTime = $state<number | null>(null);

	/**
	 * Calculate real-time WPM based on current progress
	 * Standard formula: (characters typed / 5) / (time in minutes)
	 */
	let currentWPM = $derived.by(() => {
		if (!sessionStartTime || !lastKeystrokeTime) return 0;
		const timeInMinutes = (lastKeystrokeTime - sessionStartTime) / 60000;
		if (timeInMinutes <= 0) return 0;
		const wordsTyped = userInput.length / 5;
		return Math.round(wordsTyped / timeInMinutes);
	});

	/**
	 * Calculate real-time accuracy based on correct vs total characters
	 */
	let currentAccuracy = $derived.by(() => {
		if (userInput.length === 0) return 100;
		const correctChars = userInput.length - errorCount;
		return Math.round((correctChars / userInput.length) * 100);
	});

	/**
	 * Track progress and update metrics when user input changes
	 */
	$effect(() => {
		if (!sessionActive || !progressService) return;

		// Initialize session timing
		if (userInput.length === 1 && !sessionStartTime) {
			sessionStartTime = Date.now();
			lastKeystrokeTime = Date.now();
			keystrokeCount = 1;
			return;
		}

		// Track keystroke timing and errors
		if (userInput.length > 0) {
			lastKeystrokeTime = Date.now();
			keystrokeCount = userInput.length;

			// Count errors by comparing with expected text
			let errors = 0;
			for (let i = 0; i < userInput.length; i++) {
				if (i < text.length && userInput[i] !== text[i]) {
					errors++;
				}
			}
			errorCount = errors;

			// Report progress to parent component
			if (onProgressUpdate) {
				onProgressUpdate(currentWPM, currentAccuracy);
			}
		}
	});

	/**
	 * Reset progress tracking when session ends or restarts
	 */
	$effect(() => {
		if (!sessionActive) {
			sessionStartTime = null;
			lastKeystrokeTime = null;
			keystrokeCount = 0;
			errorCount = 0;
		}
	});

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
	<!-- Progress tracking display (only shown when session is active) -->
	{#if sessionActive && (currentWPM > 0 || keystrokeCount > 0)}
		<div
			class="progress-display"
			role="region"
			aria-label="Real-time typing progress"
			data-testid="progress-display"
		>
			<div class="progress-metrics">
				<div class="metric" data-testid="wpm-display">
					<span class="metric-label">WPM</span>
					<span class="metric-value" aria-live="polite">{currentWPM}</span>
				</div>
				<div class="metric" data-testid="accuracy-display">
					<span class="metric-label">Accuracy</span>
					<span class="metric-value" aria-live="polite">{currentAccuracy}%</span>
				</div>
				<div class="metric" data-testid="progress-counter">
					<span class="metric-label">Progress</span>
					<span class="metric-value">
						{userInput.length}/{text.length}
					</span>
				</div>
			</div>
		</div>
	{/if}

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

	.progress-display {
		margin-bottom: 1rem;
		padding: 0.75rem;
		background-color: rgb(243 244 246);
		border-radius: 0.375rem;
		border: 1px solid rgb(209 213 219);
	}

	.progress-metrics {
		display: flex;
		gap: 1.5rem;
		justify-content: center;
		align-items: center;
	}

	.metric {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		min-width: 4rem;
	}

	.metric-label {
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: rgb(107 114 128);
	}

	.metric-value {
		font-size: 1.25rem;
		font-weight: 700;
		color: rgb(17 24 39);
		font-family:
			ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
	}

	@media (max-width: 640px) {
		.progress-metrics {
			gap: 1rem;
		}

		.metric {
			min-width: 3rem;
		}

		.metric-value {
			font-size: 1rem;
		}
	}
</style>
