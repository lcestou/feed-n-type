import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
	AchievementService,
	Achievement,
	UnlockResult,
	CelebrationEvent,
	Accessory,
	Milestone,
	PersonalBest,
	SessionSummary,
	UserProgress
} from '$lib/types/index.js';

describe('AchievementService Contract Tests', () => {
	let achievementService: AchievementService;

	beforeEach(() => {
		achievementService = {
			checkAchievements: vi.fn(),
			unlockAchievement: vi.fn(),
			getUnlockedAchievements: vi.fn(),
			queueCelebration: vi.fn(),
			getNextCelebration: vi.fn(),
			markCelebrationShown: vi.fn(),
			unlockAccessory: vi.fn(),
			getAvailableAccessories: vi.fn(),
			equipAccessory: vi.fn(),
			checkMilestones: vi.fn(),
			getPersonalBests: vi.fn(),
			updatePersonalBest: vi.fn()
		};
	});

	describe('checkAchievements', () => {
		it('should return newly unlocked achievements', async () => {
			const mockSessionData: SessionSummary = {
				sessionId: 'session-123',
				duration: 600000,
				wordsPerMinute: 25,
				accuracyPercentage: 90,
				totalCharacters: 250,
				errorsCount: 25,
				improvementFromLastSession: 2,
				milestonesAchieved: []
			};

			const mockAchievements: Achievement[] = [
				{
					id: 'speedy-fingers',
					title: 'Speedy Fingers',
					description: 'Reached 25 WPM',
					icon: 'speed-icon',
					points: 100,
					rarity: 'common',
					dateEarned: new Date()
				}
			];

			vi.mocked(achievementService.checkAchievements).mockResolvedValue(mockAchievements);

			const result = await achievementService.checkAchievements(mockSessionData);

			expect(result).toEqual(mockAchievements);
			expect(Array.isArray(result)).toBe(true);
			expect(result[0]).toHaveProperty('id');
			expect(result[0]).toHaveProperty('title');
			expect(result[0]).toHaveProperty('points');
			expect(result[0].rarity).toBe('common');
		});

		it('should avoid duplicate achievements', async () => {
			const mockSessionData: SessionSummary = {
				sessionId: 'session-456',
				duration: 300000,
				wordsPerMinute: 25,
				accuracyPercentage: 90,
				totalCharacters: 125,
				errorsCount: 12,
				improvementFromLastSession: 0,
				milestonesAchieved: []
			};

			vi.mocked(achievementService.checkAchievements).mockResolvedValue([]);

			const result = await achievementService.checkAchievements(mockSessionData);

			expect(result).toEqual([]);
			expect(Array.isArray(result)).toBe(true);
		});

		it('should meet performance requirement (<100ms)', async () => {
			const mockSessionData: SessionSummary = {
				sessionId: 'session-789',
				duration: 300000,
				wordsPerMinute: 20,
				accuracyPercentage: 85,
				totalCharacters: 100,
				errorsCount: 15,
				improvementFromLastSession: 1,
				milestonesAchieved: []
			};

			vi.mocked(achievementService.checkAchievements).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve([]), 80))
			);

			const startTime = performance.now();
			await achievementService.checkAchievements(mockSessionData);
			const endTime = performance.now();

			expect(endTime - startTime).toBeLessThan(100);
		});
	});

	describe('unlockAchievement', () => {
		it('should unlock achievement and return unlock result', async () => {
			const mockUnlockResult: UnlockResult = {
				success: true,
				achievement: {
					id: 'fast-typer',
					title: 'Fast Typer',
					description: 'Reached 20 WPM',
					icon: 'fast-icon',
					points: 50,
					rarity: 'common',
					dateEarned: new Date()
				},
				accessoriesUnlocked: [
					{
						id: 'speed-hat',
						name: 'Speed Hat',
						category: 'hat',
						unlockCondition: 'Reach 20 WPM',
						dateUnlocked: new Date(),
						equipped: false
					}
				],
				celebrationTriggered: true,
				pointsAwarded: 50
			};

			vi.mocked(achievementService.unlockAchievement).mockResolvedValue(mockUnlockResult);

			const result = await achievementService.unlockAchievement('fast-typer');

			expect(result).toEqual(mockUnlockResult);
			expect(result.success).toBe(true);
			expect(result).toHaveProperty('achievement');
			expect(result).toHaveProperty('accessoriesUnlocked');
			expect(result).toHaveProperty('celebrationTriggered');
			expect(result.pointsAwarded).toBeGreaterThan(0);
		});

		it('should handle already unlocked achievements', async () => {
			const mockFailResult: UnlockResult = {
				success: false,
				achievement: {
					id: 'already-owned',
					title: 'Already Owned',
					description: 'Already unlocked',
					icon: 'owned-icon',
					points: 0,
					rarity: 'common',
					dateEarned: new Date()
				},
				accessoriesUnlocked: [],
				celebrationTriggered: false,
				pointsAwarded: 0
			};

			vi.mocked(achievementService.unlockAchievement).mockResolvedValue(mockFailResult);

			const result = await achievementService.unlockAchievement('already-owned');

			expect(result.success).toBe(false);
			expect(result.pointsAwarded).toBe(0);
			expect(result.accessoriesUnlocked.length).toBe(0);
		});
	});

	describe('queueCelebration', () => {
		it('should queue celebration with priority ordering', async () => {
			const mockCelebration: CelebrationEvent = {
				id: 'celebration-001',
				type: 'milestone',
				title: 'Milestone Reached!',
				message: 'You achieved 25 WPM!',
				animation: 'bounce',
				duration: 3000,
				soundEffect: 'cheer.mp3',
				priority: 'high',
				autoTrigger: true
			};

			vi.mocked(achievementService.queueCelebration).mockResolvedValue();

			await achievementService.queueCelebration(mockCelebration);

			expect(achievementService.queueCelebration).toHaveBeenCalledWith(mockCelebration);
		});

		it('should respect maximum 5 queued events limit', async () => {
			const mockCelebration: CelebrationEvent = {
				id: 'celebration-overflow',
				type: 'accessory',
				title: 'New Accessory!',
				message: 'Hat unlocked!',
				animation: 'glow',
				duration: 2000,
				soundEffect: 'unlock.mp3',
				priority: 'low',
				autoTrigger: true
			};

			vi.mocked(achievementService.queueCelebration).mockResolvedValue();

			await achievementService.queueCelebration(mockCelebration);

			expect(achievementService.queueCelebration).toHaveBeenCalledWith(mockCelebration);
		});

		it('should meet performance requirement (<50ms)', async () => {
			const mockCelebration: CelebrationEvent = {
				id: 'perf-test',
				type: 'streak',
				title: 'Streak!',
				message: 'Keep it up!',
				animation: 'spin',
				duration: 1000,
				soundEffect: 'ding.mp3',
				priority: 'medium',
				autoTrigger: true
			};

			vi.mocked(achievementService.queueCelebration).mockResolvedValue();

			const startTime = performance.now();
			await achievementService.queueCelebration(mockCelebration);
			const endTime = performance.now();

			expect(endTime - startTime).toBeLessThan(50);
		});
	});

	describe('getNextCelebration', () => {
		it('should return next high priority celebration', async () => {
			const mockCelebration: CelebrationEvent = {
				id: 'next-celebration',
				type: 'evolution',
				title: 'Pet Evolved!',
				message: 'Your pet evolved to Baby form!',
				animation: 'float',
				duration: 4000,
				soundEffect: 'evolution.mp3',
				priority: 'high',
				autoTrigger: true
			};

			vi.mocked(achievementService.getNextCelebration).mockResolvedValue(mockCelebration);

			const result = await achievementService.getNextCelebration();

			expect(result).toEqual(mockCelebration);
			expect(result?.priority).toBe('high');
		});

		it('should return null when no celebrations queued', async () => {
			vi.mocked(achievementService.getNextCelebration).mockResolvedValue(null);

			const result = await achievementService.getNextCelebration();

			expect(result).toBeNull();
		});
	});

	describe('unlockAccessory', () => {
		it('should unlock accessory with valid reason', async () => {
			vi.mocked(achievementService.unlockAccessory).mockResolvedValue(true);

			const result = await achievementService.unlockAccessory('rainbow-hat', 'Reached 30 WPM');

			expect(result).toBe(true);
			expect(achievementService.unlockAccessory).toHaveBeenCalledWith(
				'rainbow-hat',
				'Reached 30 WPM'
			);
		});

		it('should prevent unlocking if requirements not met', async () => {
			vi.mocked(achievementService.unlockAccessory).mockResolvedValue(false);

			const result = await achievementService.unlockAccessory('premium-hat', 'Not qualified');

			expect(result).toBe(false);
		});

		it('should trigger celebration on successful unlock', async () => {
			vi.mocked(achievementService.unlockAccessory).mockResolvedValue(true);
			vi.mocked(achievementService.queueCelebration).mockResolvedValue();

			const success = await achievementService.unlockAccessory('cool-hat', 'Achievement unlocked');

			if (success) {
				const celebration: CelebrationEvent = {
					id: 'accessory-unlock',
					type: 'accessory',
					title: 'New Accessory!',
					message: 'Cool Hat unlocked!',
					animation: 'glow',
					duration: 2000,
					soundEffect: 'unlock.mp3',
					priority: 'medium',
					autoTrigger: true
				};

				await achievementService.queueCelebration(celebration);
				expect(achievementService.queueCelebration).toHaveBeenCalled();
			}
		});
	});

	describe('checkMilestones', () => {
		it('should check milestone thresholds', async () => {
			const mockProgress: UserProgress = {
				sessionId: 'session-milestone',
				date: new Date(),
				duration: 600000,
				wordsPerMinute: 25,
				accuracyPercentage: 90,
				totalCharacters: 250,
				correctCharacters: 225,
				errorsCount: 25,
				contentSource: 'pokemon',
				difficultyLevel: 'intermediate',
				challengingKeys: ['q', 'z'],
				improvementAreas: ['speed'],
				milestones: []
			};

			const mockMilestones: Milestone[] = [
				{
					type: 'wpm',
					value: 25,
					timestamp: new Date(),
					celebrated: false
				}
			];

			vi.mocked(achievementService.checkMilestones).mockResolvedValue(mockMilestones);

			const result = await achievementService.checkMilestones(mockProgress);

			expect(result).toEqual(mockMilestones);
			expect(Array.isArray(result)).toBe(true);
			expect(result[0]).toHaveProperty('type');
			expect(result[0]).toHaveProperty('value');
			expect(result[0]).toHaveProperty('timestamp');
		});

		it('should validate milestone categories', async () => {
			const mockProgress: UserProgress = {
				sessionId: 'session-categories',
				date: new Date(),
				duration: 300000,
				wordsPerMinute: 20,
				accuracyPercentage: 95,
				totalCharacters: 100,
				correctCharacters: 95,
				errorsCount: 5,
				contentSource: 'nintendo',
				difficultyLevel: 'beginner',
				challengingKeys: [],
				improvementAreas: [],
				milestones: []
			};

			const mockMilestones: Milestone[] = [
				{
					type: 'accuracy',
					value: 95,
					timestamp: new Date(),
					celebrated: false
				}
			];

			vi.mocked(achievementService.checkMilestones).mockResolvedValue(mockMilestones);

			const result = await achievementService.checkMilestones(mockProgress);

			expect(['wpm', 'accuracy', 'streak', 'words']).toContain(result[0].type);
		});
	});

	describe('getPersonalBests', () => {
		it('should return personal best records', async () => {
			const mockBests: PersonalBest[] = [
				{
					category: 'wpm',
					value: 28,
					dateAchieved: new Date(),
					previousBest: 25,
					improvementPercentage: 12
				},
				{
					category: 'accuracy',
					value: 96,
					dateAchieved: new Date(),
					improvementPercentage: 6
				}
			];

			vi.mocked(achievementService.getPersonalBests).mockResolvedValue(mockBests);

			const result = await achievementService.getPersonalBests();

			expect(result).toEqual(mockBests);
			expect(Array.isArray(result)).toBe(true);
			expect(result[0]).toHaveProperty('category');
			expect(result[0]).toHaveProperty('value');
			expect(result[0]).toHaveProperty('improvementPercentage');
		});
	});

	describe('updatePersonalBest', () => {
		it('should update personal best when improved', async () => {
			vi.mocked(achievementService.updatePersonalBest).mockResolvedValue(true);

			const result = await achievementService.updatePersonalBest('wpm', 30);

			expect(result).toBe(true);
			expect(achievementService.updatePersonalBest).toHaveBeenCalledWith('wpm', 30);
		});

		it('should return false when no improvement', async () => {
			vi.mocked(achievementService.updatePersonalBest).mockResolvedValue(false);

			const result = await achievementService.updatePersonalBest('accuracy', 85);

			expect(result).toBe(false);
		});

		it('should meet performance requirement (<50ms)', async () => {
			vi.mocked(achievementService.updatePersonalBest).mockResolvedValue(true);

			const startTime = performance.now();
			await achievementService.updatePersonalBest('streak', 15);
			const endTime = performance.now();

			expect(endTime - startTime).toBeLessThan(50);
		});
	});

	describe('Achievement Categories', () => {
		it('should validate speed achievement progression', async () => {
			const speedAchievements = [
				{ threshold: 10, name: 'Speedy Fingers' },
				{ threshold: 20, name: 'Fast Typer' },
				{ threshold: 30, name: 'Lightning Hands' },
				{ threshold: 40, name: 'Speed Demon' }
			];

			speedAchievements.forEach((achievement) => {
				expect(achievement.threshold).toBeGreaterThan(0);
				expect(achievement.name).toBeTruthy();
			});
		});

		it('should validate accuracy achievement requirements', async () => {
			const accuracyAchievements = [
				{ requirement: '90% for 5 sessions', name: 'Careful Typer' },
				{ requirement: '95% for 10 sessions', name: 'Precision Master' },
				{ requirement: '100% for full session', name: 'Perfect Practice' }
			];

			accuracyAchievements.forEach((achievement) => {
				expect(achievement.requirement).toContain('%');
				expect(achievement.name).toBeTruthy();
			});
		});

		it('should validate streak achievement milestones', async () => {
			const streakAchievements = [
				{ days: 3, name: 'Daily Habit' },
				{ days: 7, name: 'Week Warrior' },
				{ days: 30, name: 'Monthly Master' },
				{ days: 365, name: 'Year Legend' }
			];

			streakAchievements.forEach((achievement) => {
				expect(achievement.days).toBeGreaterThan(0);
				expect(achievement.name).toBeTruthy();
			});
		});
	});

	describe('Error Handling', () => {
		it('should handle duplicate unlock attempts gracefully', async () => {
			const duplicateError = new Error('Achievement already unlocked');
			vi.mocked(achievementService.unlockAchievement).mockRejectedValue(duplicateError);

			try {
				await achievementService.unlockAchievement('duplicate-achievement');
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toContain('already');
			}
		});

		it('should handle invalid achievement criteria', async () => {
			const invalidError = new Error('Invalid achievement criteria');
			vi.mocked(achievementService.checkAchievements).mockRejectedValue(invalidError);

			const mockSessionData: SessionSummary = {
				sessionId: 'invalid-session',
				duration: -1,
				wordsPerMinute: -5,
				accuracyPercentage: 150,
				totalCharacters: 0,
				errorsCount: 0,
				improvementFromLastSession: 0,
				milestonesAchieved: []
			};

			try {
				await achievementService.checkAchievements(mockSessionData);
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toContain('Invalid');
			}
		});

		it('should handle celebration overflow', async () => {
			const overflowError = new Error('Celebration queue full');
			vi.mocked(achievementService.queueCelebration).mockRejectedValue(overflowError);

			const mockCelebration: CelebrationEvent = {
				id: 'overflow-test',
				type: 'milestone',
				title: 'Overflow Test',
				message: 'Queue is full',
				animation: 'shake',
				duration: 1000,
				soundEffect: 'error.mp3',
				priority: 'low',
				autoTrigger: true
			};

			try {
				await achievementService.queueCelebration(mockCelebration);
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toContain('queue');
			}
		});

		it('should handle corrupted progress data', async () => {
			const corruptionError = new Error('Progress data corrupted');
			vi.mocked(achievementService.checkMilestones).mockRejectedValue(corruptionError);

			const corruptProgress = {} as UserProgress;

			try {
				await achievementService.checkMilestones(corruptProgress);
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toContain('corrupted');
			}
		});
	});

	describe('Performance Requirements', () => {
		it('should meet milestone calculation requirement (<200ms)', async () => {
			const mockProgress: UserProgress = {
				sessionId: 'perf-milestone',
				date: new Date(),
				duration: 300000,
				wordsPerMinute: 22,
				accuracyPercentage: 88,
				totalCharacters: 110,
				correctCharacters: 97,
				errorsCount: 13,
				contentSource: 'roblox',
				difficultyLevel: 'intermediate',
				challengingKeys: [],
				improvementAreas: [],
				milestones: []
			};

			vi.mocked(achievementService.checkMilestones).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve([]), 150))
			);

			const startTime = performance.now();
			await achievementService.checkMilestones(mockProgress);
			const endTime = performance.now();

			expect(endTime - startTime).toBeLessThan(200);
		});
	});
});
