/**
 * @module PerformanceUtils
 * @description Performance optimization utilities for the gamified typing trainer.
 * Provides tools for bundle analysis, code splitting, lazy loading, and performance
 * monitoring to ensure optimal app performance for kids' typing practice sessions.
 *
 * These utilities help maintain smooth 60fps animations, fast content loading,
 * and responsive user interactions essential for engaging young learners.
 *
 * @since 1.0.0
 * @performance Implements lazy loading, debouncing, and memory monitoring
 */

/**
 * Lazy import wrapper for dynamic component loading with error handling.
 * Enables code splitting to reduce initial bundle size.
 *
 * @template T
 * @param {() => Promise<T>} importFn - Function that returns import promise
 * @returns {Promise<T>} Promise that resolves to imported module
 * @throws {Error} If module fails to load
 *
 * @example
 * // Lazy load a heavy component
 * const LazyChart = await lazyImport(() => import('./HeavyChartComponent.svelte'));
 *
 * // Use with try-catch for error handling
 * try {
 *   const module = await lazyImport(() => import('./OptionalFeature.js'));
 *   module.initialize();
 * } catch (error) {
 *   console.log('Optional feature not available');
 * }
 *
 * @performance Reduces initial bundle size through code splitting
 * @since 1.0.0
 */
export async function lazyImport<T>(importFn: () => Promise<T>): Promise<T> {
	try {
		return await importFn();
	} catch (error) {
		console.error('Failed to lazy load component:', error);
		throw new Error('Component failed to load');
	}
}

/**
 * Creates a lazy component loader with optional fallback for failed loads.
 * Ideal for non-critical components that enhance the typing experience.
 *
 * @template T
 * @param {() => Promise<{ default: T }>} importFn - Function that imports the component
 * @param {T} [fallback] - Optional fallback component if import fails
 * @returns {() => Promise<T>} Function that loads the component
 *
 * @example
 * // Create lazy loader for animation component
 * const loadCelebrationAnimation = createLazyComponent(
 *   () => import('./CelebrationAnimation.svelte'),
 *   SimpleTextCelebration // fallback if fancy animation fails
 * );
 *
 * // Use in component
 * const AnimationComponent = await loadCelebrationAnimation();
 *
 * @performance Graceful degradation if advanced features fail to load
 * @since 1.0.0
 */
export function createLazyComponent<T>(importFn: () => Promise<{ default: T }>, fallback?: T) {
	return async (): Promise<T> => {
		try {
			const module = await importFn();
			return module.default;
		} catch (error) {
			console.error('Failed to load component:', error);
			if (fallback) {
				return fallback;
			}
			throw error;
		}
	};
}

/**
 * Preloads critical typing content to ensure smooth practice sessions.
 * Downloads Pokemon, Nintendo, and Roblox content in the background.
 *
 * @returns {void}
 *
 * @example
 * // Preload content during app initialization
 * import { preloadCriticalResources } from '$lib/utils/performance.js';
 *
 * // Call during app startup
 * preloadCriticalResources();
 * console.log('Critical typing content preloading started');
 *
 * @performance Reduces wait time when kids start typing practice
 * @since 1.0.0
 */
export function preloadCriticalResources() {
	// Preload critical content data
	if (typeof window !== 'undefined') {
		// Preload critical static assets
		const criticalAssets = [
			'/static/content/pokemon.json',
			'/static/content/nintendo.json',
			'/static/content/roblox.json'
		];

		criticalAssets.forEach((asset) => {
			const link = document.createElement('link');
			link.rel = 'prefetch';
			link.href = asset;
			document.head.appendChild(link);
		});
	}
}

/**
 * @class PerformanceMonitor
 * @description Singleton class for monitoring app performance and timing critical operations.
 * Helps ensure typing practice remains smooth and responsive for kids.
 *
 * @example
 * // Monitor typing session performance
 * const monitor = PerformanceMonitor.getInstance();
 * monitor.startMeasure('typing-session');
 * // ... typing session logic ...
 * const duration = monitor.endMeasure('typing-session');
 * console.log(`Typing session took ${duration}ms`);
 *
 * @since 1.0.0
 */
export class PerformanceMonitor {
	private static instance: PerformanceMonitor;
	private metrics: Map<string, number> = new Map();

	static getInstance(): PerformanceMonitor {
		if (!this.instance) {
			this.instance = new PerformanceMonitor();
		}
		return this.instance;
	}

	/**
	 * Starts measuring performance for a named operation.
	 * Use for timing critical operations like content loading or rendering.
	 *
	 * @param {string} name - Unique name for the measurement
	 * @returns {void}
	 *
	 * @example
	 * // Measure content loading time
	 * monitor.startMeasure('content-load');
	 * await loadTypingContent();
	 * monitor.endMeasure('content-load');
	 *
	 * // Measure pet animation performance
	 * monitor.startMeasure('pet-animation');
	 * await playPetFeedingAnimation();
	 * monitor.endMeasure('pet-animation');
	 *
	 * @since 1.0.0
	 */
	startMeasure(name: string): void {
		if (typeof performance !== 'undefined') {
			this.metrics.set(name, performance.now());
		}
	}

