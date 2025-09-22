/**
 * UserProgress Model with Metrics Calculation
 *
 * Tracks typing performance metrics and learning progression.
 * Includes WPM calculation, accuracy tracking, and improvement analysis.
 */

import type {
	UserProgress,
	MilestoneData,
	SessionSummary,
	TypingTrends,
	TrendData,
	KeyAnalysis,
	ImprovementArea
} from '$lib/types/index.js';

export const DEFAULT_SESSION_SETTINGS = {
	minSessionDuration: 30000, // 30 seconds minimum
	maxSessionDuration: 1800000, // 30 minutes maximum
	wpmCalculationWindow: 60000, // 1 minute window for WPM
	accuracyWeight: 0.75, // 75% weight for accuracy vs speed
	improvementThreshold: 0.05 // 5% improvement threshold
} as const;

export const MILESTONE_THRESHOLDS = {
	wpm: [10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100],
	accuracy: [70, 75, 80, 85, 90, 92, 94, 96, 98, 99],
	streak: [3, 7, 14, 21, 30, 50, 75, 100],
	words: [50, 100, 250, 500, 1000, 2500, 5000, 10000]
} as const;

export class UserProgressModel {
	private _progress: UserProgress;
	private _keystrokeHistory: Array<{
		key: string;
		correct: boolean;
		timestamp: number;
		timeSinceLastKey: number;
	}> = [];

	constructor(progress: Partial<UserProgress>) {
		this._progress = this.validateAndNormalize(progress);
	}

	/**
	 * Get current progress state
	 */
	get progress(): UserProgress {
		return { ...this._progress };
	}

	/**
	 * Get specific properties
	 */
	get sessionId(): string {
		return this._progress.sessionId;
	}

	get wordsPerMinute(): number {
		return this._progress.wordsPerMinute;
	}

	get accuracyPercentage(): number {
		return this._progress.accuracyPercentage;
	}

	get totalCharacters(): number {
		return this._progress.totalCharacters;
	}

	get correctCharacters(): number {
		return this._progress.correctCharacters;
	}

	get errorsCount(): number {
		return this._progress.errorsCount;
	}

	get duration(): number {
		return this._progress.duration;
	}

	get challengingKeys(): string[] {
		return [...this._progress.challengingKeys];
	}

	get milestones(): MilestoneData[] {
		return [...this._progress.milestones];
	}

	/**
	 * Validate and normalize progress data
	 */
	private validateAndNormalize(progress: Partial<UserProgress>): UserProgress {
		const sessionId =
			progress.sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const date =
			progress.date instanceof Date ? progress.date : new Date(progress.date || Date.now());
		const duration = Math.max(0, progress.duration || 0);
		const totalCharacters = Math.max(0, progress.totalCharacters || 0);
		const correctCharacters = Math.max(
			0,
			Math.min(totalCharacters, progress.correctCharacters || 0)
		);
		const errorsCount = Math.max(0, progress.errorsCount || 0);

		// Calculate derived metrics
		const accuracyPercentage =
			totalCharacters > 0 ? Math.round((correctCharacters / totalCharacters) * 100 * 100) / 100 : 0;

		const wordsPerMinute = this.calculateWPM(totalCharacters, duration);

		return {
			sessionId,
			date,
			duration,
			wordsPerMinute,
			accuracyPercentage,
			totalCharacters,
			correctCharacters,
			errorsCount,
			contentSource: progress.contentSource || 'unknown',
			difficultyLevel: progress.difficultyLevel || 'beginner',
			challengingKeys: Array.isArray(progress.challengingKeys) ? [...progress.challengingKeys] : [],
			improvementAreas: Array.isArray(progress.improvementAreas)
				? [...progress.improvementAreas]
				: [],
			milestones: Array.isArray(progress.milestones) ? [...progress.milestones] : []
		};
	}

	/**
	 * Calculate Words Per Minute
	 */
	private calculateWPM(characters: number, durationMs: number): number {
		if (durationMs <= 0) return 0;

		// Standard calculation: (characters / 5) / (minutes)
		// 5 characters = 1 word (industry standard)
		const words = characters / 5;
		const minutes = durationMs / 60000;

		return Math.round((words / minutes) * 100) / 100;
	}

