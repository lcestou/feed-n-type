<script lang="ts">
	/**
	 * ParentDashboard Component
	 *
	 * Provides a comprehensive overview of child's typing progress for parents.
	 * Displays progress metrics, trends, achievements, and areas needing focus
	 * in a child-friendly, easy-to-understand format.
	 */

	import { ProgressTrackingService } from '$lib/services/ProgressTrackingService.js';
	import { AchievementService } from '$lib/services/AchievementService.js';
	import type {
		ParentSummary,
		TypingTrends,
		KeyAnalysis,
		Achievement,
		ImprovementArea
	} from '$lib/types/index.js';

	// Services
	const progressService = new ProgressTrackingService();
	const achievementService = new AchievementService();

	// Component props
	let {
		visible = false,
		onClose = () => {}
	}: {
		visible?: boolean;
		onClose?: () => void;
	} = $props();

	// State management with Svelte 5 runes
	let parentSummary = $state<ParentSummary | null>(null);
	let typingTrends = $state<TypingTrends | null>(null);
	let challengingKeys = $state<KeyAnalysis[]>([]);
	let recentAchievements = $state<Achievement[]>([]);
	let improvementSuggestions = $state<ImprovementArea[]>([]);
	let isLoading = $state(true);
	let selectedTimeRange = $state<'week' | 'month'>('week');

	// Derived state for display
	// progressLevel removed as it was unused

	let progressMessage = $derived(() => {
		if (!parentSummary) return '';

		switch (parentSummary.overallProgress) {
			case 'excellent':
				return 'Your child is doing fantastic! They show excellent typing skills with high accuracy and good speed.';
			case 'good':
				return 'Great progress! Your child is developing solid typing skills and shows consistent improvement.';
			case 'needs_improvement':
				return 'Your child is learning! With continued practice, their typing skills will improve significantly.';
			default:
				return 'Keep practicing! Every typing session helps build better skills.';
		}
	});

	let practiceTimeDisplay = $derived(() => {
		if (!parentSummary) return '0 minutes';

		const totalMinutes = Math.round(parentSummary.totalPracticeTime / (1000 * 60));
		if (totalMinutes < 60) {
			return `${totalMinutes} minutes`;
		}

		const hours = Math.floor(totalMinutes / 60);
		const minutes = totalMinutes % 60;
		return `${hours}h ${minutes}m`;
	});

	/**
	 * Load dashboard data when component becomes visible
	 */
	$effect(() => {
		if (visible) {
			loadDashboardData();
		}
	});

	/**
	 * Load all dashboard data from services
	 */
	async function loadDashboardData() {
		isLoading = true;

		try {
			// Load data in parallel for better performance
			const [summaryData, trendsData, challengingKeysData, achievementsData, suggestionsData] =
				await Promise.all([
					progressService.getParentSummary(),
					progressService.getTypingTrends(selectedTimeRange === 'week' ? 7 : 30),
					progressService.identifyChallengingKeys(),
					achievementService.getUnlockedAchievements(),
					progressService.getImprovementSuggestions()
				]);

			// Update state
			parentSummary = summaryData;
			typingTrends = trendsData;
			challengingKeys = challengingKeysData.slice(0, 5); // Top 5 challenging keys
			recentAchievements = achievementsData.slice(-5).reverse(); // Last 5 achievements
			improvementSuggestions = suggestionsData;
		} catch (error) {
			console.error('Failed to load dashboard data:', error);
			// Set fallback state
			parentSummary = {
				childName: 'Student',
				totalPracticeTime: 0,
				currentStreak: 0,
				averageAccuracy: 0,
				currentWPM: 0,
				recentAchievements: [],
				areasNeedingFocus: [],
				overallProgress: 'needs_improvement'
			};
		} finally {
			isLoading = false;
		}
	}

	/**
	 * Handle time range selection change
	 */
	function handleTimeRangeChange(range: 'week' | 'month') {
		selectedTimeRange = range;
		loadDashboardData(); // Reload data with new time range
	}

	/**
	 * Format accuracy percentage for display
	 */
	function formatAccuracy(accuracy: number): string {
		return `${Math.round(accuracy * 10) / 10}%`;
	}

	/**
	 * Format WPM for display
	 */
	function formatWPM(wpm: number): string {
		return Math.round(wpm).toString();
	}

	/**
	 * Get progress level color
	 */
	function getProgressColor(level: string): string {
		switch (level) {
			case 'excellent':
				return 'text-green-600 bg-green-100';
			case 'good':
				return 'text-blue-600 bg-blue-100';
			case 'needs_improvement':
				return 'text-orange-600 bg-orange-100';
			default:
				return 'text-gray-600 bg-gray-100';
		}
	}

	/**
	 * Get improvement area priority color
	 */
	function getPriorityColor(priority: string): string {
		switch (priority) {
			case 'high':
				return 'text-red-600 bg-red-100';
			case 'medium':
				return 'text-yellow-600 bg-yellow-100';
			case 'low':
				return 'text-green-600 bg-green-100';
			default:
				return 'text-gray-600 bg-gray-100';
		}
	}
