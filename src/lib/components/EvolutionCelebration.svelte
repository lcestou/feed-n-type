<script lang="ts">
	/**
	 * EvolutionCelebration Component
	 *
	 * Displays animated celebration when the Typingotchi evolves to the next form.
	 * Features smooth animations, particle effects, and sound feedback to create
	 * an engaging evolution experience for young users.
	 */

	import { EvolutionForm } from '$lib/types/index.js';
	import type { CelebrationEvent } from '$lib/types/index.js';

	// Component props
	let {
		visible = false,
		fromForm = EvolutionForm.EGG,
		toForm = EvolutionForm.BABY,
		celebrationData = null,
		onComplete = () => {}
	}: {
		visible?: boolean;
		fromForm?: EvolutionForm;
		toForm?: EvolutionForm;
		celebrationData?: CelebrationEvent | null;
		onComplete?: () => void;
	} = $props();

	// Animation state
	let animationPhase = $state<'entrance' | 'transformation' | 'celebration' | 'exit'>('entrance');
	let particlesVisible = $state(false);
	let transformationProgress = $state(0);
	let celebrationText = $state('');

	// Particle animation state
	let particles = $state<
		Array<{
			id: string;
			x: number;
			y: number;
			rotation: number;
			scale: number;
			emoji: string;
			animation: string;
		}>
	>([]);

	// Evolution form display data
	const evolutionData = {
		[EvolutionForm.EGG]: {
			emoji: '🥚',
			name: 'Egg',
			description: 'Ready to hatch!',
			color: 'from-yellow-400 to-orange-500'
		},
		[EvolutionForm.BABY]: {
			emoji: '🐣',
			name: 'Baby Typingotchi',
			description: 'Just hatched and ready to learn!',
			color: 'from-green-400 to-blue-500'
		},
		[EvolutionForm.CHILD]: {
			emoji: '🐥',
			name: 'Child Typingotchi',
			description: 'Growing bigger and stronger!',
			color: 'from-blue-400 to-purple-500'
		},
		[EvolutionForm.TEEN]: {
			emoji: '🐤',
			name: 'Teen Typingotchi',
			description: 'Almost fully grown!',
			color: 'from-purple-400 to-pink-500'
		},
		[EvolutionForm.ADULT]: {
			emoji: '🐔',
			name: 'Adult Typingotchi',
			description: 'Fully evolved typing master!',
			color: 'from-pink-400 to-red-500'
		}
	};

	// Derived data for current forms
	let fromData = $derived(() => evolutionData[fromForm] || evolutionData[EvolutionForm.EGG]);
	let toData = $derived(() => evolutionData[toForm] || evolutionData[EvolutionForm.BABY]);

	/**
	 * Start evolution animation sequence when component becomes visible
	 */
	$effect(() => {
		if (visible) {
			startEvolutionSequence();
		} else {
			resetAnimation();
		}
	});

	/**
	 * Start the complete evolution animation sequence
	 */
	async function startEvolutionSequence() {
		// Phase 1: Entrance animation
		animationPhase = 'entrance';
		celebrationText = 'Something amazing is happening...';

		await wait(1000);

		// Phase 2: Transformation
		animationPhase = 'transformation';
		celebrationText = 'Evolution in progress!';

		// Animate transformation progress
		for (let i = 0; i <= 100; i += 2) {
			transformationProgress = i;
			await wait(50);
		}

		await wait(500);

		// Phase 3: Celebration
		animationPhase = 'celebration';
		celebrationText = `Congratulations! Your pet evolved into a ${toData.name}!`;

		// Create celebration particles
		createCelebrationParticles();
		particlesVisible = true;

		// Play celebration for 3 seconds
		await wait(3000);

		// Phase 4: Exit
		animationPhase = 'exit';
		particlesVisible = false;

		await wait(1000);

		// Complete the evolution
		onComplete();
	}

	/**
	 * Create animated celebration particles
	 */
	function createCelebrationParticles() {
		const celebrationEmojis = ['🎉', '✨', '🌟', '⭐', '💫', '🎊', '🎈'];
		const newParticles = [];

		for (let i = 0; i < 20; i++) {
			newParticles.push({
				id: `particle-${i}-${Date.now()}`,
				x: Math.random() * 100,
				y: Math.random() * 100,
				rotation: Math.random() * 360,
				scale: 0.5 + Math.random() * 0.5,
				emoji: celebrationEmojis[Math.floor(Math.random() * celebrationEmojis.length)],
				animation: `particle-float-${i % 3}`
			});
		}

		particles = newParticles;

		// Remove particles after animation
		setTimeout(() => {
			particles = [];
		}, 3000);
	}

	/**
	 * Reset animation state
	 */
	function resetAnimation() {
		animationPhase = 'entrance';
		particlesVisible = false;
		transformationProgress = 0;
		celebrationText = '';
		particles = [];
	}

	/**
	 * Utility function for async delays
	 */
	function wait(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Handle click to skip animation
	 */
	function handleSkip() {
		// Jump to celebration phase
		if (animationPhase === 'entrance' || animationPhase === 'transformation') {
			animationPhase = 'celebration';
			transformationProgress = 100;
			celebrationText = `Congratulations! Your pet evolved into a ${toData.name}!`;
			createCelebrationParticles();
			particlesVisible = true;

			// Auto-complete after shorter time
			setTimeout(() => {
				animationPhase = 'exit';
				particlesVisible = false;
				setTimeout(onComplete, 500);
			}, 1500);
		} else {
			// Skip to completion
			onComplete();
		}
	}
</script>

<svelte:head>
	<style>
		@keyframes particle-float-0 {
			0% {
				transform: translateY(0px) rotate(0deg) scale(0);
				opacity: 0;
			}
			10% {
				opacity: 1;
			}
			50% {
				transform: translateY(-30px) rotate(180deg) scale(1);
			}
			90% {
				opacity: 1;
			}
			100% {
				transform: translateY(-60px) rotate(360deg) scale(0);
				opacity: 0;
			}
		}

		@keyframes particle-float-1 {
			0% {
				transform: translateY(0px) rotate(0deg) scale(0);
				opacity: 0;
			}
			20% {
				opacity: 1;
			}
			50% {
				transform: translateY(-40px) rotate(-180deg) scale(1.2);
			}
			80% {
				opacity: 1;
			}
			100% {
				transform: translateY(-80px) rotate(-360deg) scale(0);
				opacity: 0;
			}
		}

		@keyframes particle-float-2 {
			0% {
				transform: translateY(0px) rotate(0deg) scale(0);
				opacity: 0;
			}
			15% {
				opacity: 1;
			}
			50% {
				transform: translateY(-25px) rotate(270deg) scale(0.8);
			}
			85% {
				opacity: 1;
			}
			100% {
				transform: translateY(-50px) rotate(540deg) scale(0);
				opacity: 0;
			}
		}

		@keyframes evolution-glow {
			0%,
			100% {
				box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
			}
			50% {
				box-shadow:
					0 0 40px rgba(255, 215, 0, 0.8),
					0 0 60px rgba(255, 215, 0, 0.4);
			}
		}

		@keyframes evolution-pulse {
			0%,
			100% {
				transform: scale(1);
			}
			50% {
				transform: scale(1.1);
			}
		}

		@keyframes evolution-spin {
			from {
				transform: rotate(0deg);
			}
			to {
				transform: rotate(360deg);
			}
		}

		@keyframes text-glow {
			0%,
			100% {
				text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
			}
			50% {
				text-shadow:
					0 0 20px rgba(255, 255, 255, 1),
					0 0 30px rgba(255, 215, 0, 0.8);
			}
		}

		.particle-float-0 {
			animation: particle-float-0 3s ease-out forwards;
		}
		.particle-float-1 {
			animation: particle-float-1 3s ease-out forwards;
		}
		.particle-float-2 {
			animation: particle-float-2 3s ease-out forwards;
		}
		.evolution-glow {
			animation: evolution-glow 2s ease-in-out infinite;
		}
		.evolution-pulse {
			animation: evolution-pulse 1s ease-in-out infinite;
		}
		.evolution-spin {
			animation: evolution-spin 2s linear infinite;
		}
		.text-glow {
			animation: text-glow 2s ease-in-out infinite;
		}
	</style>
</svelte:head>

{#if visible}
	<!-- Evolution Celebration Overlay -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		aria-labelledby="evolution-title"
		onclick={handleSkip}
	>
		<!-- Main celebration container -->
		<div
			class="relative mx-4 max-w-lg rounded-2xl bg-gradient-to-br {toData.color} p-1 shadow-2xl"
			class:evolution-glow={animationPhase === 'transformation'}
			onclick={(e) => e.stopPropagation()}
		>
			<div class="rounded-xl bg-white p-8 text-center">
				<!-- Evolution Progress Bar (during transformation) -->
				{#if animationPhase === 'transformation'}
					<div class="mb-6">
						<div class="mb-2 text-sm font-medium text-gray-700">Evolution Progress</div>
						<div class="h-2 w-full rounded-full bg-gray-200">
							<div
								class="h-2 rounded-full bg-gradient-to-r {toData.color} transition-all duration-500 ease-out"
								style="width: {transformationProgress}%"
							></div>
						</div>
						<div class="mt-1 text-xs text-gray-600">{transformationProgress}%</div>
					</div>
				{/if}

				<!-- Evolution Display -->
				<div class="mb-6 flex items-center justify-center space-x-4">
					<!-- From Form -->
					<div class="text-center">
						<div
							class="text-6xl transition-all duration-1000"
							class:opacity-50={animationPhase === 'transformation' && transformationProgress > 50}
							class:evolution-pulse={animationPhase === 'entrance'}
						>
							{fromData.emoji}
						</div>
						<p class="mt-2 text-sm font-medium text-gray-700">{fromData.name}</p>
					</div>

					<!-- Evolution Arrow -->
					<div class="flex flex-col items-center">
						<div
							class="text-4xl transition-all duration-500"
							class:evolution-spin={animationPhase === 'transformation'}
							class:text-yellow-500={animationPhase === 'transformation'}
						>
							{#if animationPhase === 'entrance' || animationPhase === 'transformation'}
								✨
							{:else}
								➡️
							{/if}
						</div>
						{#if animationPhase === 'transformation'}
							<div class="mt-1 text-xs font-medium text-yellow-600">Evolving...</div>
						{/if}
					</div>

					<!-- To Form -->
					<div class="text-center">
						<div
							class="text-6xl transition-all duration-1000"
							class:opacity-20={animationPhase === 'entrance'}
							class:opacity-50={animationPhase === 'transformation' && transformationProgress < 100}
							class:evolution-pulse={animationPhase === 'celebration'}
						>
							{toData.emoji}
						</div>
						<p class="mt-2 text-sm font-medium text-gray-700">{toData.name}</p>
					</div>
				</div>

				<!-- Celebration Text -->
				<div class="mb-6">
					<h2
						id="evolution-title"
						class="text-2xl font-bold text-gray-900 transition-all duration-500"
						class:text-glow={animationPhase === 'celebration'}
					>
						{#if animationPhase === 'celebration'}
							🎉 Evolution Complete! 🎉
						{:else}
							Evolution in Progress
						{/if}
					</h2>
					<p class="mt-2 text-lg text-gray-700">
						{celebrationText}
					</p>
					{#if animationPhase === 'celebration'}
						<p class="mt-2 text-sm text-gray-600">
							{toData.description}
						</p>
					{/if}
				</div>

				<!-- Action Buttons -->
				<div class="flex justify-center space-x-4">
					{#if animationPhase === 'celebration'}
						<button
							class="rounded-lg bg-gradient-to-r {toData.color} px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
							onclick={onComplete}
						>
							Amazing! 🌟
						</button>
					{:else}
						<button
							class="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300"
							onclick={handleSkip}
						>
							Skip Animation
						</button>
					{/if}
				</div>

				<!-- Achievement Info (if provided) -->
				{#if celebrationData && animationPhase === 'celebration'}
					<div class="mt-6 rounded-lg bg-yellow-50 p-4">
						<div class="flex items-center justify-center">
							<svg class="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
									clip-rule="evenodd"
								></path>
							</svg>
							<span class="ml-2 text-sm font-medium text-yellow-800">
								New accessory unlocked!
							</span>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Celebration Particles -->
		{#if particlesVisible}
			{#each particles as particle (particle.id)}
				<div
					class="pointer-events-none fixed text-2xl {particle.animation}"
					style="left: {particle.x}%; top: {particle.y}%; transform: rotate({particle.rotation}deg) scale({particle.scale})"
				>
					{particle.emoji}
				</div>
			{/each}
		{/if}

		<!-- Skip instruction -->
		{#if animationPhase !== 'celebration'}
			<div class="absolute bottom-4 left-1/2 -translate-x-1/2">
				<p class="text-sm text-white/80">Click anywhere to skip animation</p>
			</div>
		{/if}
	</div>
{/if}
