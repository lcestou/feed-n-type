import type { vi as vitest } from 'vitest';

declare global {
	const vi: typeof vitest;
	const beforeEach: typeof import('vitest').beforeEach;
	const afterEach: typeof import('vitest').afterEach;
}
