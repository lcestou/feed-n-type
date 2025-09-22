import type { vi } from 'vitest';

declare global {
	const vi: typeof vi;
	const beforeEach: typeof import('vitest').beforeEach;
	const afterEach: typeof import('vitest').afterEach;
}