	/**
	 * Ends performance measurement and returns duration.
	 * Automatically logs results in development mode.
	 *
	 * @param {string} name - Name of the measurement to end
	 * @returns {number} Duration in milliseconds
	 *
	 * @example
	 * // Measure and check performance threshold
	 * monitor.startMeasure('keypress-handling');
	 * handleKeypress(key);
	 * const duration = monitor.endMeasure('keypress-handling');
	 * if (duration > 5) {
	 *   console.warn('Keypress handling too slow for responsive typing');
	 * }
	 *
	 * @performance Target <5ms for keypress handling, <100ms for content loading
	 * @since 1.0.0
	 */
	endMeasure(name: string): number {
		if (typeof performance !== 'undefined' && this.metrics.has(name)) {
			const startTime = this.metrics.get(name)!;
			const duration = performance.now() - startTime;
			this.metrics.delete(name);

			// Log performance metrics in development
			if (import.meta.env.DEV) {
				console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
			}

			return duration;
		}
		return 0;
	}

	/**
	 * Measures Core Web Vitals for overall app performance assessment.
	 * Tracks metrics important for user experience during typing practice.
	 *
	 * @returns {void}
	 *
	 * @example
	 * // Start measuring web vitals during app startup
	 * const monitor = PerformanceMonitor.getInstance();
	 * monitor.measureWebVitals();
	 * // Metrics logged automatically in development mode
	 *
	 * @performance Monitors First Contentful Paint and Largest Contentful Paint
	 * @since 1.0.0
	 */
	measureWebVitals(): void {
		if (typeof window === 'undefined') return;

		// Measure First Contentful Paint
		if ('performance' in window && 'getEntriesByName' in performance) {
			const observer = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				entries.forEach((entry) => {
					if (import.meta.env.DEV) {
						console.log(`Web Vital: ${entry.name} = ${entry.startTime.toFixed(2)}ms`);
					}
				});
			});

			try {
				observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
			} catch {
				// Fallback for browsers that don't support these metrics
			}
		}
	}
}

/**
 * Tracks JavaScript bundle size during development for optimization insights.
 * Helps identify when bundles become too large for optimal loading performance.
 *
 * @returns {void}
 *
 * @example
 * // Track bundle size during development
 * import { trackBundleSize } from '$lib/utils/performance.js';
 *
 * if (import.meta.env.DEV) {
 *   trackBundleSize();
 *   // Logs bundle size information to console
 * }
 *
 * @performance Monitors bundle size to ensure fast app loading for kids
 * @since 1.0.0
 */
export function trackBundleSize(): void {
	if (import.meta.env.DEV && typeof window !== 'undefined') {
		// Track JavaScript bundle size
		const scripts = Array.from(document.scripts);
		let totalSize = 0;

		scripts.forEach((script) => {
			if (script.src && script.src.includes('/_app/')) {
				// Estimate size based on script loading (this is approximate)
				fetch(script.src, { method: 'HEAD' })
					.then((response) => {
						const size = response.headers.get('content-length');
						if (size) {
							totalSize += parseInt(size, 10);
							console.log(`Bundle size tracking: ${(totalSize / 1024).toFixed(2)} KB`);
						}
					})
					.catch(() => {
						// Silently fail if we can't get size
					});
			}
		});
	}
}

/**
 * Creates Intersection Observer for lazy loading elements when they become visible.
 * Optimizes performance by loading content only when needed.
 *
 * @param {(entries: IntersectionObserverEntry[]) => void} callback - Function to execute when elements intersect
 * @param {IntersectionObserverInit} [options={}] - Intersection observer configuration
 * @returns {IntersectionObserver | null} Observer instance or null if not supported
 *
 * @example
 * // Lazy load pet accessories when they come into view
 * const accessoryLoader = createLazyLoader((entries) => {
 *   entries.forEach(entry => {
 *     if (entry.isIntersecting) {
 *       loadAccessoryImage(entry.target as HTMLImageElement);
 *     }
 *   });
 * });
 *
 * // Observe accessory elements
 * document.querySelectorAll('.pet-accessory').forEach(img => {
 *   accessoryLoader?.observe(img);
 * });
 *
 * @performance Reduces initial load time by deferring non-critical content
 * @since 1.0.0
 */
export function createLazyLoader(
	callback: (entries: IntersectionObserverEntry[]) => void,
	options: IntersectionObserverInit = {}
): IntersectionObserver | null {
	if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
		return null;
	}

	return new IntersectionObserver(callback, {
		rootMargin: '50px',
		threshold: 0.1,
		...options
	});
}

