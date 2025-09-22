/**
 * ProgressTrackingService Implementation
 *
 * Handles typing session tracking, metrics calculation, and progress analysis
 * for the gamified typing trainer. Provides real-time keypress recording,
 * WPM/accuracy calculations, trend analysis, and improvement suggestions.
 */

import type {
	ProgressTrackingService as IProgressTrackingService,
	SessionId,
	SessionSummary,
	TimeSpan,
	TypingTrends,
	KeyAnalysis,
	ImprovementArea,
	MilestoneData,
	TimeRange,
	ProgressReport,
	ParentSummary,
	UserProgress
} from '$lib/types/index.js';
import { UserProgressModel } from '$lib/models/UserProgress.js';
import { dbManager } from '$lib/storage/db.js';

interface ActiveSession {
	sessionId: SessionId;
	contentId: string;
	startTime: Date;
	keypresses: Array<{
		key: string;
		isCorrect: boolean;
		timestamp: number;
	}>;
	model: UserProgressModel;
}

export class ProgressTrackingService implements IProgressTrackingService {
	private activeSession: ActiveSession | null = null;
	private keypressBatch: Array<{ key: string; isCorrect: boolean; timestamp: number }> = [];
	private batchFlushTimeout: number | null = null;

	/**
	 * Start new typing session with performance tracking
	 */
	async startSession(contentId: string): Promise<SessionId> {
		const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const startTime = new Date();

		// Create new session model
		const model = new UserProgressModel({
			sessionId,
			contentSource: this.extractSourceFromContentId(contentId),
			date: startTime,
			totalCharacters: 0,
			correctCharacters: 0,
			duration: 0,
			wordsPerMinute: 0,
			accuracyPercentage: 0,
			errorsCount: 0,
			difficultyLevel: 'beginner',
			challengingKeys: [],
			improvementAreas: [],
			milestones: []
		});

		// Store active session
		this.activeSession = {
			sessionId,
			contentId,
			startTime,
			keypresses: [],
			model
		};

		return sessionId;
	}

	/**
	 * Record keypress with real-time performance (<5ms)
	 */
	async recordKeypress(
		key: string,
		isCorrect: boolean,
		timestamp: number = Date.now()
	): Promise<void> {
		if (!this.activeSession) {
			throw new Error('No active session');
		}

		// Validate timestamp
		if (timestamp < 0 || timestamp > Date.now() + 1000) {
			throw new Error('Invalid timestamp');
		}

		// Add to batch for performance
		this.keypressBatch.push({ key, isCorrect, timestamp });

		// Immediate processing for active session
		this.activeSession.keypresses.push({ key, isCorrect, timestamp });

		// Batch flush after 100ms for performance
		if (this.batchFlushTimeout) {
			clearTimeout(this.batchFlushTimeout);
		}

		this.batchFlushTimeout = setTimeout(() => {
			this.flushKeypressBatch();
		}, 100);
	}

	/**
	 * End session and return comprehensive summary
	 */
	async endSession(): Promise<SessionSummary> {
		if (!this.activeSession) {
			throw new Error('No active session');
		}

		// Flush any remaining keypresses
		await this.flushKeypressBatch();

		const endTime = new Date();
		const duration = endTime.getTime() - this.activeSession.startTime.getTime();

		// Calculate final metrics
		// const summary = this.activeSession.model.generateSessionSummary(); // TODO: Use in future dashboard
		const wpm = this.activeSession.model.wordsPerMinute;
		const accuracy = this.activeSession.model.accuracyPercentage;

		// Check for milestones
		const milestones = await this.checkSessionMilestones(wpm, accuracy);

		// Save to database
		await dbManager.put('user_progress', this.activeSession.model.toJSON());

		const sessionSummary: SessionSummary = {
			sessionId: this.activeSession.sessionId,
			duration,
			wordsPerMinute: wpm,
			accuracyPercentage: accuracy,
			totalCharacters: this.activeSession.model.totalCharacters,
			errorsCount: this.activeSession.model.errorsCount,
			improvementFromLastSession: await this.calculateImprovementFromLast(wpm),
			milestonesAchieved: milestones
		};

		// Clear active session
		this.activeSession = null;

		return sessionSummary;
	}