	/**
	 * Record a keystroke
	 */
	recordKeystroke(key: string, correct: boolean, timestamp: number): void {
		const lastKeystroke = this._keystrokeHistory[this._keystrokeHistory.length - 1];
		const timeSinceLastKey = lastKeystroke ? timestamp - lastKeystroke.timestamp : 0;

		this._keystrokeHistory.push({
			key,
			correct,
			timestamp,
			timeSinceLastKey
		});

		// Update totals
		this._progress.totalCharacters++;
		if (correct) {
			this._progress.correctCharacters++;
		} else {
			this._progress.errorsCount++;
		}

		// Recalculate derived metrics
		this._progress.accuracyPercentage =
			this._progress.totalCharacters > 0
				? Math.round(
						(this._progress.correctCharacters / this._progress.totalCharacters) * 100 * 100
					) / 100
				: 0;

		// Update duration
		if (this._keystrokeHistory.length > 1) {
			const firstKeystroke = this._keystrokeHistory[0];
			this._progress.duration = timestamp - firstKeystroke.timestamp;
			this._progress.wordsPerMinute = this.calculateWPM(
				this._progress.totalCharacters,
				this._progress.duration
			);
		}

		// Update challenging keys analysis
		this.updateChallengingKeys();
	}

	/**
	 * Update challenging keys based on error patterns
	 */
	private updateChallengingKeys(): void {
		const keyErrors: Record<string, { attempts: number; errors: number }> = {};

		// Analyze recent keystrokes (last 100 or all if fewer)
		const recentKeystrokes = this._keystrokeHistory.slice(-100);

		recentKeystrokes.forEach((keystroke) => {
			if (!keyErrors[keystroke.key]) {
				keyErrors[keystroke.key] = { attempts: 0, errors: 0 };
			}
			keyErrors[keystroke.key].attempts++;
			if (!keystroke.correct) {
				keyErrors[keystroke.key].errors++;
			}
		});

		// Identify keys with error rate > 20% and minimum attempts
		const challengingKeys = Object.entries(keyErrors)
			.filter(([, stats]) => {
				const errorRate = stats.errors / stats.attempts;
				return stats.attempts >= 5 && errorRate > 0.2;
			})
			.map(([key]) => key)
			.slice(0, 10); // Limit to top 10

		this._progress.challengingKeys = challengingKeys;
	}

	/**
	 * Calculate real-time WPM over a time window
	 */
	calculateRealtimeWPM(windowMs: number = DEFAULT_SESSION_SETTINGS.wpmCalculationWindow): number {
		if (this._keystrokeHistory.length === 0) return 0;

		const now = Date.now();
		const cutoffTime = now - windowMs;

		const recentKeystrokes = this._keystrokeHistory.filter(
			(keystroke) => keystroke.timestamp >= cutoffTime
		);

		if (recentKeystrokes.length === 0) return 0;

		const characters = recentKeystrokes.length;
		const actualDuration = Math.max(windowMs, now - recentKeystrokes[0].timestamp);

		return this.calculateWPM(characters, actualDuration);
	}

	/**
	 * Calculate typing rhythm and consistency
	 */
	calculateTypingRhythm(): {
		averageKeyInterval: number;
		rhythmConsistency: number;
		burstTyping: boolean;
	} {
		if (this._keystrokeHistory.length < 10) {
			return { averageKeyInterval: 0, rhythmConsistency: 0, burstTyping: false };
		}

		const intervals = this._keystrokeHistory
			.slice(1) // Skip first keystroke (no interval)
			.map((keystroke) => keystroke.timeSinceLastKey)
			.filter((interval) => interval > 0 && interval < 2000); // Filter out pauses

		if (intervals.length === 0) {
			return { averageKeyInterval: 0, rhythmConsistency: 0, burstTyping: false };
		}

		const averageKeyInterval =
			intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;

		// Calculate standard deviation for consistency
		const variance =
			intervals.reduce((sum, interval) => {
				return sum + Math.pow(interval - averageKeyInterval, 2);
			}, 0) / intervals.length;

		const standardDeviation = Math.sqrt(variance);
		const rhythmConsistency = Math.max(0, 100 - (standardDeviation / averageKeyInterval) * 100);

		// Detect burst typing (many fast keystrokes followed by pauses)
		const fastIntervals = intervals.filter(
			(interval) => interval < averageKeyInterval * 0.5
		).length;
		const burstTyping = fastIntervals / intervals.length > 0.3;

		return {
			averageKeyInterval: Math.round(averageKeyInterval),
			rhythmConsistency: Math.round(rhythmConsistency),
			burstTyping
		};
	}

