import { vi } from 'vitest';

// Global test setup
global.vi = vi;

// Mock localStorage
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn(),
	length: 0,
	key: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock
});

// Mock IndexedDB
global.indexedDB = {} as IDBFactory;

// Reset all mocks before each test
beforeEach(() => {
	vi.clearAllMocks();
});