	/**
	 * Calculate WPM with outlier exclusion
	 */
	async calculateWPM(timeSpan: TimeSpan = 'week'): Promise<number> {
		const sessions = await this.getSessionsInTimeSpan(timeSpan);

		if (sessions.length === 0) return 0;

		// Extract WPM values and exclude outliers
		const wpmValues = sessions
			.map((session) => {
				const model = new UserProgressModel(session);
				return model.wordsPerMinute;
			})
			.filter((wpm) => wpm > 0 && wpm < 300); // Exclude unrealistic values

		if (wpmValues.length === 0) return 0;

		// Calculate weighted average (recent sessions weighted more)
		const weights = wpmValues.map((_, index) => Math.pow(1.1, index));
		const weightedSum = wpmValues.reduce((sum, wpm, index) => sum + wpm * weights[index], 0);
		const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

		return Math.round((weightedSum / totalWeight) * 10) / 10;
	}

	/**
	 * Calculate accuracy percentage
	 */
	async calculateAccuracy(timeSpan: TimeSpan = 'week'): Promise<number> {
		const sessions = await this.getSessionsInTimeSpan(timeSpan);

		if (sessions.length === 0) return 0;

		let totalCharacters = 0;
		let correctCharacters = 0;

		for (const session of sessions) {
			totalCharacters += session.totalCharacters;
			correctCharacters += session.correctCharacters;
		}

		if (totalCharacters === 0) return 0;

		return Math.round((correctCharacters / totalCharacters) * 1000) / 10;
	}

	/**
	 * Get typing trends with moving averages
	 */
	async getTypingTrends(days: number = 7): Promise<TypingTrends> {
		const sessions = await this.getRecentSessions(days);

		// Group sessions by day
		const dailyData = new Map<
			string,
			{ wpm: number[]; accuracy: number[]; practiceTime: number }
		>();

		for (const session of sessions) {
			const dateKey = session.date.toISOString().split('T')[0];
			const model = new UserProgressModel(session);

			if (!dailyData.has(dateKey)) {
				dailyData.set(dateKey, { wpm: [], accuracy: [], practiceTime: 0 });
			}

			const dayData = dailyData.get(dateKey)!;
			dayData.wpm.push(model.wordsPerMinute);
			dayData.accuracy.push(model.accuracyPercentage);
			dayData.practiceTime += session.duration;
		}

		// Convert to trend arrays with moving averages
		const dates = Array.from(dailyData.keys()).sort();
		const wpmTrend = dates.map((date, index) => {
			const dayData = dailyData.get(date)!;
			const avgWpm = dayData.wpm.reduce((sum, wpm) => sum + wpm, 0) / dayData.wpm.length;

			// Calculate 3-day moving average
			const movingAverage = this.calculateMovingAverage(
				dates.slice(Math.max(0, index - 2), index + 1).map((d) => {
					const data = dailyData.get(d)!;
					return data.wpm.reduce((sum, wpm) => sum + wpm, 0) / data.wpm.length;
				})
			);

			return {
				date: new Date(date),
				value: Math.round(avgWpm * 10) / 10,
				movingAverage: Math.round(movingAverage * 10) / 10
			};
		});

		const accuracyTrend = dates.map((date, index) => {
			const dayData = dailyData.get(date)!;
			const avgAccuracy =
				dayData.accuracy.reduce((sum, acc) => sum + acc, 0) / dayData.accuracy.length;

			const movingAverage = this.calculateMovingAverage(
				dates.slice(Math.max(0, index - 2), index + 1).map((d) => {
					const data = dailyData.get(d)!;
					return data.accuracy.reduce((sum, acc) => sum + acc, 0) / data.accuracy.length;
				})
			);

			return {
				date: new Date(date),
				value: Math.round(avgAccuracy * 10) / 10,
				movingAverage: Math.round(movingAverage * 10) / 10
			};
		});

		const practiceTimeTrend = dates.map((date, index) => {
			const practiceTime = dailyData.get(date)!.practiceTime / (1000 * 60); // Convert to minutes

			const movingAverage = this.calculateMovingAverage(
				dates
					.slice(Math.max(0, index - 2), index + 1)
					.map((d) => dailyData.get(d)!.practiceTime / (1000 * 60))
			);

			return {
				date: new Date(date),
				value: Math.round(practiceTime * 10) / 10,
				movingAverage: Math.round(movingAverage * 10) / 10
			};
		});

		// Calculate improvement rate
		const improvementRate =
			wpmTrend.length > 1
				? (wpmTrend[wpmTrend.length - 1].value - wpmTrend[0].value) / wpmTrend.length
				: 0;

		return {
			wpmTrend,
			accuracyTrend,
			practiceTimeTrend,
			improvementRate: Math.round(improvementRate * 10) / 10
		};
	}

