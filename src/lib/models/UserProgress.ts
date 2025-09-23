/**
 * @fileoverview UserProgress Model with Metrics Calculation
 *
 * Comprehensive typing performance tracking and analysis system for the
 * gamified typing trainer. Monitors real-time keystroke data, calculates
 * performance metrics, identifies improvement areas, and provides detailed
 * analytics for young learners aged 7-12.
 *
 * Features include WPM calculation, accuracy tracking, keystroke analysis,
 * milestone detection, and personalized improvement recommendations.
 *
 * @module UserProgressModel
 * @since 1.0.0
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

/**
 * Default session configuration settings for progress tracking.
 * Controls session duration limits, calculation windows, and weighting factors.
 *
 * @constant DEFAULT_SESSION_SETTINGS
 * @property {number} minSessionDuration - Minimum session duration in ms (30 seconds)
 * @property {number} maxSessionDuration - Maximum session duration in ms (30 minutes)
 * @property {number} wpmCalculationWindow - Time window for real-time WPM calculation (1 minute)
 * @property {number} accuracyWeight - Weight given to accuracy vs speed (0.75 = 75%)
 * @property {number} improvementThreshold - Minimum improvement threshold (5%)
 * @example
 * const minTime = DEFAULT_SESSION_SETTINGS.minSessionDuration; // 30000ms
 * if (sessionDuration < minTime) {
 *   console.log('Session too short for meaningful data');
 * }
 * @since 1.0.0
 */
export const DEFAULT_SESSION_SETTINGS = {
	minSessionDuration: 30000, // 30 seconds minimum
	maxSessionDuration: 1800000, // 30 minutes maximum
	wpmCalculationWindow: 60000, // 1 minute window for WPM
	accuracyWeight: 0.75, // 75% weight for accuracy vs speed
	improvementThreshold: 0.05 // 5% improvement threshold
} as const;

/**
 * Milestone threshold values for different performance metrics.
 * Used to detect and celebrate achievement milestones in typing progress.
 *
 * @constant MILESTONE_THRESHOLDS
 * @property {number[]} wpm - Words per minute milestone thresholds
 * @property {number[]} accuracy - Accuracy percentage milestone thresholds
 * @property {number[]} streak - Practice streak day milestone thresholds
 * @property {number[]} words - Total words typed milestone thresholds
 * @example
 * const nextWpmGoal = MILESTONE_THRESHOLDS.wpm.find(threshold => userWPM < threshold);
 * console.log(`Next WPM goal: ${nextWpmGoal}`);
 *
 * // Check if user hit accuracy milestone
 * const accuracyMilestones = MILESTONE_THRESHOLDS.accuracy.filter(t => userAccuracy >= t);
 * @see {@link MilestoneData} for milestone data structure
 * @since 1.0.0
 */
export const MILESTONE_THRESHOLDS = {
	wpm: [10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100],
	accuracy: [70, 75, 80, 85, 90, 92, 94, 96, 98, 99],
	streak: [3, 7, 14, 21, 30, 50, 75, 100],
	words: [50, 100, 250, 500, 1000, 2500, 5000, 10000]
} as const;