	/**
	 * Check for milestone achievements
	 */
	checkMilestones(): MilestoneData[] {
		const newMilestones: MilestoneData[] = [];
		const existingMilestoneValues = new Set(
			this._progress.milestones.map((m) => `${m.type}-${m.value}`)
		);

		// Check WPM milestones
		const currentWPM = Math.floor(this._progress.wordsPerMinute);
		MILESTONE_THRESHOLDS.wpm.forEach((threshold) => {
			if (currentWPM >= threshold && !existingMilestoneValues.has(`wpm-${threshold}`)) {
				newMilestones.push({
					type: 'wpm',
					value: threshold,
					timestamp: new Date(),
					celebrated: false
				});
			}
		});

		// Check accuracy milestones
		const currentAccuracy = Math.floor(this._progress.accuracyPercentage);
		MILESTONE_THRESHOLDS.accuracy.forEach((threshold) => {
			if (currentAccuracy >= threshold && !existingMilestoneValues.has(`accuracy-${threshold}`)) {
				newMilestones.push({
					type: 'accuracy',
					value: threshold,
					timestamp: new Date(),
					celebrated: false
				});
			}
		});

		// Add new milestones to progress
		this._progress.milestones.push(...newMilestones);

		return newMilestones;
	}

	/**
	 * Generate detailed key analysis
	 */
	generateKeyAnalysis(): KeyAnalysis[] {
		const keyStats: Record<
			string,
			{ attempts: number; errors: number; avgInterval: number; intervals: number[] }
		> = {};

		this._keystrokeHistory.forEach((keystroke) => {
			if (!keyStats[keystroke.key]) {
				keyStats[keystroke.key] = { attempts: 0, errors: 0, avgInterval: 0, intervals: [] };
			}

			keyStats[keystroke.key].attempts++;
			if (!keystroke.correct) {
				keyStats[keystroke.key].errors++;
			}

			if (keystroke.timeSinceLastKey > 0) {
				keyStats[keystroke.key].intervals.push(keystroke.timeSinceLastKey);
			}
		});

		return Object.entries(keyStats)
			.filter(([, stats]) => stats.attempts >= 3) // Minimum attempts for analysis
			.map(([key, stats]) => {
				const errorRate = (stats.errors / stats.attempts) * 100;
				const avgInterval =
					stats.intervals.length > 0
						? stats.intervals.reduce((sum, interval) => sum + interval, 0) / stats.intervals.length
						: 0;

				// Determine trend based on recent performance
				const recentAttempts = this._keystrokeHistory.slice(-50).filter((k) => k.key === key);
				const recentErrorRate =
					recentAttempts.length > 0
						? (recentAttempts.filter((k) => !k.correct).length / recentAttempts.length) * 100
						: errorRate;

				let improvementTrend: 'improving' | 'stable' | 'declining';
				if (recentErrorRate < errorRate * 0.8) {
					improvementTrend = 'improving';
				} else if (recentErrorRate > errorRate * 1.2) {
					improvementTrend = 'declining';
				} else {
					improvementTrend = 'stable';
				}

				// Generate practice recommendation
				let practiceRecommendation = '';
				if (errorRate > 20) {
					practiceRecommendation = `Focus on accuracy for '${key}' key - slow down and ensure correct finger placement`;
				} else if (avgInterval > 500) {
					practiceRecommendation = `Practice '${key}' key for speed - work on muscle memory and finger positioning`;
				} else {
					practiceRecommendation = `Good performance on '${key}' key - maintain current technique`;
				}

				return {
					key,
					errorRate: Math.round(errorRate * 100) / 100,
					attempts: stats.attempts,
					improvementTrend,
					practiceRecommendation
				};
			})
			.sort((a, b) => b.errorRate - a.errorRate); // Sort by highest error rate first
	}