	/**
	 * Identify challenging keys (>20% error rate)
	 */
	async identifyChallengingKeys(): Promise<KeyAnalysis[]> {
		const sessions = await this.getRecentSessions(30); // Last 30 days
		const keyStats = new Map<string, { attempts: number; errors: number; recent: boolean[] }>();

		// Aggregate key statistics
		for (const session of sessions) {
			const model = new UserProgressModel(session);
			const challengingKeys = model.challengingKeys;

			// challengingKeys is string[] from UserProgress interface, so we need to mock this data
			const mockChallengingKeys = challengingKeys as string[];
			for (const key of mockChallengingKeys) {
				const stats = { attempts: 10, errors: 2 }; // Mock data for now
				if (!keyStats.has(key)) {
					keyStats.set(key, { attempts: 0, errors: 0, recent: [] });
				}

				const keyData = keyStats.get(key)!;
				keyData.attempts += stats.attempts;
				keyData.errors += stats.errors;
				keyData.recent.push(stats.errors / stats.attempts > 0.2);
			}
		}

		// Filter and analyze challenging keys
		const challengingKeys: KeyAnalysis[] = [];

		for (const [key, stats] of keyStats.entries()) {
			const errorRate = stats.errors / stats.attempts;

			if (errorRate > 0.2 && stats.attempts >= 10) {
				// Determine improvement trend
				const recentErrorRates = stats.recent.slice(-5);
				const improvementTrend = this.analyzeImprovementTrend(recentErrorRates);

				challengingKeys.push({
					key,
					errorRate: Math.round(errorRate * 1000) / 1000,
					attempts: stats.attempts,
					improvementTrend,
					practiceRecommendation: this.generateKeyPracticeRecommendation(key)
				});
			}
		}

		// Sort by error rate (highest first)
		return challengingKeys.sort((a, b) => b.errorRate - a.errorRate);
	}

	/**
	 * Get improvement suggestions based on analysis
	 */
	async getImprovementSuggestions(): Promise<ImprovementArea[]> {
		const recentWPM = await this.calculateWPM('week');
		const recentAccuracy = await this.calculateAccuracy('week');
		const challengingKeys = await this.identifyChallengingKeys();

		const suggestions: ImprovementArea[] = [];

		// Accuracy-focused suggestions
		if (recentAccuracy < 85) {
			suggestions.push({
				area: 'accuracy',
				description: 'Focus on typing accuracy over speed',
				priority: 'high',
				recommendation: 'Practice common word patterns slowly and build muscle memory'
			});
		}

		// Speed-focused suggestions
		if (recentWPM < 20 && recentAccuracy > 90) {
			suggestions.push({
				area: 'speed',
				description: 'Build typing speed while maintaining accuracy',
				priority: 'medium',
				recommendation: 'Gradually increase typing pace with timed exercises'
			});
		}

		// Key-specific suggestions
		if (challengingKeys.length > 0) {
			const topChallengingKey = challengingKeys[0];
			suggestions.push({
				area: 'finger-placement',
				description: `Improve ${topChallengingKey.key}-key accuracy`,
				priority: challengingKeys.length > 3 ? 'high' : 'medium',
				recommendation: topChallengingKey.practiceRecommendation
			});
		}

		// Consistency suggestions
		const trends = await this.getTypingTrends(7);
		if (trends.improvementRate < 0) {
			suggestions.push({
				area: 'consistency',
				description: 'Build consistent daily practice habits',
				priority: 'medium',
				recommendation: 'Set a daily practice goal and track your progress'
			});
		}

		return suggestions.slice(0, 3); // Return top 3 suggestions
	}

	/**
	 * Track milestones achieved in session
	 */
	async trackMilestones(): Promise<MilestoneData[]> {
		// This would integrate with AchievementService in real implementation
		return [];
	}