/**
 * Model class for tracking and analyzing typing performance and progress.
 * Provides real-time keystroke analysis, performance metrics calculation,
 * milestone detection, and improvement recommendations for young learners.
 *
 * @class UserProgressModel
 * @example
 * // Create a new typing session
 * const progress = new UserProgressModel({
 *   sessionId: 'session-123',
 *   contentSource: 'pokemon'
 * });
 *
 * // Record keystrokes during typing
 * progress.recordKeystroke('h', true, Date.now());
 * progress.recordKeystroke('e', true, Date.now() + 200);
 * progress.recordKeystroke('l', false, Date.now() + 400); // Error
 *
 * // Get real-time metrics
 * const wpm = progress.calculateRealtimeWPM();
 * const rhythm = progress.calculateTypingRhythm();
 * const suggestions = progress.generateImprovementSuggestions();
 * @since 1.0.0
 */
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
	 * Get a deep copy of the current progress data.
	 * Returns immutable copy to prevent external modifications.
	 *
	 * @returns {UserProgress} Complete progress data with all metrics
	 * @example
	 * const currentProgress = model.progress;
	 * console.log(`WPM: ${currentProgress.wordsPerMinute}, Accuracy: ${currentProgress.accuracyPercentage}%`);
	 * @since 1.0.0
	 */
	get progress(): UserProgress {
		return { ...this._progress };
	}

	/**
	 * Get the unique identifier for this typing session.
	 *
	 * @returns {string} Session's unique ID
	 * @example
	 * const sessionId = model.sessionId; // 'session-1234567890-abc123'
	 * @since 1.0.0
	 */
	get sessionId(): string {
		return this._progress.sessionId;
	}

	/**
	 * Get the current calculated words per minute typing speed.
	 * Based on total characters typed divided by session duration.
	 *
	 * @returns {number} Current WPM (calculated as characters/5/minutes)
	 * @example
	 * const speed = model.wordsPerMinute; // 23.45
	 * console.log(`Current speed: ${speed.toFixed(1)} WPM`);
	 * @since 1.0.0
	 */
	get wordsPerMinute(): number {
		return this._progress.wordsPerMinute;
	}

	/**
	 * Get the current typing accuracy percentage.
	 * Calculated as (correct characters / total characters) * 100.
	 *
	 * @returns {number} Accuracy percentage (0-100)
	 * @example
	 * const accuracy = model.accuracyPercentage; // 87.65
	 * console.log(`Accuracy: ${accuracy.toFixed(1)}%`);
	 * @since 1.0.0
	 */
	get accuracyPercentage(): number {
		return this._progress.accuracyPercentage;
	}

	/**
	 * Get the total number of characters typed in this session.
	 * Includes both correct and incorrect keystrokes.
	 *
	 * @returns {number} Total character count
	 * @example
	 * const total = model.totalCharacters; // 127
	 * console.log(`${total} characters typed so far`);
	 * @since 1.0.0
	 */
	get totalCharacters(): number {
		return this._progress.totalCharacters;
	}

	/**
	 * Get the number of correctly typed characters in this session.
	 * Used for accuracy calculations and progress tracking.
	 *
	 * @returns {number} Correct character count
	 * @example
	 * const correct = model.correctCharacters; // 111
	 * const total = model.totalCharacters;     // 127
	 * const accuracy = (correct / total) * 100; // 87.4%
	 * @since 1.0.0
	 */
	get correctCharacters(): number {
		return this._progress.correctCharacters;
	}

	/**
	 * Get the total number of typing errors in this session.
	 * Represents incorrect keystrokes that need correction.
	 *
	 * @returns {number} Total error count
	 * @example
	 * const errors = model.errorsCount; // 16
	 * console.log(`${errors} errors made this session`);
	 * @since 1.0.0
	 */
	get errorsCount(): number {
		return this._progress.errorsCount;
	}

	/**
	 * Get the total duration of the typing session in milliseconds.
	 * Calculated from first keystroke to most recent keystroke.
	 *
	 * @returns {number} Session duration in milliseconds
	 * @example
	 * const durationMs = model.duration;  // 125000
	 * const durationMin = durationMs / 60000; // 2.08 minutes
	 * console.log(`Session lasted ${durationMin.toFixed(1)} minutes`);
	 * @since 1.0.0
	 */
	get duration(): number {
		return this._progress.duration;
	}

	/**
	 * Get a copy of keys that are consistently typed incorrectly.
	 * Automatically identified based on error patterns and frequency.
	 *
	 * @returns {string[]} Array of challenging key characters
	 * @example
	 * const problemKeys = model.challengingKeys; // ['q', 'z', 'x']
	 * if (problemKeys.length > 0) {
	 *   console.log(`Practice these keys: ${problemKeys.join(', ')}`);
	 * }
	 * @see {@link updateChallengingKeys} for analysis logic
	 * @since 1.0.0
	 */
	get challengingKeys(): string[] {
		return [...this._progress.challengingKeys];
	}

	/**
	 * Get a copy of all milestones achieved in this session.
	 * Milestones are automatically detected based on performance thresholds.
	 *
	 * @returns {MilestoneData[]} Array of achieved milestones
	 * @example
	 * const achievements = model.milestones;
	 * achievements.forEach(milestone => {
	 *   console.log(`Achieved ${milestone.type}: ${milestone.value}`);
	 * });
	 * @see {@link MilestoneData} for milestone structure
	 * @see {@link MILESTONE_THRESHOLDS} for threshold values
	 * @since 1.0.0
	 */
	get milestones(): MilestoneData[] {
		return [...this._progress.milestones];
	}

	/**
	 * Validate and normalize progress data to ensure data integrity.
	 * Calculates derived metrics and provides safe defaults for missing values.
	 *
	 * @private
	 * @param {Partial<UserProgress>} progress - Raw progress data to validate
	 * @returns {UserProgress} Validated and normalized progress data
	 * @example
	 * // Internal use only - called by constructor
	 * const safeProgress = this.validateAndNormalize(rawData);
	 * @since 1.0.0
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
	 * Calculate typing speed in words per minute using industry standard formula.
	 * Uses 5 characters = 1 word conversion for consistent measurement.
	 *
	 * @private
	 * @param {number} characters - Total characters typed
	 * @param {number} durationMs - Duration in milliseconds
	 * @returns {number} Words per minute (rounded to 2 decimal places)
	 * @example
	 * // Internal use only
	 * const wpm = this.calculateWPM(300, 60000); // 60 WPM for 300 chars in 1 minute
	 * @since 1.0.0
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
	 * Record a single keystroke with timing and accuracy data.
	 * Updates all derived metrics and maintains keystroke history for analysis.
	 *
	 * @param {string} key - The character that was typed
	 * @param {boolean} correct - Whether the keystroke was correct
	 * @param {number} timestamp - Timestamp of the keystroke in milliseconds
	 * @example
	 * // Record correct keystrokes
	 * progress.recordKeystroke('h', true, Date.now());
	 * progress.recordKeystroke('e', true, Date.now() + 150);
	 *
	 * // Record an error
	 * progress.recordKeystroke('l', false, Date.now() + 300);
	 *
	 * // Metrics are automatically updated
	 * console.log(`Current WPM: ${progress.wordsPerMinute}`);
	 * console.log(`Accuracy: ${progress.accuracyPercentage}%`);
	 * @since 1.0.0
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
	 * Analyze keystroke patterns to identify consistently problematic keys.
	 * Uses error rate and frequency analysis over recent keystrokes.
	 *
	 * @private
	 * @example
	 * // Internal use only - called automatically by recordKeystroke
	 * this.updateChallengingKeys();
	 *
	 * // Keys with >20% error rate and >5 attempts are flagged
	 * // Limited to top 10 most problematic keys
	 * @since 1.0.0
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
	 * Calculate real-time words per minute over a sliding time window.
	 * Provides more responsive WPM updates than session-total calculations.
	 *
	 * @param {number} [windowMs=DEFAULT_SESSION_SETTINGS.wpmCalculationWindow] - Time window in milliseconds
	 * @returns {number} Real-time WPM for the specified time window
	 * @example
	 * // Get WPM for last minute (default)
	 * const currentWPM = progress.calculateRealtimeWPM();
	 *
	 * // Get WPM for last 30 seconds
	 * const recentWPM = progress.calculateRealtimeWPM(30000);
	 *
	 * console.log(`Current burst: ${currentWPM.toFixed(1)} WPM`);
	 * @since 1.0.0
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
	 * Analyze typing rhythm patterns and consistency metrics.
	 * Identifies typing style characteristics for personalized feedback.
	 *
	 * @returns {object} Rhythm analysis data
	 * @returns {number} returns.averageKeyInterval - Average time between keystrokes (ms)
	 * @returns {number} returns.rhythmConsistency - Consistency score (0-100)
	 * @returns {boolean} returns.burstTyping - Whether user types in bursts
	 * @example
	 * const rhythm = progress.calculateTypingRhythm();
	 * console.log(`Average interval: ${rhythm.averageKeyInterval}ms`);
	 * console.log(`Consistency: ${rhythm.rhythmConsistency}%`);
	 *
	 * if (rhythm.burstTyping) {
	 *   console.log('User tends to type in bursts rather than steadily');
	 * }
	 * @since 1.0.0
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
	 * Check current performance against milestone thresholds and detect new achievements.
	 * Automatically identifies WPM and accuracy milestones reached in this session.
	 *
	 * @returns {MilestoneData[]} Array of newly achieved milestones
	 * @example
	 * const newMilestones = progress.checkMilestones();
	 * newMilestones.forEach(milestone => {
	 *   console.log(`🎉 Reached ${milestone.type} milestone: ${milestone.value}!`);
	 *   celebrateMilestone(milestone);
	 * });
	 *
	 * // Check if any speed milestones were hit
	 * const speedMilestones = newMilestones.filter(m => m.type === 'wpm');
	 * @see {@link MILESTONE_THRESHOLDS} for threshold values
	 * @see {@link MilestoneData} for milestone structure
	 * @since 1.0.0
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
	 * Generate detailed per-key performance analysis with improvement recommendations.
	 * Analyzes error rates, timing patterns, and trends for each key typed.
	 *
	 * @returns {KeyAnalysis[]} Array of key performance analyses, sorted by error rate
	 * @example
	 * const keyAnalysis = progress.generateKeyAnalysis();
	 * keyAnalysis.forEach(analysis => {
	 *   console.log(`Key '${analysis.key}': ${analysis.errorRate}% error rate`);
	 *   console.log(`Trend: ${analysis.improvementTrend}`);
	 *   console.log(`Tip: ${analysis.practiceRecommendation}`);
	 * });
	 *
	 * // Find keys that need the most work
	 * const problemKeys = keyAnalysis.filter(k => k.errorRate > 15);
	 * @see {@link KeyAnalysis} for analysis structure
	 * @since 1.0.0
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
	 * Generate personalized improvement suggestions based on performance analysis.
	 * Provides actionable recommendations for accuracy, speed, rhythm, and specific keys.
	 *
	 * @returns {ImprovementArea[]} Array of improvement suggestions, prioritized by importance
	 * @example
	 * const suggestions = progress.generateImprovementSuggestions();
	 * suggestions.forEach(suggestion => {
	 *   console.log(`${suggestion.priority.toUpperCase()}: ${suggestion.area}`);
	 *   console.log(suggestion.description);
	 *   console.log(`💡 ${suggestion.recommendation}`);
	 * });
	 *
	 * // Show only high-priority suggestions
	 * const urgent = suggestions.filter(s => s.priority === 'high');
	 * @see {@link ImprovementArea} for suggestion structure
	 * @since 1.0.0
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
	 * Generate a comprehensive summary of the current typing session.
	 * Compares performance with previous sessions and identifies new milestones.
	 *
	 * @param {UserProgress[]} [previousSessions] - Previous session data for comparison
	 * @returns {SessionSummary} Complete session summary with metrics and improvements
	 * @example
	 * const summary = progress.generateSessionSummary(previousSessions);
	 * console.log(`Session Summary:`);
	 * console.log(`- WPM: ${summary.wordsPerMinute}`);
	 * console.log(`- Accuracy: ${summary.accuracyPercentage}%`);
	 * console.log(`- Duration: ${(summary.duration / 60000).toFixed(1)} minutes`);
	 * console.log(`- Improvement: ${summary.improvementFromLastSession.toFixed(1)}`);
	 *
	 * if (summary.milestonesAchieved.length > 0) {
	 *   console.log(`🎉 Milestones: ${summary.milestonesAchieved.length}`);
	 * }
	 * @see {@link SessionSummary} for summary structure
	 * @since 1.0.0
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
	 * Calculate typing performance trends over a specified time period.
	 * Analyzes progression patterns and provides moving averages for trend analysis.
	 *
	 * @static
	 * @param {UserProgress[]} sessions - Array of session data to analyze
	 * @param {number} [days=30] - Number of days to include in analysis
	 * @returns {TypingTrends} Comprehensive trend analysis with moving averages
	 * @example
	 * const trends = UserProgressModel.calculateTypingTrends(allSessions, 14);
	 * console.log(`Overall improvement rate: ${trends.improvementRate}`);
	 *
	 * // Plot WPM trend over time
	 * trends.wpmTrend.forEach(point => {
	 *   console.log(`${point.date.toLocaleDateString()}: ${point.value} WPM (avg: ${point.movingAverage})`);
	 * });
	 *
	 * // Check recent accuracy trend
	 * const recentAccuracy = trends.accuracyTrend.slice(-5);
	 * @see {@link TypingTrends} for trend data structure
	 * @see {@link TrendData} for individual trend points
	 * @since 1.0.0
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
	 * Export the current progress data for persistence to storage.
	 * Returns a plain object suitable for JSON serialization.
	 *
	 * @returns {UserProgress} Plain object representation of progress
	 * @example
	 * const progressData = progress.toJSON();
	 * localStorage.setItem('session-progress', JSON.stringify(progressData));
	 *
	 * // Save to database
	 * await saveProgressToDatabase(progressData);
	 * @since 1.0.0
	 */
	toJSON(): UserProgress {
		return { ...this._progress };
	}

	/**
	 * Create a UserProgressModel instance from persisted JSON data.
	 * Handles date deserialization and milestone data restoration.
	 *
	 * @static
	 * @param {unknown} data - Raw data from storage (JSON parsed)
	 * @returns {UserProgressModel} New model instance with restored progress
	 * @throws {Error} When data is invalid or corrupted
	 * @example
	 * const savedData = JSON.parse(localStorage.getItem('session-progress'));
	 * const progress = UserProgressModel.fromJSON(savedData);
	 *
	 * // Handle missing data gracefully
	 * try {
	 *   const progress = UserProgressModel.fromJSON(data);
	 *   console.log(`Restored session: ${progress.sessionId}`);
	 * } catch (error) {
	 *   console.error('Failed to load progress:', error);
	 *   const progress = new UserProgressModel({}); // Fresh session
	 * }
	 * @since 1.0.0
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
	 * Validate the current state of the progress data for integrity issues.
	 * Performs comprehensive checks on all metrics and relationships.
	 *
	 * @returns {object} Validation result
	 * @returns {boolean} returns.isValid - True if all validations pass
	 * @returns {string[]} returns.errors - Array of validation error messages
	 * @example
	 * const validation = progress.validateState();
	 * if (!validation.isValid) {
	 *   console.error('Progress data has issues:');
	 *   validation.errors.forEach(error => console.error(`- ${error}`));
	 * }
	 *
	 * // Use for debugging or data migration
	 * if (validation.isValid) {
	 *   saveProgressData(progress.toJSON());
	 * } else {
	 *   reportDataCorruption(validation.errors);
	 *   // Try to recover or reset progress
	 * }
	 *
	 * // Automated validation in production
	 * setInterval(() => {
	 *   const check = progress.validateState();
	 *   if (!check.isValid) {
	 *     logDataIntegrityIssues(check.errors);
	 *   }
	 * }, 60000); // Check every minute
	 * @since 1.0.0
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
