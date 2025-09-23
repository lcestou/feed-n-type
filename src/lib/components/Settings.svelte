<script lang="ts">
	/**
	 * Settings Component
	 *
	 * Provides settings interface for pet customization, app preferences,
	 * and user configuration. Includes accessory management, theme selection,
	 * sound settings, and typing preferences.
	 */

	import { AchievementService } from '$lib/services/AchievementService.js';
	import type { Accessory } from '$lib/types/index.js';

	// Component props
	let {
		visible = false,
		onClose = () => {}
	}: {
		visible?: boolean;
		onClose?: () => void;
	} = $props();

	// Services
	const achievementService = new AchievementService();

	// Settings state
	let activeTab = $state<'pet' | 'preferences' | 'accessibility'>('pet');
	let availableAccessories = $state<Accessory[]>([]);
	let equippedAccessories = $state<{ [category: string]: string | null }>({});
	let isLoading = $state(true);

	// App preferences state
	let soundEnabled = $state(true);
	let soundVolume = $state(75);
	let animationsEnabled = $state(true);
	let autoSaveEnabled = $state(true);
	let keyboardSounds = $state(true);
	let celebrationSounds = $state(true);

	// Accessibility preferences
	let highContrast = $state(false);
	let reducedMotion = $state(false);
	let largerText = $state(false);
	let screenReaderMode = $state(false);
	let keyboardNavigation = $state(true);

	// Typing preferences
	let difficultyLevel = $state<'beginner' | 'intermediate' | 'advanced'>('beginner');
	let sessionLength = $state(15); // minutes
	let showWPMRealtime = $state(true);
	let showAccuracyRealtime = $state(true);
	let enableBackspace = $state(false);

	// Load settings when component becomes visible
	$effect(() => {
		if (visible) {
			loadSettings();
		}
	});

	/**
	 * Load all settings and accessories
	 */
	async function loadSettings() {
		isLoading = true;

		try {
			// Load available accessories
			const accessories = await achievementService.getAvailableAccessories();
			availableAccessories = accessories;

			// Group equipped accessories by category
			const equipped: { [category: string]: string | null } = {};
			for (const accessory of accessories) {
				if (accessory.equipped) {
					equipped[accessory.category] = accessory.id;
				}
			}
			equippedAccessories = equipped;

			// Load app preferences from localStorage
			loadAppPreferences();
		} catch (error) {
			console.error('Failed to load settings:', error);
		} finally {
			isLoading = false;
		}
	}

	/**
	 * Load app preferences from localStorage
	 */
	function loadAppPreferences() {
		try {
			const saved = localStorage.getItem('app_preferences');
			if (saved) {
				const preferences = JSON.parse(saved);

				// Apply loaded preferences
				soundEnabled = preferences.soundEnabled ?? true;
				soundVolume = preferences.soundVolume ?? 75;
				animationsEnabled = preferences.animationsEnabled ?? true;
				autoSaveEnabled = preferences.autoSaveEnabled ?? true;
				keyboardSounds = preferences.keyboardSounds ?? true;
				celebrationSounds = preferences.celebrationSounds ?? true;

				// Accessibility
				highContrast = preferences.highContrast ?? false;
				reducedMotion = preferences.reducedMotion ?? false;
				largerText = preferences.largerText ?? false;
				screenReaderMode = preferences.screenReaderMode ?? false;
				keyboardNavigation = preferences.keyboardNavigation ?? true;

				// Typing preferences
				difficultyLevel = preferences.difficultyLevel ?? 'beginner';
				sessionLength = preferences.sessionLength ?? 15;
				showWPMRealtime = preferences.showWPMRealtime ?? true;
				showAccuracyRealtime = preferences.showAccuracyRealtime ?? true;
				enableBackspace = preferences.enableBackspace ?? false;
			}
		} catch (error) {
			console.error('Failed to load app preferences:', error);
		}
	}

	/**
	 * Save app preferences to localStorage
	 */
	function saveAppPreferences() {
		try {
			const preferences = {
				soundEnabled,
				soundVolume,
				animationsEnabled,
				autoSaveEnabled,
				keyboardSounds,
				celebrationSounds,
				highContrast,
				reducedMotion,
				largerText,
				screenReaderMode,
				keyboardNavigation,
				difficultyLevel,
				sessionLength,
				showWPMRealtime,
				showAccuracyRealtime,
				enableBackspace
			};

			localStorage.setItem('app_preferences', JSON.stringify(preferences));
		} catch (error) {
			console.error('Failed to save app preferences:', error);
		}
	}

	/**
	 * Handle accessory selection
	 */
	async function handleAccessorySelect(accessory: Accessory) {
		try {
			// Unequip current accessory in this category if any
			const currentEquipped = equippedAccessories[accessory.category];
			if (currentEquipped && currentEquipped !== accessory.id) {
				// In a real implementation, we'd call achievementService.unequipAccessory()
			}

			// Equip the new accessory
			await achievementService.equipAccessory(accessory.id);

			// Update local state
			equippedAccessories = {
				...equippedAccessories,
				[accessory.category]: accessory.id
			};

			// Update the accessories list
			availableAccessories = availableAccessories.map((acc) => ({
				...acc,
				equipped: acc.category === accessory.category ? acc.id === accessory.id : acc.equipped
			}));
		} catch (error) {
			console.error('Failed to equip accessory:', error);
		}
	}

	/**
	 * Get accessories by category
	 */
	function getAccessoriesByCategory(category: string): Accessory[] {
		return availableAccessories.filter((acc) => acc.category === category);
	}

	/**
	 * Handle tab change
	 */
	function handleTabChange(tab: 'pet' | 'preferences' | 'accessibility') {
		activeTab = tab;
	}

	/**
	 * Handle preference change and auto-save
	 */
	function handlePreferenceChange() {
		saveAppPreferences();
	}

	/**
	 * Get accessory display name
	 */
	function getAccessoryDisplayName(accessory: Accessory): string {
		return accessory.name.replace(/([A-Z])/g, ' $1').trim();
	}

	/**
	 * Reset settings to defaults
	 */
	function resetToDefaults() {
		// Reset to default values
		soundEnabled = true;
		soundVolume = 75;
		animationsEnabled = true;
		autoSaveEnabled = true;
		keyboardSounds = true;
		celebrationSounds = true;
		highContrast = false;
		reducedMotion = false;
		largerText = false;
		screenReaderMode = false;
		keyboardNavigation = true;
		difficultyLevel = 'beginner';
		sessionLength = 15;
		showWPMRealtime = true;
		showAccuracyRealtime = true;
		enableBackspace = false;

		// Save the reset preferences
		saveAppPreferences();
	}

	/**
	 * Handle keyboard events for accessibility
	 */
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			onClose();
		}
	}