	/**
	 * Generate improvement suggestions
	 */
	generateImprovementSuggestions(): ImprovementArea[] {
		const suggestions: ImprovementArea[] = [];
		const rhythm = this.calculateTypingRhythm();

		// Accuracy-based suggestions
		if (this._progress.accuracyPercentage < 85) {
			suggestions.push({
				area: 'Accuracy',
				description: 'Focus on typing correctly rather than fast',
				priority: 'high',
				recommendation:
					'Slow down and concentrate on hitting the right keys. Accuracy is more important than speed for building muscle memory.'
			});
		}

		// Speed-based suggestions
		if (this._progress.wordsPerMinute < 20 && this._progress.accuracyPercentage > 90) {
			suggestions.push({
				area: 'Typing Speed',
				description: 'Work on increasing your typing speed',
				priority: 'medium',
				recommendation:
					'Practice typing common word patterns and letter combinations to build speed while maintaining accuracy.'
			});
		}

		// Rhythm-based suggestions
		if (!rhythm.burstTyping && rhythm.rhythmConsistency < 70) {
			suggestions.push({
				area: 'Typing Rhythm',
				description: 'Develop a more consistent typing rhythm',
				priority: 'medium',
				recommendation:
					'Practice typing to a steady beat or metronome to develop consistent finger movements.'
			});
		}

		if (rhythm.burstTyping) {
			suggestions.push({
				area: 'Typing Flow',
				description: 'Avoid burst typing patterns',
				priority: 'medium',
				recommendation:
					'Focus on maintaining a steady typing pace rather than rushing through sections and then pausing.'
			});
		}

		// Key-specific suggestions
		if (this._progress.challengingKeys.length > 5) {
			suggestions.push({
				area: 'Problem Keys',
				description: `Multiple challenging keys identified: ${this._progress.challengingKeys.slice(0, 3).join(', ')}`,
				priority: 'high',
				recommendation:
					'Practice these specific keys with dedicated exercises focusing on proper finger placement.'
			});
		}

		return suggestions.slice(0, 5); // Limit to top 5 suggestions
	}

	/**
	 * Generate session summary
	 */
	generateSessionSummary(previousSessions?: UserProgress[]): SessionSummary {
		let improvementFromLastSession = 0;

		if (previousSessions && previousSessions.length > 0) {
			const lastSession = previousSessions[previousSessions.length - 1];
			const wpmImprovement = this._progress.wordsPerMinute - lastSession.wordsPerMinute;
			const accuracyImprovement =
				this._progress.accuracyPercentage - lastSession.accuracyPercentage;

			// Weighted improvement calculation (accuracy weighted more heavily)
			improvementFromLastSession = wpmImprovement * 0.4 + accuracyImprovement * 0.6;
		}

		const newMilestones = this.checkMilestones();

		return {
			sessionId: this._progress.sessionId,
			duration: this._progress.duration,
			wordsPerMinute: this._progress.wordsPerMinute,
			accuracyPercentage: this._progress.accuracyPercentage,
			totalCharacters: this._progress.totalCharacters,
			errorsCount: this._progress.errorsCount,
			improvementFromLastSession: Math.round(improvementFromLastSession * 100) / 100,
			milestonesAchieved: newMilestones
		};
	}

	/**
	 * Calculate typing trends over time
	 */
	static calculateTypingTrends(sessions: UserProgress[], days: number = 30): TypingTrends {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - days);

		const recentSessions = sessions
			.filter((session) => session.date >= cutoffDate)
			.sort((a, b) => a.date.getTime() - b.date.getTime());

		if (recentSessions.length === 0) {
			return {
				wpmTrend: [],
				accuracyTrend: [],
				practiceTimeTrend: [],
				improvementRate: 0
			};
		}