</script>

{#if visible}
	<!-- Modal overlay -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		aria-labelledby="dashboard-title"
		onclick={onClose}
	>
		<!-- Dashboard content -->
		<div
			class="relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-xl bg-white shadow-2xl"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4">
				<div class="flex items-center justify-between">
					<div>
						<h1 id="dashboard-title" class="text-2xl font-bold text-gray-900">Parent Dashboard</h1>
						<p class="text-sm text-gray-600">Track your child's typing progress and achievements</p>
					</div>

					<!-- Time range selector -->
					<div class="flex items-center space-x-4">
						<div class="flex rounded-lg bg-gray-100 p-1">
							<button
								class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
								class:bg-white={selectedTimeRange === 'week'}
								class:shadow-sm={selectedTimeRange === 'week'}
								class:text-gray-900={selectedTimeRange === 'week'}
								class:text-gray-600={selectedTimeRange !== 'week'}
								onclick={() => handleTimeRangeChange('week')}
							>
								Week
							</button>
							<button
								class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
								class:bg-white={selectedTimeRange === 'month'}
								class:shadow-sm={selectedTimeRange === 'month'}
								class:text-gray-900={selectedTimeRange === 'month'}
								class:text-gray-600={selectedTimeRange !== 'month'}
								onclick={() => handleTimeRangeChange('month')}
							>
								Month
							</button>
						</div>

						<!-- Close button -->
						<button
							class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
							onclick={onClose}
							aria-label="Close dashboard"
						>
							<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
			</div>

			{#if isLoading}
				<!-- Loading state -->
				<div class="flex h-64 items-center justify-center">
					<div class="text-center">
						<div
							class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"
						></div>
						<p class="mt-2 text-sm text-gray-600">Loading progress data...</p>
					</div>
				</div>
			{:else if parentSummary}
				<!-- Dashboard content -->
				<div class="p-6">
					<!-- Overview Cards -->
					<div class="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
						<!-- Practice Time -->
						<div class="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-6">
							<div class="flex items-center">
								<div class="flex-shrink-0">
									<div
										class="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white"
									>
										<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
											></path>
										</svg>
									</div>
								</div>
								<div class="ml-4">
									<p class="text-sm font-medium text-blue-600">Practice Time</p>
									<p class="text-2xl font-bold text-blue-900">{practiceTimeDisplay}</p>
								</div>
							</div>
						</div>

						<!-- Current Streak -->
						<div class="rounded-lg bg-gradient-to-br from-green-50 to-green-100 p-6">
							<div class="flex items-center">
								<div class="flex-shrink-0">
									<div
										class="flex h-8 w-8 items-center justify-center rounded-md bg-green-600 text-white"
									>
										<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M13 10V3L4 14h7v7l9-11h-7z"
											></path>
										</svg>
									</div>
								</div>
								<div class="ml-4">
									<p class="text-sm font-medium text-green-600">Current Streak</p>
									<p class="text-2xl font-bold text-green-900">
										{parentSummary.currentStreak} days
									</p>
								</div>
							</div>
						</div>

						<!-- Typing Speed -->
						<div class="rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 p-6">
							<div class="flex items-center">
								<div class="flex-shrink-0">
									<div
										class="flex h-8 w-8 items-center justify-center rounded-md bg-purple-600 text-white"
									>
										<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
											></path>
										</svg>
									</div>
								</div>
								<div class="ml-4">
									<p class="text-sm font-medium text-purple-600">Typing Speed</p>
									<p class="text-2xl font-bold text-purple-900">
										{formatWPM(parentSummary.currentWPM)} WPM
									</p>
								</div>
							</div>
						</div>

						<!-- Accuracy -->
						<div class="rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 p-6">
							<div class="flex items-center">
								<div class="flex-shrink-0">
									<div
										class="flex h-8 w-8 items-center justify-center rounded-md bg-orange-600 text-white"
									>
										<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
											></path>
										</svg>
									</div>
								</div>
								<div class="ml-4">
									<p class="text-sm font-medium text-orange-600">Accuracy</p>
									<p class="text-2xl font-bold text-orange-900">
										{formatAccuracy(parentSummary.averageAccuracy)}
									</p>
								</div>
							</div>
						</div>
					</div>

					<!-- Overall Progress Message -->
					<div
						class="mb-8 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white"
					>
						<div class="flex items-start">
							<div class="flex-shrink-0">
								<svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									></path>
								</svg>
							</div>
							<div class="ml-4">
								<h3 class="text-lg font-semibold">Overall Progress</h3>
								<p class="mt-1 text-indigo-100">{progressMessage}</p>
								<div class="mt-3">
									<span
										class="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium {getProgressColor(
											parentSummary.overallProgress
										)}"
									>
										{parentSummary.overallProgress.replace('_', ' ')}
									</span>
								</div>
							</div>
						</div>
					</div>

					<!-- Two Column Layout -->
					<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
						<!-- Left Column -->
						<div class="space-y-8">
							<!-- Recent Achievements -->
							<div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
								<h3 class="mb-4 text-lg font-semibold text-gray-900">Recent Achievements</h3>
								{#if recentAchievements.length > 0}
									<div class="space-y-3">
										{#each recentAchievements as achievement (achievement.id)}
											<div class="flex items-center rounded-lg bg-gray-50 p-3">
												<div class="text-2xl">{achievement.icon}</div>
												<div class="ml-3">
													<p class="font-medium text-gray-900">{achievement.title}</p>
													<p class="text-sm text-gray-600">{achievement.description}</p>
													<p class="text-xs text-gray-500">
														{achievement.dateEarned.toLocaleDateString()}
													</p>
												</div>
												<div class="ml-auto">
													<span
														class="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800"
													>
														{achievement.points} pts
													</span>
												</div>
											</div>
										{/each}
									</div>
								{:else}
									<p class="text-center text-gray-500">No achievements yet. Keep practicing!</p>
								{/if}
							</div>

							<!-- Improvement Suggestions -->
							<div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
								<h3 class="mb-4 text-lg font-semibold text-gray-900">Areas for Improvement</h3>
								{#if improvementSuggestions.length > 0}
									<div class="space-y-3">
										{#each improvementSuggestions as suggestion (suggestion.description)}
											<div class="rounded-lg border border-gray-200 p-4">
												<div class="flex items-start justify-between">
													<div class="flex-1">
														<h4 class="font-medium text-gray-900">{suggestion.description}</h4>
														<p class="mt-1 text-sm text-gray-600">{suggestion.recommendation}</p>
													</div>
													<span
														class="ml-2 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium {getPriorityColor(
															suggestion.priority
														)}"
													>
														{suggestion.priority}
													</span>
												</div>
											</div>
										{/each}
									</div>
								{:else}
									<p class="text-center text-gray-500">
										Great work! No specific areas needing focus right now.
									</p>
								{/if}
							</div>
						</div>

						<!-- Right Column -->
						<div class="space-y-8">
							<!-- Challenging Keys -->
							<div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
								<h3 class="mb-4 text-lg font-semibold text-gray-900">Keys Needing Practice</h3>
								{#if challengingKeys.length > 0}
									<div class="space-y-3">
										{#each challengingKeys as keyData (keyData.key)}
											<div class="flex items-center justify-between rounded-lg bg-gray-50 p-3">
												<div class="flex items-center">
													<div
														class="mr-3 flex h-8 w-8 items-center justify-center rounded-md bg-gray-200 font-mono font-bold"
													>
														{keyData.key.toUpperCase()}
													</div>
													<div>
														<p class="text-sm font-medium text-gray-900">
															{Math.round(keyData.errorRate * 100)}% error rate
														</p>
														<p class="text-xs text-gray-600">{keyData.practiceRecommendation}</p>
													</div>
												</div>
												<div class="text-right">
													<span class="text-xs text-gray-500">{keyData.attempts} attempts</span>
													<div class="mt-1">
														<span
															class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium {keyData.improvementTrend ===
															'improving'
																? 'bg-green-100 text-green-800'
																: keyData.improvementTrend === 'declining'
																	? 'bg-red-100 text-red-800'
																	: 'bg-gray-100 text-gray-800'}"
														>
															{keyData.improvementTrend}
														</span>
													</div>
												</div>
											</div>
										{/each}
									</div>
								{:else}
									<p class="text-center text-gray-500">
										No challenging keys identified. Excellent work!
									</p>
								{/if}
							</div>

							<!-- Typing Trends (simplified) -->
							{#if typingTrends && typingTrends.wpmTrend.length > 0}
								<div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
									<h3 class="mb-4 text-lg font-semibold text-gray-900">Progress Trends</h3>
									<div class="space-y-4">
										<div>
											<p class="text-sm font-medium text-gray-900">Speed Improvement</p>
											<p
												class="text-2xl font-bold {typingTrends.improvementRate >= 0
													? 'text-green-600'
													: 'text-red-600'}"
											>
												{typingTrends.improvementRate >= 0
													? '+'
													: ''}{typingTrends.improvementRate.toFixed(1)} WPM
											</p>
											<p class="text-xs text-gray-600">
												{selectedTimeRange === 'week' ? 'This week' : 'This month'}
											</p>
										</div>

										<div class="space-y-2">
											<p class="text-sm font-medium text-gray-900">Recent Sessions</p>
											{#each typingTrends.wpmTrend.slice(-5) as trend (trend.date.toISOString())}
												<div class="flex items-center justify-between text-sm">
													<span class="text-gray-600">
														{trend.date.toLocaleDateString()}
													</span>
													<span class="font-medium text-gray-900">
														{trend.value} WPM
													</span>
												</div>
											{/each}
										</div>
									</div>
								</div>
							{/if}
						</div>
					</div>

					<!-- Footer -->
					<div class="mt-8 rounded-lg bg-blue-50 p-6">
						<div class="flex items-start">
							<div class="flex-shrink-0">
								<svg
									class="h-6 w-6 text-blue-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									></path>
								</svg>
							</div>
							<div class="ml-3">
								<h4 class="text-sm font-medium text-blue-900">Tips for Parents</h4>
								<div class="mt-2 text-sm text-blue-700">
									<ul class="list-inside list-disc space-y-1">
										<li>Encourage 15-20 minutes of daily practice for best results</li>
										<li>Focus on accuracy first, then gradually build speed</li>
										<li>Celebrate achievements to maintain motivation</li>
										<li>Ensure proper posture and hand positioning</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</div>
			{:else}
				<!-- Error state -->
				<div class="flex h-64 items-center justify-center">
					<div class="text-center">
						<svg
							class="mx-auto h-12 w-12 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
							></path>
						</svg>
						<p class="mt-2 text-sm text-gray-600">Unable to load progress data</p>
						<button
							class="mt-2 rounded-md bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700"
							onclick={loadDashboardData}
						>
							Try Again
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
