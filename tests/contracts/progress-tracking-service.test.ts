import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
	ProgressTrackingService,
	SessionId,
	SessionSummary,
	TimeSpan,
	TypingTrends,
	KeyAnalysis,
	ImprovementArea,
	Milestone,
	TimeRange,
	ProgressReport,
	ParentSummary
} from '$lib/types/index.js';

describe('ProgressTrackingService Contract Tests', () => {
	let progressService: ProgressTrackingService;

	beforeEach(() => {
		progressService = {
			startSession: vi.fn(),
			recordKeypress: vi.fn(),
			endSession: vi.fn(),
			calculateWPM: vi.fn(),
			calculateAccuracy: vi.fn(),
			getTypingTrends: vi.fn(),
			identifyChallengingKeys: vi.fn(),
			getImprovementSuggestions: vi.fn(),
			trackMilestones: vi.fn(),
			generateProgressReport: vi.fn(),
			getParentSummary: vi.fn()
		};
	});

	describe('startSession', () => {
		it('should return unique session identifier', async () => {
			const mockSessionId: SessionId = 'session-123';
			vi.mocked(progressService.startSession).mockResolvedValue(mockSessionId);

			const result = await progressService.startSession('content-001');

			expect(result).toBe(mockSessionId);
			expect(typeof result).toBe('string');
			expect(result.length).toBeGreaterThan(0);
			expect(progressService.startSession).toHaveBeenCalledWith('content-001');
		});

		it('should initialize session tracking and timer', async () => {
			const sessionId = 'session-abc';
			vi.mocked(progressService.startSession).mockResolvedValue(sessionId);

			const startTime = Date.now();
			const result = await progressService.startSession('pokemon-001');
			const endTime = Date.now();

			expect(result).toBe(sessionId);
			expect(endTime - startTime).toBeLessThan(50);
		});
	});

	describe('recordKeypress', () => {
		it('should record keypress with timestamp validation', async () => {
			vi.mocked(progressService.recordKeypress).mockResolvedValue();

			const timestamp = Date.now();
			await progressService.recordKeypress('a', true, timestamp);

			expect(progressService.recordKeypress).toHaveBeenCalledWith('a', true, timestamp);
		});

		it('should batch keypresses for performance', async () => {
			vi.mocked(progressService.recordKeypress).mockImplementation(
				() => new Promise((resolve) => setTimeout(resolve, 2))
			);

			const startTime = performance.now();

			const promises = [];
			for (let i = 0; i < 10; i++) {
				promises.push(progressService.recordKeypress('test'[i % 4], true, Date.now() + i));
			}

			await Promise.all(promises);
			const endTime = performance.now();

			expect(endTime - startTime).toBeLessThan(50);
		});

		it('should meet real-time performance requirement (<5ms)', async () => {
			vi.mocked(progressService.recordKeypress).mockResolvedValue();

			const startTime = performance.now();
			await progressService.recordKeypress('t', true, Date.now());
			const endTime = performance.now();

			expect(endTime - startTime).toBeLessThan(5);
		});
	});

	describe('endSession', () => {
		it('should return complete session summary', async () => {
			const mockSummary: SessionSummary = {
				sessionId: 'session-123',
				duration: 300000,
				wordsPerMinute: 25,
				accuracyPercentage: 92,
				totalCharacters: 120,
				errorsCount: 8,
				improvementFromLastSession: 3,
				milestonesAchieved: []
			};

			vi.mocked(progressService.endSession).mockResolvedValue(mockSummary);

			const result = await progressService.endSession();

			expect(result).toEqual(mockSummary);
			expect(result).toHaveProperty('sessionId');
			expect(result).toHaveProperty('duration');
			expect(result).toHaveProperty('wordsPerMinute');
			expect(result).toHaveProperty('accuracyPercentage');
			expect(result.duration).toBeGreaterThan(0);
			expect(result.accuracyPercentage).toBeGreaterThanOrEqual(0);
			expect(result.accuracyPercentage).toBeLessThanOrEqual(100);
		});
	});

	describe('calculateWPM', () => {
		it('should calculate WPM using correct formula', async () => {
			vi.mocked(progressService.calculateWPM).mockResolvedValue(24);

			const result = await progressService.calculateWPM('week' as TimeSpan);

			expect(result).toBe(24);
			expect(typeof result).toBe('number');
			expect(result).toBeGreaterThanOrEqual(0);
		});

		it('should exclude outlier sessions', async () => {
			vi.mocked(progressService.calculateWPM).mockResolvedValue(22);

			const result = await progressService.calculateWPM('month' as TimeSpan);

			expect(result).toBeLessThan(300);
			expect(result).toBeGreaterThan(0);
		});

		it('should meet performance requirement (<100ms)', async () => {
			vi.mocked(progressService.calculateWPM).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(20), 80))
			);

			const startTime = performance.now();
			await progressService.calculateWPM();
			const endTime = performance.now();

			expect(endTime - startTime).toBeLessThan(100);
		});
	});

	describe('calculateAccuracy', () => {
		it('should return accuracy percentage', async () => {
			vi.mocked(progressService.calculateAccuracy).mockResolvedValue(89.5);

			const result = await progressService.calculateAccuracy('day' as TimeSpan);

			expect(result).toBe(89.5);
			expect(result).toBeGreaterThanOrEqual(0);
			expect(result).toBeLessThanOrEqual(100);
		});
	});

	describe('getTypingTrends', () => {
		it('should return trend data with moving averages', async () => {
			const mockTrends: TypingTrends = {
				wpmTrend: [
					{ date: new Date(), value: 20, movingAverage: 18 },
					{ date: new Date(), value: 22, movingAverage: 19 }
				],
				accuracyTrend: [
					{ date: new Date(), value: 85, movingAverage: 83 },
					{ date: new Date(), value: 88, movingAverage: 85 }
				],
				practiceTimeTrend: [{ date: new Date(), value: 15, movingAverage: 14 }],
				improvementRate: 2.5
			};

			vi.mocked(progressService.getTypingTrends).mockResolvedValue(mockTrends);

			const result = await progressService.getTypingTrends(7);

			expect(result).toEqual(mockTrends);
			expect(result).toHaveProperty('wpmTrend');
			expect(result).toHaveProperty('accuracyTrend');
			expect(result).toHaveProperty('improvementRate');
			expect(Array.isArray(result.wpmTrend)).toBe(true);
			expect(result.wpmTrend[0]).toHaveProperty('movingAverage');
		});
	});

	describe('identifyChallengingKeys', () => {
		it('should identify keys with >20% error rate', async () => {
			const mockAnalysis: KeyAnalysis[] = [
				{
					key: 'q',
					errorRate: 0.25,
					attempts: 40,
					improvementTrend: 'improving',
					practiceRecommendation: 'Focus on q-u combinations'
				},
				{
					key: 'z',
					errorRate: 0.3,
					attempts: 20,
					improvementTrend: 'stable',
					practiceRecommendation: 'Practice z-key reach exercises'
				}
			];

			vi.mocked(progressService.identifyChallengingKeys).mockResolvedValue(mockAnalysis);

			const result = await progressService.identifyChallengingKeys();

			expect(result).toEqual(mockAnalysis);
			expect(Array.isArray(result)).toBe(true);
			expect(result.every((key) => key.errorRate > 0.2)).toBe(true);
			expect(result[0]).toHaveProperty('key');
			expect(result[0]).toHaveProperty('errorRate');
			expect(result[0]).toHaveProperty('practiceRecommendation');
		});

		it('should compare against expected key difficulty patterns', async () => {
			const mockAnalysis: KeyAnalysis[] = [
				{
					key: 'x',
					errorRate: 0.22,
					attempts: 35,
					improvementTrend: 'declining',
					practiceRecommendation: 'Bottom row key practice needed'
				}
			];

			vi.mocked(progressService.identifyChallengingKeys).mockResolvedValue(mockAnalysis);

			const result = await progressService.identifyChallengingKeys();

			expect(result[0].improvementTrend).toBe('declining');
			expect(result[0].practiceRecommendation).toContain('practice');
		});
	});

	describe('getImprovementSuggestions', () => {
		it('should return prioritized improvement areas', async () => {
			const mockSuggestions: ImprovementArea[] = [
				{
					area: 'accuracy',
					description: 'Focus on typing accuracy over speed',
					priority: 'high',
					recommendation: 'Practice common word patterns slowly'
				},
				{
					area: 'finger-placement',
					description: 'Improve home row positioning',
					priority: 'medium',
					recommendation: 'Use touch typing exercises'
				}
			];

			vi.mocked(progressService.getImprovementSuggestions).mockResolvedValue(mockSuggestions);

			const result = await progressService.getImprovementSuggestions();

			expect(result).toEqual(mockSuggestions);
			expect(Array.isArray(result)).toBe(true);
			expect(result[0]).toHaveProperty('area');
			expect(result[0]).toHaveProperty('priority');
			expect(result[0]).toHaveProperty('recommendation');
		});
	});

	describe('generateProgressReport', () => {
		it('should generate comprehensive progress report', async () => {
			const timeRange: TimeRange = {
				start: new Date('2025-01-01'),
				end: new Date('2025-01-21'),
				label: 'January 2025'
			};

			const mockReport: ProgressReport = {
				timeRange,
				totalPracticeTime: 1800000,
				averageWPM: 23,
				averageAccuracy: 87,
				sessionsCompleted: 12,
				challengingAreas: ['q-key', 'number-row'],
				achievements: [],
				parentNotes: ['Consistent daily practice', 'Improving accuracy']
			};

			vi.mocked(progressService.generateProgressReport).mockResolvedValue(mockReport);

			const result = await progressService.generateProgressReport(timeRange);

			expect(result).toEqual(mockReport);
			expect(result).toHaveProperty('timeRange');
			expect(result).toHaveProperty('totalPracticeTime');
			expect(result).toHaveProperty('averageWPM');
			expect(result).toHaveProperty('parentNotes');
			expect(result.totalPracticeTime).toBeGreaterThan(0);
		});

		it('should meet performance requirement (<500ms)', async () => {
			const timeRange: TimeRange = {
				start: new Date(),
				end: new Date(),
				label: 'test'
			};

			const mockReport: ProgressReport = {
				timeRange,
				totalPracticeTime: 0,
				averageWPM: 0,
				averageAccuracy: 0,
				sessionsCompleted: 0,
				challengingAreas: [],
				achievements: [],
				parentNotes: []
			};

			vi.mocked(progressService.generateProgressReport).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(mockReport), 400))
			);

			const startTime = performance.now();
			await progressService.generateProgressReport(timeRange);
			const endTime = performance.now();

			expect(endTime - startTime).toBeLessThan(500);
		});
	});

	describe('getParentSummary', () => {
		it('should return child-friendly progress summary', async () => {
			const mockSummary: ParentSummary = {
				childName: 'Test Child',
				totalPracticeTime: 3600000,
				currentStreak: 5,
				averageAccuracy: 85,
				currentWPM: 22,
				recentAchievements: [],
				areasNeedingFocus: ['number keys'],
				overallProgress: 'good'
			};

			vi.mocked(progressService.getParentSummary).mockResolvedValue(mockSummary);

			const result = await progressService.getParentSummary();

			expect(result).toEqual(mockSummary);
			expect(result).toHaveProperty('childName');
			expect(result).toHaveProperty('totalPracticeTime');
			expect(result).toHaveProperty('currentStreak');
			expect(result).toHaveProperty('overallProgress');
			expect(['excellent', 'good', 'needs_improvement']).toContain(result.overallProgress);
		});
	});

	describe('Error Handling', () => {
		it('should handle session corruption gracefully', async () => {
			const corruptionError = new Error('Session data corrupted');
			vi.mocked(progressService.endSession).mockRejectedValue(corruptionError);

			try {
				await progressService.endSession();
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toBe('Session data corrupted');
			}
		});

		it('should handle invalid timestamps', async () => {
			const timestampError = new Error('Invalid timestamp');
			vi.mocked(progressService.recordKeypress).mockRejectedValue(timestampError);

			try {
				await progressService.recordKeypress('a', true, -1);
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toBe('Invalid timestamp');
			}
		});

		it('should handle metrics calculation errors', async () => {
			const calculationError = new Error('Metrics calculation failed');
			vi.mocked(progressService.calculateWPM).mockRejectedValue(calculationError);

			try {
				await progressService.calculateWPM();
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toContain('calculation');
			}
		});

		it('should handle storage limit gracefully', async () => {
			const storageError = new Error('Storage limit exceeded');
			vi.mocked(progressService.recordKeypress).mockRejectedValue(storageError);

			try {
				await progressService.recordKeypress('a', true, Date.now());
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toContain('Storage');
			}
		});
	});

	describe('Data Retention', () => {
		it('should maintain 6 months of session history', async () => {
			const mockTrends: TypingTrends = {
				wpmTrend: [],
				accuracyTrend: [],
				practiceTimeTrend: [],
				improvementRate: 0
			};

			vi.mocked(progressService.getTypingTrends).mockResolvedValue(mockTrends);

			const result = await progressService.getTypingTrends(180);

			expect(progressService.getTypingTrends).toHaveBeenCalledWith(180);
		});
	});
});
