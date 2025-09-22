<script lang="ts">
	/**
	 * AchievementDisplay Component
	 *
	 * Displays achievement notifications and celebration overlays when users
	 * unlock new achievements. Features animated badges, confetti effects,
	 * and smooth transitions to create engaging achievement moments.
	 */

	import type { Achievement, CelebrationEvent } from '$lib/types/index.js';

	// Component props
	let {
		achievement = null,
		celebrationEvent = null,
		visible = false,
		autoHide = true,
		duration = 4000,
		onClose = () => {},
		onComplete = () => {}
	}: {
		achievement?: Achievement | null;
		celebrationEvent?: CelebrationEvent | null;
		visible?: boolean;
		autoHide?: boolean;
		duration?: number;
		onClose?: () => void;
		onComplete?: () => void;
	} = $props();

	// Animation state
	let animationPhase = $state<'entrance' | 'display' | 'exit'>('entrance');
	let confettiVisible = $state(false);
	let badgeScale = $state(1);

	// Confetti particles
	let confettiParticles = $state<
		Array<{
			id: string;
			x: number;
			y: number;
			color: string;
			rotation: number;
			delay: number;
			size: number;
		}>
	>([]);

	// Auto-hide timer
	let autoHideTimer: NodeJS.Timeout | null = null;

	// Derived achievement data
	let displayData = $derived(() => {
		if (achievement) {
			return {
				title: achievement.title,
				description: achievement.description,
				icon: achievement.icon || '🏆',
				points: achievement.points,
				rarity: achievement.rarity,
				type: 'achievement' as const
			};
		} else if (celebrationEvent) {
			return {
				title: celebrationEvent.title,
				description: celebrationEvent.message || '',
				icon: getEventIcon(celebrationEvent.type),
				points: 0,
				rarity: 'common' as const,
				type: celebrationEvent.type
			};
		}
		return null;
	});

	// Rarity-based styling
	let rarityStyles = $derived(() => {
		if (!displayData) return '';

		const styles = {
			common: 'from-blue-400 to-blue-600',
			rare: 'from-purple-400 to-purple-600',
			epic: 'from-orange-400 to-red-600',
			legendary: 'from-yellow-400 to-yellow-600'
		};

		return styles[displayData.rarity] || styles.common;
	});

	/**
	 * Start animation sequence when component becomes visible
	 */
	$effect(() => {
		if (visible && displayData) {
			startDisplaySequence();
		} else {
			resetAnimation();
		}
	});

	/**
	 * Start the display animation sequence
	 */
	async function startDisplaySequence() {
		// Clear any existing timer
		if (autoHideTimer) {
			clearTimeout(autoHideTimer);
		}

		// Phase 1: Entrance
		animationPhase = 'entrance';

		await wait(300);

		// Phase 2: Display with confetti
		animationPhase = 'display';

		// Create confetti for special achievements
		if (displayData && (displayData.rarity === 'epic' || displayData.rarity === 'legendary')) {
			createConfetti();
			confettiVisible = true;
		}

		// Badge celebration animation
		celebrateBadge();

		// Auto-hide if enabled
		if (autoHide) {
			autoHideTimer = setTimeout(() => {
				handleClose();
			}, duration);
		}
	}

	/**
	 * Create confetti effect
	 */
	function createConfetti() {
		const colors = [
			'#FFD700',
			'#FF6B6B',
			'#4ECDC4',
			'#45B7D1',
			'#96CEB4',
			'#FFEAA7',
			'#DDA0DD',
			'#98D8C8'
		];

		const particles = [];
		for (let i = 0; i < 30; i++) {
			particles.push({
				id: `confetti-${i}-${Date.now()}`,
				x: Math.random() * 100,
				y: -10,
				color: colors[Math.floor(Math.random() * colors.length)],
				rotation: Math.random() * 360,
				delay: Math.random() * 2000,
				size: 0.5 + Math.random() * 0.5
			});
		}

		confettiParticles = particles;

		// Remove confetti after animation
		setTimeout(() => {
			confettiVisible = false;
			confettiParticles = [];
		}, 4000);
	}

	/**
	 * Animate the achievement badge
	 */
	async function celebrateBadge() {
		// Bounce animation sequence
		badgeScale = 1.2;
		await wait(200);
		badgeScale = 0.9;
		await wait(200);
		badgeScale = 1.1;
		await wait(200);
		badgeScale = 1;
	}

	/**
	 * Handle close action
	 */
	async function handleClose() {
		if (autoHideTimer) {
			clearTimeout(autoHideTimer);
		}

		// Phase 3: Exit
		animationPhase = 'exit';
		confettiVisible = false;

		await wait(300);

		onClose();
		onComplete();
	}

	/**
	 * Reset animation state
	 */
	function resetAnimation() {
		animationPhase = 'entrance';
		confettiVisible = false;
		badgeScale = 1;
		confettiParticles = [];

		if (autoHideTimer) {
			clearTimeout(autoHideTimer);
			autoHideTimer = null;
		}
	}

	/**
	 * Get icon for celebration event type
	 */
	function getEventIcon(type: string): string {
		const icons = {
			achievement: '🏆',
			milestone: '🎯',
			'personal-best': '📈',
			streak: '🔥',
			evolution: '✨',
			accessory: '👑',
			level: '⭐'
		};
		return icons[type as keyof typeof icons] || '🎉';
	}

	/**
	 * Get rarity display text
	 */
	function getRarityText(rarity: string): string {
		return rarity.charAt(0).toUpperCase() + rarity.slice(1);
	}

	/**
	 * Utility function for async delays
	 */
	function wait(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
</script>

<svelte:head>
	<style>
		@keyframes achievement-entrance {
			0% {
				transform: translateY(-100%) scale(0.8);
				opacity: 0;
			}
			100% {
				transform: translateY(0) scale(1);
				opacity: 1;
			}
		}

		@keyframes achievement-exit {
			0% {
				transform: translateY(0) scale(1);
				opacity: 1;
			}
			100% {
				transform: translateY(-100%) scale(0.8);
				opacity: 0;
			}
		}

		@keyframes confetti-fall {
			0% {
				transform: translateY(-10px) rotate(0deg);
				opacity: 1;
			}
			100% {
				transform: translateY(100vh) rotate(720deg);
				opacity: 0;
			}
		}

		@keyframes badge-glow {
			0%,
			100% {
				box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
			}
			50% {
				box-shadow:
					0 0 30px rgba(255, 215, 0, 0.8),
					0 0 40px rgba(255, 215, 0, 0.3);
			}
		}

		@keyframes text-shimmer {
			0% {
				background-position: -200% center;
			}
			100% {
				background-position: 200% center;
			}
		}

		.achievement-entrance {
			animation: achievement-entrance 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
		}

		.achievement-exit {
			animation: achievement-exit 0.3s ease-in forwards;
		}

		.confetti-fall {
			animation: confetti-fall linear forwards;
		}

		.badge-glow {
			animation: badge-glow 2s ease-in-out infinite;
		}

		.text-shimmer {
			background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
			background-size: 200% 100%;
			animation: text-shimmer 2s infinite;
			-webkit-background-clip: text;
			background-clip: text;
		}
	</style>
</svelte:head>

{#if visible && displayData}
	<!-- Achievement Display Overlay -->
	<div
		class="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center p-4"
		role="alert"
		aria-live="polite"
		aria-atomic="true"
	>
		<!-- Achievement Card -->
		<div
			class="relative max-w-md rounded-2xl bg-gradient-to-br {rarityStyles} pointer-events-auto p-1 shadow-2xl"
			class:achievement-entrance={animationPhase === 'entrance'}
			class:achievement-exit={animationPhase === 'exit'}
			class:badge-glow={displayData.rarity === 'legendary'}
		>
			<div class="rounded-xl bg-white p-6 text-center">
				<!-- Achievement Icon/Badge -->
				<div class="mb-4 flex justify-center">
					<div
						class="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br {rarityStyles} text-3xl text-white shadow-lg transition-transform duration-200"
						style="transform: scale({badgeScale})"
					>
						{displayData.icon}

						<!-- Rarity indicator for special achievements -->
						{#if displayData.rarity === 'epic' || displayData.rarity === 'legendary'}
							<div
								class="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 text-xs"
							>
								{#if displayData.rarity === 'legendary'}
									👑
								{:else}
									⭐
								{/if}
							</div>
						{/if}
					</div>
				</div>

				<!-- Achievement Title -->
				<h3
					class="mb-2 text-xl font-bold text-gray-900"
					class:text-shimmer={displayData.rarity === 'legendary'}
				>
					{displayData.title}
				</h3>

				<!-- Achievement Description -->
				<p class="mb-4 text-sm text-gray-600">
					{displayData.description}
				</p>

				<!-- Achievement Details -->
				<div class="flex items-center justify-center space-x-4 text-xs">
					<!-- Rarity Badge -->
					<span
						class="inline-flex items-center rounded-full bg-gradient-to-r px-3 py-1 font-medium {rarityStyles} text-white"
					>
						{getRarityText(displayData.rarity)}
					</span>

					<!-- Points (if applicable) -->
					{#if displayData.points > 0}
						<span
							class="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 font-medium text-yellow-800"
						>
							+{displayData.points} pts
						</span>
					{/if}

					<!-- Type indicator -->
					<span
						class="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-800"
					>
						{displayData.type}
					</span>
				</div>

				<!-- Manual close button (if not auto-hiding) -->
				{#if !autoHide}
					<button
						class="mt-4 rounded-lg bg-gradient-to-r {rarityStyles} px-4 py-2 text-sm font-medium text-white transition-all hover:shadow-lg"
						onclick={handleClose}
					>
						Awesome!
					</button>
				{/if}
			</div>

			<!-- Close button (always visible for manual close) -->
			<button
				class="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 shadow-lg transition-colors hover:bg-gray-200"
				onclick={handleClose}
				aria-label="Close achievement notification"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					></path>
				</svg>
			</button>
		</div>
	</div>

	<!-- Confetti Particles -->
	{#if confettiVisible}
		{#each confettiParticles as particle (particle.id)}
			<div
				class="confetti-fall pointer-events-none fixed h-3 w-3"
				style="
					left: {particle.x}%;
					top: {particle.y}px;
					background-color: {particle.color};
					transform: rotate({particle.rotation}deg) scale({particle.size});
					animation-delay: {particle.delay}ms;
					animation-duration: {3000 + Math.random() * 2000}ms;
				"
			></div>
		{/each}
	{/if}
{/if}