/**
 * Creates debounced function that delays execution until after wait period.
 * Essential for handling rapid typing input without performance degradation.
 *
 * @template T
 * @param {T} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds before executing
 * @returns {(...args: Parameters<T>) => void} Debounced function
 *
 * @example
 * // Debounce typing progress saves to avoid excessive database writes
 * const debouncedSave = debounce(saveTypingProgress, 500);
 *
 * // Called on every keypress, but only saves after 500ms of inactivity
 * function handleKeypress(key: string) {
 *   updateProgress(key);
 *   debouncedSave(); // Won't execute until typing pauses
 * }
 *
 * // Debounce search for typing content
 * const debouncedSearch = debounce(searchContent, 300);
 *
 * @performance Prevents excessive API calls during rapid user input
 * @since 1.0.0
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
	func: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeout: number;

	return (...args: Parameters<T>) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
}

/**
 * Creates throttled function that executes at most once per time limit.
 * Useful for high-frequency events like scroll or resize during typing practice.
 *
 * @template T
 * @param {T} func - Function to throttle
 * @param {number} limit - Minimum time between executions in milliseconds
 * @returns {(...args: Parameters<T>) => void} Throttled function
 *
 * @example
 * // Throttle scroll handling for smooth pet animations
 * const throttledScroll = throttle(updatePetPosition, 16); // ~60fps
 * window.addEventListener('scroll', throttledScroll);
 *
 * // Throttle window resize for responsive layout updates
 * const throttledResize = throttle(adjustTypingAreaLayout, 100);
 * window.addEventListener('resize', throttledResize);
 *
 * @performance Maintains smooth animations while limiting CPU usage
 * @since 1.0.0
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
	func: T,
	limit: number
): (...args: Parameters<T>) => void {
	let inThrottle: boolean;

	return (...args: Parameters<T>) => {
		if (!inThrottle) {
			func(...args);
			inThrottle = true;
			setTimeout(() => (inThrottle = false), limit);
		}
	};
}

/**
 * Monitors JavaScript memory usage for development optimization.
 * Helps identify memory leaks that could affect typing performance.
 *
 * @returns {void}
 *
 * @example
 * // Start memory monitoring during development
 * import { monitorMemoryUsage } from '$lib/utils/performance.js';
 *
 * if (import.meta.env.DEV) {
 *   monitorMemoryUsage();
 *   // Logs memory usage every 30 seconds to console
 * }
 *
 * @performance Logs memory stats every 30 seconds in Chrome DevTools
 * @since 1.0.0
 */
export function monitorMemoryUsage(): void {
	if (import.meta.env.DEV && 'memory' in performance) {
		const memory = (
			performance as {
				memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
			}
		).memory;

		setInterval(() => {
			const used = (memory.usedJSHeapSize / 1048576).toFixed(2);
			const total = (memory.totalJSHeapSize / 1048576).toFixed(2);
			const limit = (memory.jsHeapSizeLimit / 1048576).toFixed(2);

			console.log(`Memory: ${used}MB / ${total}MB (limit: ${limit}MB)`);
		}, 30000); // Log every 30 seconds
	}
}

/**
 * Optimizes image loading with lazy loading and placeholder support.
 * Essential for pet accessories and content images that enhance the typing experience.
 *
 * @param {HTMLImageElement} img - Image element to optimize
 * @param {string} src - Actual image source URL
 * @param {string} [placeholder] - Optional placeholder image URL
 * @returns {void}
 *
 * @example
 * // Optimize pet accessory images
 * const petHatImg = document.querySelector('#pet-hat') as HTMLImageElement;
 * optimizeImage(
 *   petHatImg,
 *   '/images/accessories/rainbow-hat.png',
 *   '/images/placeholders/accessory-placeholder.png'
 * );
 *
 * // Optimize content preview images
 * document.querySelectorAll('.content-preview').forEach(img => {
 *   optimizeImage(
 *     img as HTMLImageElement,
 *     img.dataset.src!,
 *     '/images/placeholders/content-loading.png'
 *   );
 * });
 *
 * @performance Reduces initial page load time and improves perceived performance
 * @since 1.0.0
 */
export function optimizeImage(img: HTMLImageElement, src: string, placeholder?: string): void {
	if (placeholder) {
		img.src = placeholder;
	}

	const observer = createLazyLoader((entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				const image = entry.target as HTMLImageElement;
				image.src = src;
				image.onload = () => {
					image.classList.add('loaded');
				};
				observer?.unobserve(image);
			}
		});
	});

	if (observer) {
		observer.observe(img);
	} else {
		// Fallback for browsers without Intersection Observer
		img.src = src;
	}
}