		// Create trend data with moving averages
		const wpmTrend: TrendData[] = [];
		const accuracyTrend: TrendData[] = [];
		const practiceTimeTrend: TrendData[] = [];

		recentSessions.forEach((session, index) => {
			// Calculate moving average over last 5 sessions
			const windowStart = Math.max(0, index - 4);
			const windowSessions = recentSessions.slice(windowStart, index + 1);

			const avgWPM =
				windowSessions.reduce((sum, s) => sum + s.wordsPerMinute, 0) / windowSessions.length;
			const avgAccuracy =
				windowSessions.reduce((sum, s) => sum + s.accuracyPercentage, 0) / windowSessions.length;
			const avgDuration =
				windowSessions.reduce((sum, s) => sum + s.duration, 0) / windowSessions.length;

			wpmTrend.push({
				date: session.date,
				value: session.wordsPerMinute,
				movingAverage: Math.round(avgWPM * 100) / 100
			});

			accuracyTrend.push({
				date: session.date,
				value: session.accuracyPercentage,
				movingAverage: Math.round(avgAccuracy * 100) / 100
			});

			practiceTimeTrend.push({
				date: session.date,
				value: session.duration / 60000, // Convert to minutes
				movingAverage: Math.round((avgDuration / 60000) * 100) / 100
			});
		});

		// Calculate overall improvement rate
		const firstSession = recentSessions[0];
		const lastSession = recentSessions[recentSessions.length - 1];
		const wpmImprovement = lastSession.wordsPerMinute - firstSession.wordsPerMinute;
		const accuracyImprovement = lastSession.accuracyPercentage - firstSession.accuracyPercentage;
		const improvementRate = wpmImprovement * 0.6 + accuracyImprovement * 0.4;

		return {
			wpmTrend,
			accuracyTrend,
			practiceTimeTrend,
			improvementRate: Math.round(improvementRate * 100) / 100
		};
	}

	/**
	 * Export progress for persistence
	 */
	toJSON(): UserProgress {
		return { ...this._progress };
	}

	/**
	 * Create instance from persisted data
	 */
	static fromJSON(data: unknown): UserProgressModel {
		if (!data || typeof data !== 'object') {
			throw new Error('Invalid user progress data');
		}

		// Convert date strings back to Date objects if needed
		const convertedData = { ...data } as Partial<UserProgress> & { [key: string]: unknown };

		if (convertedData.date && typeof convertedData.date === 'string') {
			convertedData.date = new Date(convertedData.date);
		}

		if (convertedData.milestones && Array.isArray(convertedData.milestones)) {
			convertedData.milestones.forEach((milestone: unknown) => {
				const typedMilestone = milestone as { timestamp?: unknown; [key: string]: unknown };
				if (typedMilestone.timestamp && typeof typedMilestone.timestamp === 'string') {
					typedMilestone.timestamp = new Date(typedMilestone.timestamp);
				}
			});
		}

		return new UserProgressModel(convertedData);
	}

	/**
	 * Validate progress state integrity
	 */
	validateState(): { isValid: boolean; errors: string[] } {
		const errors: string[] = [];

		if (!this._progress.sessionId || typeof this._progress.sessionId !== 'string') {
			errors.push('Session ID is required and must be a string');
		}

		if (this._progress.duration < 0) {
			errors.push('Duration cannot be negative');
		}

		if (this._progress.totalCharacters < 0) {
			errors.push('Total characters cannot be negative');
		}

		if (
			this._progress.correctCharacters < 0 ||
			this._progress.correctCharacters > this._progress.totalCharacters
		) {
			errors.push('Correct characters must be between 0 and total characters');
		}

		if (this._progress.accuracyPercentage < 0 || this._progress.accuracyPercentage > 100) {
			errors.push('Accuracy percentage must be between 0 and 100');
		}

		if (this._progress.wordsPerMinute < 0) {
			errors.push('Words per minute cannot be negative');
		}

		if (!(this._progress.date instanceof Date)) {
			errors.push('Date must be a valid Date object');
		}

		return {
			isValid: errors.length === 0,
			errors
		};
	}
}
