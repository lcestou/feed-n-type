<script lang="ts">
	/* eslint-disable @typescript-eslint/no-unused-vars */

	/**
	 * Props interface for the Typingotchi virtual pet component.
	 * Defines the interactive pet that responds to typing performance and errors.
	 */
	interface TypingotchiProps {
		isTyping: boolean;
		hasError: boolean;
		wpm: number;
		streak: number;
		fireLevel: number;
		'data-component-id'?: string;
	}

	let {
		isTyping = false,
		hasError = false,
		wpm = 0,
		streak = 0,
		fireLevel = 0,
		'data-component-id': componentId
	}: TypingotchiProps = $props();

	/**
	 * ASCII art faces for different moods and emotional states.
	 * Each mood represents a different typing performance or error state.
	 * Contains just the face expressions without frames for clean display.
	 */
	const asciiArt = {
		neutral: `◕ ◕
 ─ `,
		neutralBlink: `─ ─
 ─ `,
		focused: `◔ ◔
 ○ `,
		happy: `◕ ◕
◡_◡`,
		excited: `★ ★
◡_◡`,
		worried: `× ×
∪_∪`,
		heatingUp: `◉ ◉
 ◡ `,
		onFire: `✦ ✦
◡_◡`,
		superFire: `✺ ✺
◊◡◊`
	};

	/** Reactive state controlling the blinking animation for neutral mood */
	let isBlinking = $state(false);

	/** Derived state determining if pet should be in neutral state (no errors, not typing) */
	let isNeutralState = $derived(!hasError && !isTyping);

	/** Interval reference for managing the blinking animation timer */
	let blinkInterval: ReturnType<typeof setInterval>;
	$effect(() => {
		// Only blink when in neutral mood
		if (isNeutralState) {
			blinkInterval = setInterval(() => {
				isBlinking = true;
				setTimeout(() => {
					isBlinking = false;
				}, 150); // Blink duration
			}, 3000); // Blink every 3 seconds
		} else {
			clearInterval(blinkInterval);
			if (isBlinking) {
				isBlinking = false;
			}
		}

		return () => clearInterval(blinkInterval);
	});

	/**
	 * Derived character state based on typing performance, streak, and error feedback.
	 * Returns an object containing ASCII art, status message, and mood identifier.
	 *
	 * Priority order:
	 * 1. Fire levels (3: super fire, 2: on fire, 1: heating up)
	 * 2. Error state (worried mood)
	 * 3. Typing performance (excited > happy > focused)
	 * 4. Neutral state (with blinking animation)
	 *
	 * @returns Character state object with ascii, status, and mood properties
	 */
	let character = $derived(() => {
		// Streak states have priority over other states
		if (fireLevel === 3) {
			return {
				ascii: asciiArt.superFire,
				status: `SUPER FIRE! ${streak} streak!`,
				mood: 'superFire'
			};
		} else if (fireLevel === 2) {
			return { ascii: asciiArt.onFire, status: `ON FIRE! ${streak} streak!`, mood: 'onFire' };
		} else if (fireLevel === 1) {
			return {
				ascii: asciiArt.heatingUp,
				status: `Heating up! ${streak} streak!`,
				mood: 'heatingUp'
			};
		} else if (hasError) {
			return { ascii: asciiArt.worried, status: 'Oops! Try again', mood: 'worried' };
		} else if (isTyping && wpm > 60) {
			return { ascii: asciiArt.excited, status: 'Amazing speed!', mood: 'excited' };
		} else if (isTyping && wpm > 30) {
			return { ascii: asciiArt.happy, status: 'Great job!', mood: 'happy' };
		} else if (isTyping) {
			return { ascii: asciiArt.focused, status: 'Keep going!', mood: 'focused' };
		} else {
			// Show blinking animation when neutral and idle
			const currentAscii = isBlinking ? asciiArt.neutralBlink : asciiArt.neutral;
			return { ascii: currentAscii, status: 'Ready to type!', mood: 'neutral' };
		}
	});

	/**
	 * Derived CSS animation classes based on the current character mood.
	 * Maps mood states to corresponding Tailwind CSS animation classes.
	 *
	 * @returns CSS class string for animations (bounce, pulse, ping, etc.)
	 */
	let animationClass = $derived(() => {
		switch (character().mood) {
			case 'superFire':
				return 'fire-super animate-bounce';
			case 'onFire':
				return 'fire-glow animate-pulse';
			case 'heatingUp':
				return 'fire-warm';
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

	/**
	 * Derived CSS classes for fire aura effects based on current fire level.
	 * Creates visual glow effects that intensify with higher fire levels.
	 *
	 * @returns CSS class string for fire aura effects
	 */
	let fireEffectClass = $derived(() => {
		switch (fireLevel) {
			case 3:
				return 'fire-aura-super';
			case 2:
				return 'fire-aura-glow';
			case 1:
				return 'fire-aura-warm';
			default:
				return '';
		}
	});
</script>

<div
	id="typingotchi-container"
	class="flex h-full flex-col items-center justify-center space-y-4 rounded-xl border-2 border-gray-200 bg-white p-6 shadow-lg"
	role="region"
	aria-label="Typingotchi pet"
	data-component-id={componentId}
	data-testid="typingotchi"
>
	<!-- Pet Header -->
	<div id="typingotchi-header" class="text-center" data-testid="typingotchi-header">
		<h3
			id="typingotchi-title"
			class="mb-2 text-lg font-semibold text-gray-800"
			data-testid="typingotchi-title"
		>
			Key-otchi
		</h3>
		<div class="relative">
			<!-- Fire aura background effect -->
			{#if fireLevel > 0}
				<div
					class="absolute inset-0 rounded-xl {fireEffectClass()}"
					style="z-index: 0;"
					data-testid="typingotchi-fire-aura"
				></div>
			{/if}

			<!-- Pet avatar -->
			<div
				id="typingotchi-avatar"
				class="relative flex h-20 w-20 items-center justify-center rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-100 to-blue-100 {animationClass()}"
				style="z-index: 1;"
				data-testid="typingotchi-avatar"
			>
				<pre
					id="typingotchi-ascii"
					class="bg-transparent font-mono text-xs leading-tight text-gray-700 select-none"
					style="background: transparent !important; box-shadow: none !important;"
					role="img"
					aria-label="typing pet emotion: {character().mood}"
					data-testid="typingotchi-ascii">{character().ascii}</pre>
			</div>
		</div>
	</div>

	<!-- Status Message -->
	<div id="typingotchi-status" class="text-center" data-testid="typingotchi-status">
		<p
			id="typingotchi-message"
			class="mb-1 text-sm font-medium text-gray-700"
			role="status"
			aria-live="polite"
			data-testid="typingotchi-message"
		>
			{character().status}
		</p>

		<!-- Stats -->
		<div
			id="typingotchi-stats"
			class="space-y-1 text-xs text-gray-500"
			data-testid="typingotchi-stats"
		>
			{#if wpm > 0}
				<div id="typingotchi-wpm" aria-label="Words per minute" data-testid="typingotchi-wpm">
					Speed: {wpm} WPM
				</div>
			{/if}

			{#if streak > 0}
				<div
					id="typingotchi-streak"
					aria-label="Current streak"
					class={fireLevel > 0 ? 'font-semibold text-orange-600' : 'text-blue-600'}
					data-testid="typingotchi-streak"
				>
					🔥 Streak: {streak}
				</div>
			{/if}

			<!-- Mood indicator -->
			<div
				id="typingotchi-mood"
				class="flex items-center justify-center gap-1"
				role="img"
				aria-label="Mood level: {character().mood}"
				data-testid="typingotchi-mood"
			>
				<span class="text-xs">Mood:</span>
				<div class="flex gap-1">
					{#each Array(3) as _, i (i)}
						<div
							id="mood-indicator-{i}"
							class="h-2 w-2 rounded-full {i <
							(character().mood === 'superFire'
								? 3
								: character().mood === 'onFire'
									? 3
									: character().mood === 'heatingUp'
										? 2
										: character().mood === 'excited'
											? 3
											: character().mood === 'happy'
												? 2
												: character().mood === 'worried'
													? 0
													: 1)
								? fireLevel > 0
									? 'bg-orange-400'
									: 'bg-green-400'
								: 'bg-gray-300'}"
							data-testid="mood-indicator-{i}"
						></div>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<!-- Simple care actions -->
	<div
		id="typingotchi-actions"
		class="flex gap-2"
		role="group"
		aria-label="Pet care actions"
		data-testid="typingotchi-actions"
	>
		<button
			id="typingotchi-feed"
			class="cursor-default rounded-full bg-purple-100 px-3 py-1 font-mono text-xs text-purple-700 transition-colors hover:bg-purple-200"
			type="button"
			aria-label="Feed your Key-otchi"
			data-testid="typingotchi-feed-button"
		>
			◊ Feed
		</button>
		<button
			id="typingotchi-play"
			class="cursor-default rounded-full bg-blue-100 px-3 py-1 font-mono text-xs text-blue-700 transition-colors hover:bg-blue-200"
			type="button"
			aria-label="Play with your Key-otchi"
			data-testid="typingotchi-play-button"
		>
			♦ Play
		</button>
	</div>
</div>

<style>
	/* Fire effect animations and styles */
	.fire-aura-warm {
		background: radial-gradient(
			circle,
			rgba(255, 183, 77, 0.3) 0%,
			rgba(255, 183, 77, 0.1) 70%,
			transparent 100%
		);
		animation: warmGlow 2s ease-in-out infinite alternate;
	}

	.fire-aura-glow {
		background: radial-gradient(
			circle,
			rgba(255, 107, 53, 0.5) 0%,
			rgba(255, 183, 77, 0.3) 50%,
			rgba(255, 183, 77, 0.1) 70%,
			transparent 100%
		);
		animation: fireGlow 1.5s ease-in-out infinite alternate;
	}

	.fire-aura-super {
		background: radial-gradient(
			circle,
			rgba(255, 69, 0, 0.7) 0%,
			rgba(255, 107, 53, 0.5) 30%,
			rgba(255, 183, 77, 0.3) 60%,
			rgba(255, 183, 77, 0.1) 80%,
			transparent 100%
		);
		animation: superFireGlow 1s ease-in-out infinite alternate;
	}

	.fire-warm {
		filter: hue-rotate(20deg) saturate(1.2);
	}

	.fire-glow {
		filter: hue-rotate(30deg) saturate(1.5) brightness(1.1);
		text-shadow: 0 0 8px rgba(255, 107, 53, 0.5);
	}

	.fire-super {
		filter: hue-rotate(40deg) saturate(2) brightness(1.3);
		text-shadow:
			0 0 12px rgba(255, 69, 0, 0.8),
			0 0 20px rgba(255, 107, 53, 0.6);
	}

	@keyframes warmGlow {
		0% {
			opacity: 0.6;
			transform: scale(1);
		}
		100% {
			opacity: 0.8;
			transform: scale(1.05);
		}
	}

	@keyframes fireGlow {
		0% {
			opacity: 0.7;
			transform: scale(1.02);
		}
		100% {
			opacity: 1;
			transform: scale(1.1);
		}
	}

	@keyframes superFireGlow {
		0% {
			opacity: 0.8;
			transform: scale(1.05);
		}
		100% {
			opacity: 1;
			transform: scale(1.15);
		}
	}
</style>
