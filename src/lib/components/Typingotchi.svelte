<script lang="ts">
	/* eslint-disable @typescript-eslint/no-unused-vars */
	import { untrack } from 'svelte';
	import type { EvolutionForm, EmotionalState, CelebrationEvent } from '$lib/types/index.js';

	/**
	 * Interface for falling word objects in the feeding system.
	 */
	interface FallingWord {
		id: string;
		word: string;
		x: number; // horizontal position (0-100%)
		y: number; // vertical position for animation
		timestamp: number;
		opacity: number; // for eating animation fade-out
		isBeingEaten: boolean; // flag for eating state
	}

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
		poopCount: number;
		evolutionForm?: EvolutionForm;
		emotionalState?: EmotionalState;
		totalWordsEaten?: number;
		celebrationQueue?: CelebrationEvent[];
		showEvolutionAnimation?: boolean;
		onEvolutionComplete?: () => void;
		onCelebrationComplete?: (eventId: string) => void;
		fallingWords?: FallingWord[];
		onEatWord?: (wordId: string) => void;
		'data-component-id'?: string;
	}

	let {
		isTyping = false,
		hasError = false,
		wpm = 0,
		streak = 0,
		fireLevel = 0,
		poopCount = 0,
		evolutionForm = 1, // EvolutionForm.EGG
		emotionalState = 'content', // EmotionalState.CONTENT
		totalWordsEaten = 0,
		celebrationQueue = [],
		showEvolutionAnimation = false,
		onEvolutionComplete,
		onCelebrationComplete,
		fallingWords = [],
		onEatWord,
		'data-component-id': componentId
	}: TypingotchiProps = $props();

	/**
	 * ASCII art faces for different moods and emotional states.
	 * Each mood represents a different typing performance or error state.
	 * Contains just the face expressions without frames for clean display.
	 * Evolution forms have different base appearances.
	 */
	const asciiArt = {
		// EGG form (EvolutionForm.EGG = 1)
		egg: {
			neutral: `◦ ◦
 ─ `,
			neutralBlink: `─ ─
 ─ `,
			focused: `◔ ◔
 ○ `,
			happy: `◦ ◦
◡_◡`,
			excited: `★ ★
◡_◡`,
			worried: `× ×
∪_∪`,
			eating: `◉ ◉
 ○ `
		},
		// BABY form (EvolutionForm.BABY = 2)
		baby: {
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
			eating: `◉ ◉
 ◡ `
		},
		// CHILD form (EvolutionForm.CHILD = 3)
		child: {
			neutral: `● ●
 ─ `,
			neutralBlink: `─ ─
 ─ `,
			focused: `◐ ◑
 ○ `,
			happy: `● ●
◡_◡`,
			excited: `★ ★
◡▽◡`,
			worried: `× ×
∩_∩`,
			eating: `◉ ◉
 ◡ `
		},
		// TEEN form (EvolutionForm.TEEN = 4)
		teen: {
			neutral: `◆ ◆
 ─ `,
			neutralBlink: `─ ─
 ─ `,
			focused: `◇ ◇
 ○ `,
			happy: `◆ ◆
◡_◡`,
			excited: `✦ ✦
◡▽◡`,
			worried: `× ×
∩_∩`,
			eating: `◉ ◉
 ◡ `
		},
		// ADULT form (EvolutionForm.ADULT = 5)
		adult: {
			neutral: `◈ ◈
 ─ `,
			neutralBlink: `─ ─
 ─ `,
			focused: `◇ ◇
 ○ `,
			happy: `◈ ◈
◡_◡`,
			excited: `✺ ✺
◡▽◡`,
			worried: `× ×
∩_∩`,
			eating: `◉ ◉
 ◡ `
		},
		// Fire states (maintain existing for compatibility)
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

	/** Derived heart count - starts at 5, decreases with mistakes, minimum 1 */
	let heartCount = $derived(Math.max(1, 5 - poopCount));

	/** Interval reference for managing the blinking animation timer */
	let blinkInterval: ReturnType<typeof setInterval>;

	// Character walking animation state
	/** Character's horizontal position (0-100%) */
	let characterX = $state(Math.random() * 80 + 10); // Start at random position (10-90%)

	/** Character's vertical offset for walking bounce */
	let characterY = $state(0);

	/** Walking direction (-1 = left, 1 = right) */
	let walkDirection = $state(Math.random() > 0.5 ? 1 : -1);

	/** Target word the character is moving toward */
	let targetWord = $state<FallingWord | null>(null);

	/** Character walking speed */
	const walkSpeed = 0.5; // slower walking speed

	/** Is character currently eating */
	let isEating = $state(false);

	/** Evolution animation state */
	let isEvolutionAnimating = $state(false);
	let evolutionProgress = $state(0);

	/** Current celebration being displayed */
	let currentCelebration = $state<CelebrationEvent | null>(null);
	let celebrationProgress = $state(0);

	/** Animation frame reference for walking */
	let animationFrame: number;

	/** Walking animation timer */
	let walkingTimer: ReturnType<typeof setInterval>;

	/** Evolution animation timer */
	let evolutionTimer: ReturnType<typeof setInterval>;

	/** Celebration animation timer */
	let celebrationTimer: ReturnType<typeof setInterval>;
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

	// Walking animation effect
	$effect(() => {
		// Start walking animation
		walkingTimer = setInterval(() => {
			// Random micro-jump movement
			characterX += walkDirection * walkSpeed;

			// Bounce character slightly for walking effect
			characterY = Math.sin(Date.now() * 0.01) * 2;

			// Change direction at boundaries or randomly
			if (characterX <= 10 || characterX >= 90 || Math.random() < 0.02) {
				walkDirection *= -1;
			}

			// Keep within bounds
			characterX = Math.max(10, Math.min(90, characterX));
		}, 100); // Update every 100ms for smooth movement

		return () => {
			clearInterval(walkingTimer);
		};
	});

	// Evolution animation effect
	$effect(() => {
		if (showEvolutionAnimation && !isEvolutionAnimating) {
			isEvolutionAnimating = true;
			evolutionProgress = 0;

			// Start evolution animation sequence
			evolutionTimer = setInterval(() => {
				evolutionProgress += 2;

				if (evolutionProgress >= 100) {
					clearInterval(evolutionTimer);
					isEvolutionAnimating = false;
					evolutionProgress = 0;

					// Notify parent that evolution animation is complete
					if (onEvolutionComplete) {
						onEvolutionComplete();
					}
				}
			}, 50); // Update every 50ms for smooth progress
		}

		return () => {
			if (evolutionTimer) {
				clearInterval(evolutionTimer);
			}
		};
	});

	// Celebration queue management effect
	$effect(() => {
		if (celebrationQueue.length > 0 && !currentCelebration) {
			// Start next celebration in queue
			const nextCelebration = celebrationQueue[0];
			currentCelebration = nextCelebration;
			celebrationProgress = 0;

			// Start celebration animation
			celebrationTimer = setInterval(() => {
				celebrationProgress += 5;

				if (celebrationProgress >= 100) {
					clearInterval(celebrationTimer);

					// Notify parent that celebration is complete
					if (onCelebrationComplete && currentCelebration) {
						onCelebrationComplete(currentCelebration.id);
					}

					currentCelebration = null;
					celebrationProgress = 0;
				}
			}, nextCelebration.duration / 20); // Divide duration by 20 for smooth progress
		}

		return () => {
			if (celebrationTimer) {
				clearInterval(celebrationTimer);
			}
		};
	});

	// TEMPORARILY DISABLED - Movement and targeting effects causing infinite loop
	// TODO: Re-implement step by step to identify the exact issue

	/*
	 * Character targeting effect - only handles word selection.
	 */
	/*$effect(() => {
		if (!fallingWords || fallingWords.length === 0) {
			targetWord = null;
			return;
		}

		// Find closest word to character if no current target or target was eaten
		const currentTargetExists = targetWord && fallingWords.some(w => w.id === targetWord?.id);
		if (!currentTargetExists) {
			let closest = fallingWords[0];
			// Use untrack to prevent circular dependency with movement effect
			const currentCharacterX = untrack(() => characterX);
			let closestDistance = Math.abs(closest.x - currentCharacterX);

			for (const word of fallingWords) {
				const distance = Math.abs(word.x - currentCharacterX);
				if (distance < closestDistance) {
					closest = word;
					closestDistance = distance;
				}
			}

			targetWord = closest;
		}
	});*/

	/*
	 * Character movement effect - separate from targeting to prevent circular updates.
	 */
	/*$effect(() => {
		if (!targetWord) return;

		// Start movement animation
		const moveTowardTarget = () => {
			if (!targetWord) {
				cancelAnimationFrame(animationFrame);
				return;
			}

			const distance = targetWord.x - characterX;
			const absDistance = Math.abs(distance);

			// Check if close enough to eat (within 5% of screen width)
			if (absDistance < 5) {
				eatWord(targetWord);
				return;
			}

			// Move toward target
			if (distance > 0) {
				characterX += Math.min(moveSpeed, absDistance);
			} else {
				characterX -= Math.min(moveSpeed, absDistance);
			}

			// Keep character within bounds (10% - 90%)
			characterX = Math.max(10, Math.min(90, characterX));

			animationFrame = requestAnimationFrame(moveTowardTarget);
		};

		moveTowardTarget();

		return () => {
			cancelAnimationFrame(animationFrame);
		};
	});*/

	/**
	 * Handles eating a word - triggers eating animation and removes word.
	 *
	 * @param word - The word to eat
	 */
	function eatWord(word: FallingWord) {
		isEating = true;
		targetWord = null;

		// Call parent callback to start eating animation
		if (onEatWord) {
			onEatWord(word.id);
		}

		// Clear eating animation after eating completes
		setTimeout(() => {
			isEating = false;
		}, 1200); // Time for eating animation to complete
	}

	/**
	 * Get the evolution form name for ASCII art lookup
	 */
	function getEvolutionFormName(form: EvolutionForm): keyof typeof asciiArt {
		switch (form) {
			case 1:
				return 'egg';
			case 2:
				return 'baby';
			case 3:
				return 'child';
			case 4:
				return 'teen';
			case 5:
				return 'adult';
			default:
				return 'egg';
		}
	}

	/**
	 * Derived character state based on evolution form, emotional state, and performance.
	 * Returns an object containing ASCII art, heart count, and mood identifier.
	 *
	 * Priority order:
	 * 1. Evolution animation (special sparkle effect)
	 * 2. Celebration animations
	 * 3. Fire levels (3: super fire, 2: on fire, 1: heating up)
	 * 4. Emotional state override
	 * 5. Error state (worried mood)
	 * 6. Typing performance (excited > happy > focused)
	 * 7. Neutral state (with blinking animation)
	 *
	 * @returns Character state object with ascii, hearts, and mood properties
	 */
	let character = $derived(() => {
		const formName = getEvolutionFormName(evolutionForm);
		const formArt = asciiArt[formName] as Record<string, string>;

		// Evolution animation has highest priority
		if (isEvolutionAnimating) {
			return {
				ascii: evolutionProgress < 50 ? formArt.excited : formArt.happy,
				hearts: heartCount,
				mood: 'evolving',
				evolutionProgress
			};
		}

		// Current celebration animation
		if (currentCelebration) {
			const celebrationMood = currentCelebration.type === 'evolution' ? 'excited' : 'happy';
			return {
				ascii: formArt[celebrationMood] || formArt.excited,
				hearts: heartCount,
				mood: 'celebrating',
				celebration: currentCelebration
			};
		}

		// Eating animation has high priority
		if (isEating) {
			return { ascii: formArt.eating || formArt.excited, hearts: heartCount, mood: 'eating' };
		}

		// Emotional state override (from PetStateService)
		if (emotionalState !== 'content') {
			switch (emotionalState) {
				case 'happy':
					return { ascii: formArt.happy, hearts: heartCount, mood: 'happy' };
				case 'excited':
					return { ascii: formArt.excited, hearts: heartCount, mood: 'excited' };
				case 'sad':
					return { ascii: formArt.worried, hearts: heartCount, mood: 'worried' };
				case 'hungry':
					return { ascii: formArt.focused, hearts: heartCount, mood: 'focused' };
				case 'eating':
					return { ascii: formArt.eating || formArt.excited, hearts: heartCount, mood: 'eating' };
			}
		}

		// Fire streak states have priority over other states
		if (fireLevel === 3) {
			return {
				ascii: asciiArt.superFire,
				hearts: heartCount,
				mood: 'superFire'
			};
		} else if (fireLevel === 2) {
			return { ascii: asciiArt.onFire, hearts: heartCount, mood: 'onFire' };
		} else if (fireLevel === 1) {
			return {
				ascii: asciiArt.heatingUp,
				hearts: heartCount,
				mood: 'heatingUp'
			};
		} else if (hasError) {
			return { ascii: formArt.worried, hearts: heartCount, mood: 'worried' };
		} else if (isTyping && wpm > 60) {
			return { ascii: formArt.excited, hearts: heartCount, mood: 'excited' };
		} else if (isTyping && wpm > 30) {
			return { ascii: formArt.happy, hearts: heartCount, mood: 'happy' };
		} else if (isTyping) {
			return { ascii: formArt.focused, hearts: heartCount, mood: 'focused' };
		} else {
			// Show blinking animation when neutral and idle
			const currentAscii = isBlinking ? formArt.neutralBlink : formArt.neutral;
			return { ascii: currentAscii, hearts: heartCount, mood: 'neutral' };
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
			case 'evolving':
				return 'evolution-sparkle animate-bounce scale-110';
			case 'celebrating':
				return 'celebration-glow animate-bounce';
			case 'eating':
				return 'animate-bounce scale-110';
			case 'moving':
				return 'animate-pulse';
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
	class="relative h-full min-h-[112px] w-full overflow-hidden"
	role="region"
	aria-label="Typingotchi pet playground"
	data-component-id={componentId}
	data-testid="typingotchi"
>
	<!-- Falling words -->
	{#if fallingWords}
		{#each fallingWords as word (word.id)}
			<div
				class="absolute animate-bounce text-xs font-semibold text-green-800 transition-all duration-1000 ease-out {word.isBeingEaten
					? 'opacity-0'
					: 'opacity-100'}"
				style="left: {word.x}%; top: {word.y}%; transform: translateX(-50%); animation-duration: 2s;"
				data-testid="falling-word"
			>
				{word.word}
			</div>
		{/each}
	{/if}

	<!-- Evolution progress overlay -->
	{#if isEvolutionAnimating}
		<div
			class="absolute inset-0 z-50 flex items-center justify-center"
			data-testid="evolution-overlay"
		>
			<div class="evolution-sparkle-bg rounded-xl p-4 text-center">
				<div class="mb-2 text-lg font-bold text-white">EVOLUTION!</div>
				<div class="h-2 w-24 overflow-hidden rounded-full bg-white/30">
					<div
						class="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 transition-all duration-100"
						style="width: {evolutionProgress}%"
					></div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Celebration overlay -->
	{#if currentCelebration}
		<div
			class="absolute inset-0 z-40 flex items-center justify-center"
			data-testid="celebration-overlay"
		>
			<div class="celebration-popup rounded-lg bg-white/90 p-3 text-center shadow-lg">
				<div class="text-sm font-bold text-gray-800">{currentCelebration.title}</div>
				{#if currentCelebration.message}
					<div class="text-xs text-gray-600">{currentCelebration.message}</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Pet avatar with walking animation positioning -->
	<div
		class="absolute transition-all duration-100 ease-out"
		style="left: {characterX}%; bottom: {2 + characterY}px; transform: translateX(-50%);"
	>
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
				class="relative flex h-16 w-16 items-center justify-center rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-100 to-blue-100 {animationClass()}"
				style="z-index: 1;"
				data-testid="typingotchi-avatar"
			>
				<pre
					id="typingotchi-ascii"
					class="bg-transparent font-mono text-xs leading-tight font-bold text-[#0f380f] select-none"
					style="background: transparent !important; box-shadow: none !important;"
					role="img"
					aria-label="typing pet emotion: {character().mood}"
					data-testid="typingotchi-ascii">{character().ascii}</pre>
			</div>
		</div>

		<!-- Heart health system below character -->
		<div class="mt-1 flex justify-center gap-0.5" data-testid="typingotchi-hearts">
			{#each Array(5) as _, index (index)}
				<span
					class="text-sm {index < character().hearts ? 'text-gray-800' : 'text-gray-400'} 
					       {character().mood === 'superFire' || character().mood === 'onFire' ? 'animate-pulse' : ''}"
					aria-label={index < character().hearts ? 'full heart' : 'empty heart'}
				>
					{index < character().hearts ? '♥' : '♡'}
				</span>
			{/each}
		</div>
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

	/* Character movement and eating animations */
	.scale-110 {
		transform: scale(1.1);
	}

	/* Evolution animation styles */
	.evolution-sparkle {
		filter: brightness(1.5) saturate(1.8);
		text-shadow:
			0 0 8px rgba(255, 215, 0, 0.8),
			0 0 16px rgba(255, 215, 0, 0.6);
		animation: evolutionSparkle 0.5s ease-in-out infinite alternate;
	}

	.evolution-sparkle-bg {
		background: radial-gradient(
			circle,
			rgba(255, 215, 0, 0.9) 0%,
			rgba(255, 165, 0, 0.7) 50%,
			rgba(255, 215, 0, 0.5) 100%
		);
		animation: evolutionBg 1s ease-in-out infinite alternate;
	}

	@keyframes evolutionSparkle {
		0% {
			filter: brightness(1.3) saturate(1.6);
			transform: scale(1.05);
		}
		100% {
			filter: brightness(1.8) saturate(2);
			transform: scale(1.15);
		}
	}

	@keyframes evolutionBg {
		0% {
			opacity: 0.8;
			transform: scale(1);
		}
		100% {
			opacity: 1;
			transform: scale(1.05);
		}
	}

	/* Celebration animation styles */
	.celebration-glow {
		filter: brightness(1.3) saturate(1.4);
		text-shadow: 0 0 6px rgba(34, 197, 94, 0.6);
		animation: celebrationGlow 0.8s ease-in-out infinite alternate;
	}

	.celebration-popup {
		animation: celebrationPopup 0.6s ease-out;
	}

	@keyframes celebrationGlow {
		0% {
			filter: brightness(1.2) saturate(1.2);
			transform: scale(1.02);
		}
		100% {
			filter: brightness(1.5) saturate(1.6);
			transform: scale(1.08);
		}
	}

	@keyframes celebrationPopup {
		0% {
			opacity: 0;
			transform: scale(0.8) translateY(10px);
		}
		50% {
			transform: scale(1.1) translateY(-5px);
		}
		100% {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	/* Evolution form specific enhancements */
	.form-egg {
		filter: brightness(0.9);
	}

	.form-baby {
		filter: brightness(1);
	}

	.form-child {
		filter: brightness(1.1) saturate(1.1);
	}

	.form-teen {
		filter: brightness(1.2) saturate(1.2);
	}

	.form-adult {
		filter: brightness(1.3) saturate(1.3) contrast(1.1);
		text-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
	}
</style>