</script>

{#if visible}
	<!-- Settings Modal -->
	<div
		id="settings-modal-overlay"
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		aria-labelledby="settings-title"
		tabindex="0"
		onclick={onClose}
		onkeydown={handleKeydown}
		data-testid="settings-modal-overlay"
	>
		<div
			id="settings-modal"
			class="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl"
			data-testid="settings-modal"
		>
			<!-- Header -->
			<div
				id="settings-header"
				class="border-b border-gray-200 px-6 py-4"
				data-testid="settings-header"
			>
				<div
					id="settings-header-content"
					class="flex items-center justify-between"
					data-testid="settings-header-content"
				>
					<h1
						id="settings-title"
						class="text-2xl font-bold text-gray-900"
						data-testid="settings-title"
					>
						Settings
					</h1>
					<button
						id="settings-close-button"
						class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
						onclick={onClose}
						aria-label="Close settings"
						data-testid="settings-close-button"
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

				<!-- Tab Navigation -->
				<div
					id="settings-tabs"
					class="mt-4 flex space-x-1 rounded-lg bg-gray-100 p-1"
					data-testid="settings-tabs"
				>
					<button
						id="pet-tab"
						class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors"
						class:bg-white={activeTab === 'pet'}
						class:shadow-sm={activeTab === 'pet'}
						class:text-gray-900={activeTab === 'pet'}
						class:text-gray-600={activeTab !== 'pet'}
						onclick={() => handleTabChange('pet')}
						data-testid="pet-tab"
					>
						🐾 Pet Customization
					</button>
					<button
						id="preferences-tab"
						class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors"
						class:bg-white={activeTab === 'preferences'}
						class:shadow-sm={activeTab === 'preferences'}
						class:text-gray-900={activeTab === 'preferences'}
						class:text-gray-600={activeTab !== 'preferences'}
						onclick={() => handleTabChange('preferences')}
						data-testid="preferences-tab"
					>
						⚙️ Preferences
					</button>
					<button
						id="accessibility-tab"
						class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors"
						class:bg-white={activeTab === 'accessibility'}
						class:shadow-sm={activeTab === 'accessibility'}
						class:text-gray-900={activeTab === 'accessibility'}
						class:text-gray-600={activeTab !== 'accessibility'}
						onclick={() => handleTabChange('accessibility')}
						data-testid="accessibility-tab"
					>
						♿ Accessibility
					</button>
				</div>
			</div>

			<!-- Content -->
			<div
				id="settings-content"
				class="max-h-[60vh] overflow-y-auto p-6"
				data-testid="settings-content"
			>
				{#if isLoading}
					<!-- Loading State -->
					<div
						id="loading-state"
						class="flex h-64 items-center justify-center"
						data-testid="loading-state"
					>
						<div id="loading-content" class="text-center" data-testid="loading-content">
							<div
								id="loading-spinner"
								class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"
								data-testid="loading-spinner"
							></div>
							<p id="loading-text" class="mt-2 text-sm text-gray-600" data-testid="loading-text">
								Loading settings...
							</p>
						</div>
					</div>
				{:else if activeTab === 'pet'}
					<!-- Pet Customization Tab -->
					<div
						id="pet-customization-content"
						class="space-y-8"
						data-testid="pet-customization-content"
					>
						<div>
							<h3 class="mb-4 text-lg font-semibold text-gray-900">Customize Your Typingotchi</h3>
							<p class="mb-6 text-sm text-gray-600">
								Unlock new accessories by completing achievements and reaching milestones!
							</p>
						</div>

						<!-- Accessories by Category -->
						{#each ['hat', 'collar', 'toy', 'background'] as category (category)}
							{@const categoryAccessories = getAccessoriesByCategory(category)}
							{#if categoryAccessories.length > 0}
								<div class="space-y-4">
									<h4 class="font-medium text-gray-900 capitalize">{category}s</h4>
									<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
										{#each categoryAccessories as accessory (accessory.id)}
											<button
												class="relative rounded-lg border-2 p-4 text-center transition-all hover:shadow-md"
												class:border-purple-500={accessory.equipped}
												class:bg-purple-50={accessory.equipped}
												class:border-gray-200={!accessory.equipped}
												onclick={() => handleAccessorySelect(accessory)}
											>
												<!-- Accessory Preview -->
												<div class="mb-2 text-4xl">
													{#if category === 'hat'}
														👑
													{:else if category === 'collar'}
														🎀
													{:else if category === 'toy'}
														🧸
													{:else}
														🌈
													{/if}
												</div>

												<!-- Accessory Name -->
												<p class="text-sm font-medium text-gray-900">
													{getAccessoryDisplayName(accessory)}
												</p>

												<!-- Unlock Info -->
												<p class="mt-1 text-xs text-gray-500">
													{accessory.unlockCondition}
												</p>

												<!-- Equipped Indicator -->
												{#if accessory.equipped}
													<div
														class="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-white"
													>
														<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
															<path
																fill-rule="evenodd"
																d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
																clip-rule="evenodd"
															></path>
														</svg>
													</div>
												{/if}
											</button>
										{/each}
									</div>
								</div>
							{/if}
						{/each}

						{#if availableAccessories.length === 0}
							<div class="py-8 text-center">
								<p class="text-gray-500">No accessories unlocked yet!</p>
								<p class="mt-1 text-sm text-gray-400">
									Complete achievements to unlock new accessories for your pet.
								</p>
							</div>
						{/if}
					</div>
				{:else if activeTab === 'preferences'}
					<!-- App Preferences Tab -->
					<div id="preferences-content" class="space-y-8" data-testid="preferences-content">
						<!-- Sound Settings -->
						<div class="space-y-4">
							<h3 class="text-lg font-semibold text-gray-900">Sound & Audio</h3>

							<div class="space-y-4">
								<label class="flex items-center justify-between">
									<span class="text-sm font-medium text-gray-700">Enable sounds</span>
									<input
										type="checkbox"
										bind:checked={soundEnabled}
										onchange={handlePreferenceChange}
										class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
									/>
								</label>

								{#if soundEnabled}
									<div class="space-y-4">
										<label class="block">
											<span class="text-sm font-medium text-gray-700">Volume: {soundVolume}%</span>
											<input
												type="range"
												min="0"
												max="100"
												bind:value={soundVolume}
												onchange={handlePreferenceChange}
												class="mt-1 w-full"
											/>
										</label>

										<label class="flex items-center justify-between">
											<span class="text-sm font-medium text-gray-700">Keyboard sounds</span>
											<input
												type="checkbox"
												bind:checked={keyboardSounds}
												onchange={handlePreferenceChange}
												class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
											/>
										</label>

										<label class="flex items-center justify-between">
											<span class="text-sm font-medium text-gray-700">Achievement sounds</span>
											<input
												type="checkbox"
												bind:checked={celebrationSounds}
												onchange={handlePreferenceChange}
												class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
											/>
										</label>
									</div>
								{/if}
							</div>
						</div>

						<!-- Visual Settings -->
						<div class="space-y-4">
							<h3 class="text-lg font-semibold text-gray-900">Visual & Interface</h3>

							<label class="flex items-center justify-between">
								<span class="text-sm font-medium text-gray-700">Enable animations</span>
								<input
									type="checkbox"
									bind:checked={animationsEnabled}
									onchange={handlePreferenceChange}
									class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
								/>
							</label>

							<label class="flex items-center justify-between">
								<span class="text-sm font-medium text-gray-700">Show real-time WPM</span>
								<input
									type="checkbox"
									bind:checked={showWPMRealtime}
									onchange={handlePreferenceChange}
									class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
								/>
							</label>

							<label class="flex items-center justify-between">
								<span class="text-sm font-medium text-gray-700">Show real-time accuracy</span>
								<input
									type="checkbox"
									bind:checked={showAccuracyRealtime}
									onchange={handlePreferenceChange}
									class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
								/>
							</label>
						</div>

						<!-- Typing Settings -->
						<div class="space-y-4">
							<h3 class="text-lg font-semibold text-gray-900">Typing Experience</h3>

							<label class="block">
								<span class="text-sm font-medium text-gray-700">Difficulty Level</span>
								<select
									bind:value={difficultyLevel}
									onchange={handlePreferenceChange}
									class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
								>
									<option value="beginner">Beginner</option>
									<option value="intermediate">Intermediate</option>
									<option value="advanced">Advanced</option>
								</select>
							</label>

							<label class="block">
								<span class="text-sm font-medium text-gray-700"
									>Default session length: {sessionLength} minutes</span
								>
								<input
									type="range"
									min="5"
									max="60"
									step="5"
									bind:value={sessionLength}
									onchange={handlePreferenceChange}
									class="mt-1 w-full"
								/>
							</label>

							<label class="flex items-center justify-between">
								<span class="text-sm font-medium text-gray-700">Allow backspace (easier mode)</span>
								<input
									type="checkbox"
									bind:checked={enableBackspace}
									onchange={handlePreferenceChange}
									class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
								/>
							</label>
						</div>

						<!-- General Settings -->
						<div class="space-y-4">
							<h3 class="text-lg font-semibold text-gray-900">General</h3>

							<label class="flex items-center justify-between">
								<span class="text-sm font-medium text-gray-700">Auto-save progress</span>
								<input
									type="checkbox"
									bind:checked={autoSaveEnabled}
									onchange={handlePreferenceChange}
									class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
								/>
							</label>
						</div>
					</div>
				{:else if activeTab === 'accessibility'}
					<!-- Accessibility Tab -->
					<div id="accessibility-content" class="space-y-8" data-testid="accessibility-content">
						<div>
							<h3 class="text-lg font-semibold text-gray-900">Accessibility Options</h3>
							<p class="mt-1 text-sm text-gray-600">
								Make Feed-n-Type more comfortable and accessible for your needs.
							</p>
						</div>

						<!-- Visual Accessibility -->
						<div class="space-y-4">
							<h4 class="font-medium text-gray-900">Visual</h4>

							<label class="flex items-center justify-between">
								<span class="text-sm font-medium text-gray-700">High contrast mode</span>
								<input
									type="checkbox"
									bind:checked={highContrast}
									onchange={handlePreferenceChange}
									class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
								/>
							</label>

							<label class="flex items-center justify-between">
								<span class="text-sm font-medium text-gray-700">Reduce motion</span>
								<input
									type="checkbox"
									bind:checked={reducedMotion}
									onchange={handlePreferenceChange}
									class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
								/>
							</label>

							<label class="flex items-center justify-between">
								<span class="text-sm font-medium text-gray-700">Larger text</span>
								<input
									type="checkbox"
									bind:checked={largerText}
									onchange={handlePreferenceChange}
									class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
								/>
							</label>
						</div>

						<!-- Input Accessibility -->
						<div class="space-y-4">
							<h4 class="font-medium text-gray-900">Input & Navigation</h4>

							<label class="flex items-center justify-between">
								<span class="text-sm font-medium text-gray-700">Enhanced keyboard navigation</span>
								<input
									type="checkbox"
									bind:checked={keyboardNavigation}
									onchange={handlePreferenceChange}
									class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
								/>
							</label>

							<label class="flex items-center justify-between">
								<span class="text-sm font-medium text-gray-700">Screen reader optimizations</span>
								<input
									type="checkbox"
									bind:checked={screenReaderMode}
									onchange={handlePreferenceChange}
									class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
								/>
							</label>
						</div>

						<!-- Help Text -->
						<div class="rounded-lg bg-blue-50 p-4">
							<div class="flex">
								<svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
										clip-rule="evenodd"
									></path>
								</svg>
								<div class="ml-3">
									<h4 class="text-sm font-medium text-blue-800">Accessibility Help</h4>
									<p class="mt-1 text-sm text-blue-700">
										These settings help make the app more accessible. If you need additional
										accommodations, please contact support or check the help documentation.
									</p>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div
				id="settings-footer"
				class="border-t border-gray-200 px-6 py-4"
				data-testid="settings-footer"
			>
				<div
					id="settings-footer-content"
					class="flex items-center justify-between"
					data-testid="settings-footer-content"
				>
					<button
						id="reset-defaults-button"
						class="text-sm text-gray-500 hover:text-gray-700"
						onclick={resetToDefaults}
						data-testid="reset-defaults-button"
					>
						Reset to Defaults
					</button>
					<div id="settings-actions" class="flex space-x-3" data-testid="settings-actions">
						<button
							id="settings-cancel-button"
							class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
							onclick={onClose}
							data-testid="settings-cancel-button"
						>
							Cancel
						</button>
						<button
							id="settings-save-button"
							class="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
							onclick={onClose}
							data-testid="settings-save-button"
						>
							Save Changes
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
