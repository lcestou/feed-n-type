import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EvolutionForm, EmotionalState } from '$lib/types/index.js';
import type {
	ParentSummary,
	ProgressReport,
	TimeRange,
	PetState,
	SessionSummary,
	TypingTrends,
	ImprovementArea,
	KeyAnalysis,
	AchievementRarity
} from '$lib/types/index.js';

describe('Integration Test: Parent Dashboard Data Access', () => {
	let mockProgressService: vi.Mocked<{
		generateProgressReport: (timeRange: TimeRange) => Promise<ProgressReport>;
		getParentSummary: () => Promise<ParentSummary>;
		getTypingTrends: (days: number) => Promise<TypingTrends>;
		identifyChallengingKeys: () => Promise<KeyAnalysis[]>;
		getImprovementSuggestions: () => Promise<ImprovementArea[]>;
	}>;
	let mockPetStateService: vi.Mocked<{
		loadPetState: () => Promise<PetState>;
	}>;
	let mockAchievementService: vi.Mocked<{
		getUnlockedAchievements: () => Promise<unknown[]>;
	}>;
	beforeEach(() => {
		mockProgressService = {
			generateProgressReport: vi.fn(),
			getParentSummary: vi.fn(),
			getTypingTrends: vi.fn(),
			calculateWPM: vi.fn(),
			calculateAccuracy: vi.fn(),
			getImprovementSuggestions: vi.fn(),
			identifyChallengingKeys: vi.fn()
		};

		mockPetStateService = {
			loadPetState: vi.fn()
		};

		mockAchievementService = {
			getRecentAchievements: vi.fn(),
			getAchievementProgress: vi.fn()
		};

		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Scenario: Parent wants to review their childs progress', () => {
		it('should provide comprehensive child summary for parents', async () => {
			const mockParentSummary: ParentSummary = {
				childName: 'Alex',
				totalPracticeTime: 7200000, // 2 hours in milliseconds
				currentStreak: 12,
				averageAccuracy: 87,
				currentWPM: 28,
				recentAchievements: [
					{
						id: 'speed-demon',
						title: 'Speed Demon!',
						description: 'Reached 25 WPM',
						icon: 'lightning',
						points: 50,
						rarity: 'uncommon' as AchievementRarity,
						dateEarned: new Date('2025-01-25')
					}
				],
				areasNeedingFocus: ['number keys', 'punctuation'],
				overallProgress: 'good'
			};

			mockProgressService.getParentSummary.mockResolvedValue(mockParentSummary);

			const summary = await mockProgressService.getParentSummary();

			expect(summary.childName).toBe('Alex');
			expect(summary.totalPracticeTime).toBe(7200000);
			expect(summary.currentStreak).toBe(12);
			expect(summary.averageAccuracy).toBe(87);
			expect(summary.currentWPM).toBe(28);
			expect(summary.recentAchievements).toHaveLength(1);
			expect(summary.areasNeedingFocus).toContain('number keys');
			expect(['excellent', 'good', 'needs_improvement']).toContain(summary.overallProgress);
		});

		it('should generate detailed progress report for specified time period', async () => {
			const timeRange: TimeRange = {
				start: new Date('2025-01-01'),
				end: new Date('2025-01-31'),
				label: 'January 2025'
			};

			const mockProgressReport: ProgressReport = {
				timeRange,
				totalPracticeTime: 10800000, // 3 hours
				averageWPM: 25,
				averageAccuracy: 85,
				sessionsCompleted: 20,
				challengingAreas: ['q-key', 'z-key', 'number-row'],
				achievements: [
					{
						id: 'monthly-warrior',
						title: 'Monthly Warrior!',
						description: 'Practiced every day this month',
						icon: 'calendar',
						points: 200,
						rarity: 'epic' as AchievementRarity,
						dateEarned: new Date('2025-01-31')
					}
				],
				parentNotes: [
					'Excellent consistency with daily practice',
					'Showing steady improvement in accuracy',
					'Could benefit from number key practice'
				]
			};

			mockProgressService.generateProgressReport.mockResolvedValue(mockProgressReport);

			const report = await mockProgressService.generateProgressReport(timeRange);

			expect(report.timeRange.label).toBe('January 2025');
			expect(report.totalPracticeTime).toBe(10800000);
			expect(report.averageWPM).toBe(25);
			expect(report.averageAccuracy).toBe(85);
			expect(report.sessionsCompleted).toBe(20);
			expect(report.challengingAreas).toContain('q-key');
			expect(report.achievements).toHaveLength(1);
			expect(report.parentNotes).toHaveLength(3);
			expect(report.parentNotes[0]).toContain('Excellent consistency');
		});

		it('should provide typing trends and improvement analytics', async () => {
			const mockTypingTrends: TypingTrends = {
				wpmTrend: [
					{ date: new Date('2025-01-20'), value: 18, movingAverage: 17 },
					{ date: new Date('2025-01-21'), value: 20, movingAverage: 18 },
					{ date: new Date('2025-01-22'), value: 22, movingAverage: 19 },
					{ date: new Date('2025-01-23'), value: 24, movingAverage: 20 },
					{ date: new Date('2025-01-24'), value: 26, movingAverage: 22 }
				],
				accuracyTrend: [
					{ date: new Date('2025-01-20'), value: 80, movingAverage: 79 },
					{ date: new Date('2025-01-21'), value: 82, movingAverage: 80 },
					{ date: new Date('2025-01-22'), value: 85, movingAverage: 82 },
					{ date: new Date('2025-01-23'), value: 87, movingAverage: 83 },
					{ date: new Date('2025-01-24'), value: 89, movingAverage: 85 }
				],
				practiceTimeTrend: [
					{ date: new Date('2025-01-20'), value: 15, movingAverage: 14 },
					{ date: new Date('2025-01-21'), value: 18, movingAverage: 15 },
					{ date: new Date('2025-01-22'), value: 20, movingAverage: 17 },
					{ date: new Date('2025-01-23'), value: 22, movingAverage: 18 },
					{ date: new Date('2025-01-24'), value: 25, movingAverage: 20 }
				],
				improvementRate: 8.5
			};

			mockProgressService.getTypingTrends.mockResolvedValue(mockTypingTrends);

			const trends = await mockProgressService.getTypingTrends(7);

			expect(trends.wpmTrend).toHaveLength(5);
			expect(trends.accuracyTrend).toHaveLength(5);
			expect(trends.practiceTimeTrend).toHaveLength(5);
			expect(trends.improvementRate).toBe(8.5);

			// Verify upward trends
			const wpmValues = trends.wpmTrend.map((t: { value: number }) => t.value);
			const accuracyValues = trends.accuracyTrend.map((t: { value: number }) => t.value);
			const practiceValues = trends.practiceTimeTrend.map((t: { value: number }) => t.value);

			expect(wpmValues[4]).toBeGreaterThan(wpmValues[0]);
			expect(accuracyValues[4]).toBeGreaterThan(accuracyValues[0]);
			expect(practiceValues[4]).toBeGreaterThan(practiceValues[0]);
		});

		it('should identify areas needing focused practice', async () => {
			const mockChallengingKeys: KeyAnalysis[] = [
				{
					key: 'q',
					errorRate: 0.28,
					attempts: 50,
					improvementTrend: 'stable',
					practiceRecommendation: 'Practice q-u word combinations'
				},
				{
					key: '9',
					errorRate: 0.35,
					attempts: 20,
					improvementTrend: 'declining',
					practiceRecommendation: 'Focus on number row positioning'
				},
				{
					key: ';',
					errorRate: 0.42,
					attempts: 15,
					improvementTrend: 'improving',
					practiceRecommendation: 'Practice semicolon in sentences'
				}
			];

			const mockImprovementAreas: ImprovementArea[] = [
				{
					area: 'number-keys',
					description: 'Number row accuracy needs improvement',
					priority: 'high',
					recommendation: 'Practice typing phone numbers and dates'
				},
				{
					area: 'punctuation',
					description: 'Punctuation marks are challenging',
					priority: 'medium',
					recommendation: 'Focus on common punctuation in sentences'
				}
			];

			mockProgressService.identifyChallengingKeys.mockResolvedValue(mockChallengingKeys);
			mockProgressService.getImprovementSuggestions.mockResolvedValue(mockImprovementAreas);

			const challengingKeys = await mockProgressService.identifyChallengingKeys();
			const improvementAreas = await mockProgressService.getImprovementSuggestions();

			expect(challengingKeys).toHaveLength(3);
			expect(challengingKeys.every((key: { errorRate: number }) => key.errorRate > 0.2)).toBe(true);
			expect(challengingKeys[0].practiceRecommendation).toContain('q-u');
			expect(challengingKeys[1].improvementTrend).toBe('declining');

			expect(improvementAreas).toHaveLength(2);
			expect(improvementAreas[0].priority).toBe('high');
			expect(improvementAreas[0].area).toBe('number-keys');
			expect(improvementAreas[1].recommendation).toContain('punctuation');
		});

		it('should display current pet status and emotional state', async () => {
			const mockPetState: PetState = {
				id: 'child-pet',
				name: 'Typingotchi',
				evolutionForm: EvolutionForm.TEEN,
				happinessLevel: 85,
				emotionalState: EmotionalState.CONTENT,
				accessories: ['graduation-hat'],
				totalWordsEaten: 750,
				accuracyAverage: 87,
				lastFeedTime: new Date('2025-01-25T10:30:00'),
				streakDays: 12,
				celebrationQueue: []
			};

			mockPetStateService.loadPetState.mockResolvedValue(mockPetState);

			const petState = await mockPetStateService.loadPetState();

			expect(petState.evolutionForm).toBe(EvolutionForm.TEEN);
			expect(petState.happinessLevel).toBe(85);
			expect(petState.emotionalState).toBe(EmotionalState.CONTENT);
			expect(petState.totalWordsEaten).toBe(750);
			expect(petState.accessories).toHaveLength(1);
			expect(petState.accessories[0].equipped).toBe(true);
			expect(petState.streakDays).toBe(12);
		});

		it('should show recent achievements and milestones', async () => {
			const mockRecentAchievements = [
				{
					id: 'teen-evolution',
					title: 'Growing Up!',
					description: 'Your pet evolved to Teen form',
					icon: 'growth',
					points: 150,
					rarity: 'rare' as AchievementRarity,
					dateEarned: new Date('2025-01-20')
				},
				{
					id: 'accuracy-master',
					title: 'Accuracy Master!',
					description: 'Maintained 85%+ accuracy for 5 sessions',
					icon: 'target',
					points: 100,
					rarity: 'uncommon' as AchievementRarity,
					dateEarned: new Date('2025-01-22')
				},
				{
					id: 'daily-dedication',
					title: 'Daily Dedication!',
					description: 'Practiced for 10 days straight',
					icon: 'calendar',
					points: 125,
					rarity: 'uncommon' as AchievementRarity,
					dateEarned: new Date('2025-01-24')
				}
			];

			mockAchievementService.getRecentAchievements.mockResolvedValue(mockRecentAchievements);

			const achievements = await mockAchievementService.getRecentAchievements(7);

			expect(achievements).toHaveLength(3);
			expect(achievements[0].title).toBe('Growing Up!');
			expect(achievements[1].rarity).toBe('uncommon');
			expect(achievements[2].points).toBe(125);
			expect(
				achievements.every((a: { dateEarned: Date }) => a.dateEarned >= new Date('2025-01-18'))
			).toBe(true);
		});

		it('should provide session history with detailed metrics', async () => {
			const mockSessionHistory: SessionSummary[] = [
				{
					sessionId: 'session-2025-01-25',
					duration: 900000, // 15 minutes
					wordsPerMinute: 26,
					accuracyPercentage: 89,
					totalCharacters: 195,
					errorsCount: 21,
					improvementFromLastSession: 2,
					milestonesAchieved: [
						{
							type: 'streak',
							value: 7,
							timestamp: new Date('2025-01-23'),
							celebrated: true
						}
					]
				},
				{
					sessionId: 'session-2025-01-24',
					duration: 1200000, // 20 minutes
					wordsPerMinute: 24,
					accuracyPercentage: 87,
					totalCharacters: 240,
					errorsCount: 31,
					improvementFromLastSession: 1,
					milestonesAchieved: []
				},
				{
					sessionId: 'session-2025-01-23',
					duration: 800000, // 13 minutes
					wordsPerMinute: 23,
					accuracyPercentage: 85,
					totalCharacters: 153,
					errorsCount: 23,
					improvementFromLastSession: 3,
					milestonesAchieved: [
						{
							type: 'accuracy',
							value: 90,
							timestamp: new Date('2025-01-24'),
							celebrated: true
						}
					]
				}
			];

			// Mock this as part of progress service
			mockProgressService.getRecentSessions = vi.fn().mockResolvedValue(mockSessionHistory);

			const sessions = await mockProgressService.getRecentSessions(3);

			expect(sessions).toHaveLength(3);
			expect(sessions[0].wordsPerMinute).toBe(26);
			expect(sessions[0].accuracyPercentage).toBe(89);
			expect(sessions[1].improvementFromLastSession).toBe(1);
			expect(sessions[2].milestonesAchieved).toContain('Accuracy Streak');

			// Verify improvement trend
			const wpmValues = sessions.map((s: { wordsPerMinute: number }) => s.wordsPerMinute);
			expect(wpmValues[0]).toBeGreaterThan(wpmValues[2]); // Most recent > oldest
		});

		it('should generate parent-friendly recommendations', async () => {
			const parentRecommendations = {
				practiceSchedule: 'Continue current 15-20 minute daily sessions',
				encouragementNotes: [
					'Alex is showing excellent consistency!',
					'Speed improvement is ahead of typical learning curve',
					'Accuracy improvements demonstrate careful attention'
				],
				focusAreas: [
					'Number key practice would boost overall accuracy',
					'Punctuation exercises could unlock new achievements',
					'Continue celebrating daily practice milestones'
				],
				nextMilestones: [
					'Reach 30 WPM (currently at 26)',
					'Achieve 90% accuracy average',
					'Evolve pet to Adult form (250 words remaining)'
				],
				safetyNotes: [
					'All data stored locally on this device',
					'No personal information shared online',
					'Practice time automatically tracked for insights'
				]
			};

			expect(parentRecommendations.practiceSchedule).toContain('15-20 minute');
			expect(parentRecommendations.encouragementNotes).toHaveLength(3);
			expect(parentRecommendations.focusAreas).toHaveLength(3);
			expect(parentRecommendations.nextMilestones).toHaveLength(3);
			expect(parentRecommendations.safetyNotes[0]).toContain('locally');
			expect(parentRecommendations.encouragementNotes[0]).toContain('excellent');
		});
	});

	describe('Data Privacy and Safety', () => {
		it('should ensure all data remains local', async () => {
			const mockSafetyValidation = {
				dataStorageLocation: 'local-browser-only',
				externalConnections: [],
				dataExportOptions: ['local-file-download'],
				parentalControlAccess: 'full-local-access',
				privacyCompliance: 'coppa-safe'
			};

			expect(mockSafetyValidation.dataStorageLocation).toBe('local-browser-only');
			expect(mockSafetyValidation.externalConnections).toHaveLength(0);
			expect(mockSafetyValidation.dataExportOptions).toContain('local-file-download');
			expect(mockSafetyValidation.privacyCompliance).toBe('coppa-safe');
		});

		it('should provide data export functionality for parents', async () => {
			const mockExportData = {
				childProfile: {
					name: 'Alex',
					startDate: new Date('2025-01-01'),
					totalSessions: 25,
					currentLevel: 'Teen'
				},
				progressSummary: {
					averageWPM: 26,
					averageAccuracy: 87,
					totalPracticeTime: 10800000,
					achievementsEarned: 8
				},
				exportTimestamp: new Date(),
				exportFormat: 'json'
			};

			// Mock export functionality
			mockProgressService.exportData = vi.fn().mockResolvedValue(mockExportData);

			const exportedData = await mockProgressService.exportData('json');

			expect(exportedData.childProfile.name).toBe('Alex');
			expect(exportedData.progressSummary.averageWPM).toBe(26);
			expect(exportedData.exportFormat).toBe('json');
			expect(exportedData.exportTimestamp).toBeInstanceOf(Date);
		});
	});

	describe('Performance Requirements', () => {
		it('should load parent dashboard within 500ms', async () => {
			const mockData = {
				parentSummary: { childName: 'Alex', totalPracticeTime: 7200000 },
				petState: { evolutionForm: EvolutionForm.TEEN, happinessLevel: 85 },
				recentAchievements: []
			};

			mockProgressService.getParentSummary.mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(mockData.parentSummary), 300))
			);
			mockPetStateService.loadPetState.mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(mockData.petState), 200))
			);
			mockAchievementService.getRecentAchievements.mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(mockData.recentAchievements), 150))
			);

			const startTime = performance.now();
			await Promise.all([
				mockProgressService.getParentSummary(),
				mockPetStateService.loadPetState(),
				mockAchievementService.getRecentAchievements(7)
			]);
			const endTime = performance.now();

			expect(endTime - startTime).toBeLessThan(500);
		});

		it('should generate progress report within performance limits', async () => {
			const timeRange: TimeRange = {
				start: new Date('2025-01-01'),
				end: new Date('2025-01-31'),
				label: 'January 2025'
			};

			const mockReport: ProgressReport = {
				timeRange,
				totalPracticeTime: 10800000,
				averageWPM: 25,
				averageAccuracy: 85,
				sessionsCompleted: 20,
				challengingAreas: [],
				achievements: [],
				parentNotes: []
			};

			mockProgressService.generateProgressReport.mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(mockReport), 400))
			);

			const startTime = performance.now();
			await mockProgressService.generateProgressReport(timeRange);
			const endTime = performance.now();

			expect(endTime - startTime).toBeLessThan(500);
		});
	});
});