	/**
	 * Generate comprehensive progress report
	 */
	async generateProgressReport(timeRange: TimeRange): Promise<ProgressReport> {
		const sessions = await this.getSessionsInTimeRange(timeRange);

		if (sessions.length === 0) {
			return {
				timeRange,
				totalPracticeTime: 0,
				averageWPM: 0,
				averageAccuracy: 0,
				sessionsCompleted: 0,
				challengingAreas: [],
				achievements: [],
				parentNotes: ['No practice sessions completed in this period']
			};
		}

		// Calculate aggregate metrics
		const totalPracticeTime = sessions.reduce((sum, session) => sum + session.duration, 0);
		const avgWPM = await this.calculateWPMForSessions(sessions);
		const avgAccuracy = this.calculateAccuracyForSessions(sessions);

		// Identify challenging areas
		const challengingKeys = await this.identifyChallengingKeys();
		const challengingAreas = challengingKeys.slice(0, 5).map((key) => `${key.key}-key`);

		// Generate parent notes
		const parentNotes = this.generateParentNotes(sessions, avgWPM, avgAccuracy);

		return {
			timeRange,
			totalPracticeTime,
			averageWPM: Math.round(avgWPM * 10) / 10,
			averageAccuracy: Math.round(avgAccuracy * 10) / 10,
			sessionsCompleted: sessions.length,
			challengingAreas,
			achievements: [], // Would integrate with AchievementService
			parentNotes
		};
	}

	/**
	 * Get parent-friendly summary
	 */
	async getParentSummary(): Promise<ParentSummary> {
		const recentSessions = await this.getRecentSessions(30);
		const totalPracticeTime = recentSessions.reduce((sum, session) => sum + session.duration, 0);
		const currentWPM = await this.calculateWPM('week');
		const averageAccuracy = await this.calculateAccuracy('week');
		const challengingKeys = await this.identifyChallengingKeys();

		// Calculate current streak (simplified)
		const currentStreak = await this.calculateCurrentStreak();

		// Determine overall progress
		let overallProgress: 'excellent' | 'good' | 'needs_improvement';
		if (averageAccuracy >= 90 && currentWPM >= 25) {
			overallProgress = 'excellent';
		} else if (averageAccuracy >= 80 && currentWPM >= 15) {
			overallProgress = 'good';
		} else {
			overallProgress = 'needs_improvement';
		}

		return {
			childName: 'Student', // Would get from user profile
			totalPracticeTime,
			currentStreak,
			averageAccuracy: Math.round(averageAccuracy * 10) / 10,
			currentWPM: Math.round(currentWPM * 10) / 10,
			recentAchievements: [], // Would integrate with AchievementService
			areasNeedingFocus: challengingKeys.slice(0, 3).map((key) => `${key.key} key`),
			overallProgress
		};
	}

	// Private helper methods

	private async flushKeypressBatch(): Promise<void> {
		if (!this.activeSession || this.keypressBatch.length === 0) return;

		try {
			// Process batch through model
			for (const keypress of this.keypressBatch) {
				this.activeSession.model.recordKeystroke(
					keypress.key,
					keypress.isCorrect,
					keypress.timestamp
				);
			}

			this.keypressBatch = [];
		} catch (error) {
			console.error('Failed to flush keypress batch:', error);
		}
	}

	private extractSourceFromContentId(contentId: string): string {
		if (contentId.includes('pokemon')) return 'pokemon';
		if (contentId.includes('nintendo')) return 'nintendo';
		if (contentId.includes('roblox')) return 'roblox';
		return 'unknown';
	}

	private async getSessionsInTimeSpan(timeSpan: TimeSpan): Promise<UserProgress[]> {
		const now = new Date();
		let daysBack: number;

		switch (timeSpan) {
			case 'day':
				daysBack = 1;
				break;
			case 'week':
				daysBack = 7;
				break;
			case 'month':
				daysBack = 30;
				break;
			default:
				daysBack = 7;
		}

		const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
		const sessions = await dbManager.getAll('user_progress');

		return sessions.filter((session) => new Date(session.date) >= startDate);
	}

	private async getRecentSessions(days: number): Promise<UserProgress[]> {
		const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
		const sessions = await dbManager.getAll('user_progress');

		return sessions.filter((session) => new Date(session.date) >= startDate);
	}

	private async getSessionsInTimeRange(timeRange: TimeRange): Promise<UserProgress[]> {
		const sessions = await dbManager.getAll('user_progress');

		return sessions.filter((session) => {
			const sessionDate = new Date(session.date);
			return sessionDate >= timeRange.start && sessionDate <= timeRange.end;
		});
	}

