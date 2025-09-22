/**
 * Performance Optimization Utilities
 *
 * Provides utilities for bundle analysis, code splitting, lazy loading,
 * and performance monitoring to ensure optimal app performance.
 */

/**
 * Lazy import wrapper for dynamic component loading
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
 * Dynamic component loader with loading fallback
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
 * Preload critical resources
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
 * Performance monitoring utilities
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
	 * Start measuring a performance metric
	 */
	startMeasure(name: string): void {
		if (typeof performance !== 'undefined') {
			this.metrics.set(name, performance.now());
		}
	}

	/**
	 * End measuring and log the result
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
	 * Measure Web Vitals if available
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
 * Bundle size tracking for development
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
 * Intersection Observer for lazy loading
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
 * Debounced function executor for performance
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
	func: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout;

	return (...args: Parameters<T>) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
}

/**
 * Throttled function executor for performance
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
 * Memory usage monitoring (Chrome DevTools API)
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
 * Optimize images with lazy loading
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
