import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
/// <reference types="vitest" />

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],

	// Vitest configuration
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./tests/setup.ts'],
		include: ['tests/**/*.test.ts'],
		exclude: ['tests/e2e/**/*']
	},

	build: {
		// Optimize chunk size and splitting
		chunkSizeWarningLimit: 1000,
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					// Split vendor dependencies (only third-party packages)
					if (id.includes('node_modules')) {
						// Group common vendor libraries
						if (id.includes('svelte') && !id.includes('@sveltejs/kit')) {
							return 'vendor-svelte';
						}
						if (id.includes('@fontsource')) {
							return 'vendor-fonts';
						}
						return 'vendor';
					}

					// Split core services and heavy services separately
					if (id.includes('ContentService') || id.includes('PetStateService')) {
						return 'services-core';
					}
					if (id.includes('AchievementService') || id.includes('ProgressTrackingService')) {
						return 'services-tracking';
					}

					// Split models and storage
					if (id.includes('$lib/models/') || id.includes('$lib/storage/')) {
						return 'data-layer';
					}

					// Split heavy components that might be lazy-loaded
					if (id.includes('ParentDashboard.svelte') || id.includes('Settings.svelte')) {
						return 'dashboard';
					}

					if (
						id.includes('EvolutionCelebration.svelte') ||
						id.includes('AchievementDisplay.svelte')
					) {
						return 'celebrations';
					}

					// Return undefined for everything else (default chunk)
					return undefined;
				}
			}
		},

		// Enable source maps for debugging in production
		sourcemap: false,

		// Minification options
		minify: 'terser',
		terserOptions: {
			compress: {
				drop_console: true, // Remove console.logs in production
				drop_debugger: true,
				pure_funcs: ['console.log', 'console.info', 'console.debug']
			}
		}
	},

	// Optimize dependencies
	optimizeDeps: {
		include: ['svelte', '@sveltejs/kit'],
		exclude: [
			// Exclude large optional dependencies
		]
	},

	// Development server optimizations
	server: {
		fs: {
			// Allow serving files from one level up from package root
			allow: ['..']
		}
	},

	// CSS optimizations
	css: {
		devSourcemap: true
	}
});