	private calculateMovingAverage(values: number[]): number {
		if (values.length === 0) return 0;
		return values.reduce((sum, val) => sum + val, 0) / values.length;
	}

	private analyzeImprovementTrend(
		recentErrorRates: boolean[]
	): 'improving' | 'stable' | 'declining' {
		if (recentErrorRates.length < 3) return 'stable';

		const recent = recentErrorRates.slice(-3);
		const earlier = recentErrorRates.slice(0, -3);

		const recentErrors = recent.filter(Boolean).length / recent.length;
		const earlierErrors =
			earlier.length > 0 ? earlier.filter(Boolean).length / earlier.length : recentErrors;

		if (recentErrors < earlierErrors - 0.1) return 'improving';
		if (recentErrors > earlierErrors + 0.1) return 'declining';
		return 'stable';
	}

	private generateKeyPracticeRecommendation(key: string): string {
		const recommendations = {
			q: 'Focus on q-u combinations and left pinky reach',
			z: 'Practice z-key reach exercises with left pinky',
			x: 'Bottom row key practice needed - use ring finger',
			c: 'Work on middle finger reach to bottom row',
			p: 'Right pinky placement - practice p-key isolation'
		};

		return (
			recommendations[key as keyof typeof recommendations] ||
			`Practice ${key}-key placement and finger positioning`
		);
	}

	private async calculateImprovementFromLast(currentWPM: number): Promise<number> {
		const recentSessions = await this.getRecentSessions(7);
		if (recentSessions.length < 2) return 0;

		const previousSession = recentSessions[recentSessions.length - 2];
		const previousModel = new UserProgressModel(previousSession);
		const previousWPM = previousModel.wordsPerMinute;

		return Math.round((currentWPM - previousWPM) * 10) / 10;
	}

	private async checkSessionMilestones(wpm: number, accuracy: number): Promise<MilestoneData[]> {
		// Simplified milestone checking - would integrate with AchievementService
		const milestones: MilestoneData[] = [];

		if (wpm >= 25) {
			milestones.push({
				type: 'wpm',
				value: wpm,
				timestamp: new Date(),
				celebrated: false
			});
		}
		if (accuracy >= 95) {
			milestones.push({
				type: 'accuracy',
				value: accuracy,
				timestamp: new Date(),
				celebrated: false
			});
		}

		return milestones;
	}

	private async calculateWPMForSessions(sessions: UserProgress[]): Promise<number> {
		if (sessions.length === 0) return 0;

		const wpmValues = sessions
			.map((session) => {
				const model = new UserProgressModel(session);
				return model.wordsPerMinute;
			})
			.filter((wpm) => wpm > 0);

		return wpmValues.reduce((sum, wpm) => sum + wpm, 0) / wpmValues.length;
	}

	private calculateAccuracyForSessions(sessions: UserProgress[]): number {
		if (sessions.length === 0) return 0;

		let totalCharacters = 0;
		let correctCharacters = 0;

		for (const session of sessions) {
			totalCharacters += session.totalCharacters;
			correctCharacters += session.correctCharacters;
		}

		return totalCharacters > 0 ? (correctCharacters / totalCharacters) * 100 : 0;
	}

	private generateParentNotes(
		sessions: UserProgress[],
		avgWPM: number,
		avgAccuracy: number
	): string[] {
		const notes: string[] = [];

		if (sessions.length >= 5) {
			notes.push('Consistent daily practice - great habit building!');
		}

		if (avgAccuracy >= 90) {
			notes.push('Excellent accuracy - showing careful attention to detail');
		} else if (avgAccuracy < 75) {
			notes.push('Focus on accuracy over speed for better foundation');
		}

		if (avgWPM > 20) {
			notes.push('Good typing speed development');
		}

		if (notes.length === 0) {
			notes.push('Keep practicing to see improvement trends');
		}

		return notes;
	}

	private async calculateCurrentStreak(): Promise<number> {
		// Simplified streak calculation - would integrate with StreakData model
		const recentSessions = await this.getRecentSessions(7);
		const uniqueDays = new Set(
			recentSessions.map((session) => new Date(session.date).toISOString().split('T')[0])
		);

		return uniqueDays.size;
	}
}

// Export singleton instance
export const progressTrackingService = new ProgressTrackingService();
