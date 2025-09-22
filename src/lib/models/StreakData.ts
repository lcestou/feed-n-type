/**
 * StreakData Model with Forgiveness Logic
 *
 * Manages daily practice streaks with child-friendly forgiveness mechanics.
 * Includes catch-up days, weekend bonuses, and motivation features.
 */

import type { StreakData } from '$lib/types/index.js';

export const STREAK_SETTINGS = {
	maxForgivenessCredits: 3,
	catchUpWindowHours: 48,
	weekendBonusMultiplier: 1.5,
	motivationThresholds: [7, 14, 21, 30, 50, 75, 100],
	resetForgivenessDay: 1, // Monday (0=Sunday, 1=Monday, etc.)
	minSessionDurationForStreak: 300000 // 5 minutes minimum
} as const;

export const DEFAULT_STREAK_DATA: StreakData = {
	currentStreak: 0,
	longestStreak: 0,
	lastPracticeDate: new Date(),
	forgivenessCredits: STREAK_SETTINGS.maxForgivenessCredits,
	totalPracticeDays: 0,
	streakStartDate: new Date(),
	weekendBonusUsed: false,
	catchUpDeadline: null
};

export class StreakDataModel {
	private _streak: StreakData;

	constructor(streak: Partial<StreakData> = {}) {
		this._streak = this.validateAndNormalize(streak);
	}

	/**
	 * Get current streak state
	 */
	get streak(): StreakData {
		return { ...this._streak };
	}

	/**
	 * Get specific properties
	 */
	get currentStreak(): number {
		return this._streak.currentStreak;
	}

	get longestStreak(): number {
		return this._streak.longestStreak;
	}

	get lastPracticeDate(): Date {
		return new Date(this._streak.lastPracticeDate);
	}

	get forgivenessCredits(): number {
		return this._streak.forgivenessCredits;
	}

	get totalPracticeDays(): number {
		return this._streak.totalPracticeDays;
	}

	get streakStartDate(): Date {
		return new Date(this._streak.streakStartDate);
	}

	get weekendBonusUsed(): boolean {
		return this._streak.weekendBonusUsed;
	}

	get catchUpDeadline(): Date | null {
		return this._streak.catchUpDeadline ? new Date(this._streak.catchUpDeadline) : null;
	}

	/**
	 * Validate and normalize streak data
	 */
	private validateAndNormalize(streak: Partial<StreakData>): StreakData {
		const currentStreak = Math.max(0, streak.currentStreak || 0);
		const longestStreak = Math.max(currentStreak, streak.longestStreak || 0);
		const totalPracticeDays = Math.max(currentStreak, streak.totalPracticeDays || 0);
		const forgivenessCredits = Math.max(
			0,
			Math.min(
				STREAK_SETTINGS.maxForgivenessCredits,
				streak.forgivenessCredits || STREAK_SETTINGS.maxForgivenessCredits
			)
		);

		const lastPracticeDate =
			streak.lastPracticeDate instanceof Date
				? streak.lastPracticeDate
				: new Date(streak.lastPracticeDate || Date.now());

		const streakStartDate =
			streak.streakStartDate instanceof Date
				? streak.streakStartDate
				: new Date(streak.streakStartDate || Date.now());

		const catchUpDeadline = streak.catchUpDeadline
			? streak.catchUpDeadline instanceof Date
				? streak.catchUpDeadline
				: new Date(streak.catchUpDeadline)
			: null;

		return {
			currentStreak,
			longestStreak,
			lastPracticeDate,
			forgivenessCredits,
			totalPracticeDays,
			streakStartDate,
			weekendBonusUsed: Boolean(streak.weekendBonusUsed),
			catchUpDeadline
		};
	}

	/**
	 * Record a practice session
	 */
	recordPracticeSession(
		sessionDate: Date = new Date(),
		sessionDurationMs: number
	): {
		streakIncreased: boolean;
		newStreakCount: number;
		bonusApplied: boolean;
		motivationMessage?: string;
		forgivenessUsed: boolean;
	} {
		// Validate minimum session duration
		if (sessionDurationMs < STREAK_SETTINGS.minSessionDurationForStreak) {
			return {
				streakIncreased: false,
				newStreakCount: this._streak.currentStreak,
				bonusApplied: false,
				forgivenessUsed: false
			};
		}

		const today = this.normalizeDate(sessionDate);
		const lastPractice = this.normalizeDate(this._streak.lastPracticeDate);
		const daysSinceLastPractice = this.daysBetweenDates(lastPractice, today);

		let streakIncreased = false;
		let bonusApplied = false;
		let forgivenessUsed = false;
		let motivationMessage: string | undefined;

		// Check if this is the same day (no streak change)
		if (daysSinceLastPractice === 0) {
			return {
				streakIncreased: false,
				newStreakCount: this._streak.currentStreak,
				bonusApplied: false,
				forgivenessUsed: false
			};
		}

		// Check for consecutive day
		if (daysSinceLastPractice === 1) {
			// Perfect streak continuation
			this._streak.currentStreak++;
			this._streak.totalPracticeDays++;
			streakIncreased = true;
		} else if (daysSinceLastPractice <= 2 && this._streak.forgivenessCredits > 0) {
			// Use forgiveness credit for missed day
			this._streak.forgivenessCredits--;
			this._streak.currentStreak++;
			this._streak.totalPracticeDays++;
			streakIncreased = true;
			forgivenessUsed = true;
		} else if (this._streak.catchUpDeadline && today <= this._streak.catchUpDeadline) {
			// Within catch-up window
			this._streak.currentStreak++;
			this._streak.totalPracticeDays++;
			this._streak.catchUpDeadline = null; // Clear catch-up deadline
			streakIncreased = true;
			forgivenessUsed = true;
		} else {
			// Streak broken - reset
			this._streak.currentStreak = 1;
			this._streak.totalPracticeDays++;
			this._streak.streakStartDate = today;
			streakIncreased = true;
		}

		// Apply weekend bonus if applicable
		if (streakIncreased && this.isWeekend(today) && !this._streak.weekendBonusUsed) {
			const bonusStreak = Math.floor(
				this._streak.currentStreak * (STREAK_SETTINGS.weekendBonusMultiplier - 1)
			);
			this._streak.currentStreak += bonusStreak;
			this._streak.weekendBonusUsed = true;
			bonusApplied = true;
		}

		// Reset weekend bonus on Monday
		if (today.getDay() === STREAK_SETTINGS.resetForgivenessDay) {
			this._streak.weekendBonusUsed = false;
		}

		// Update longest streak
		if (this._streak.currentStreak > this._streak.longestStreak) {
			this._streak.longestStreak = this._streak.currentStreak;
		}

		// Update last practice date
		this._streak.lastPracticeDate = today;

		// Clear catch-up deadline if successful
		if (streakIncreased && this._streak.catchUpDeadline) {
			this._streak.catchUpDeadline = null;
		}

		// Generate motivation message
		motivationMessage = this.generateMotivationMessage(
			this._streak.currentStreak,
			bonusApplied,
			forgivenessUsed
		);

		// Reset forgiveness credits monthly (first Monday of month)
		this.resetForgivenessCreditsIfNeeded(today);

		return {
			streakIncreased,
			newStreakCount: this._streak.currentStreak,
			bonusApplied,
			motivationMessage,
			forgivenessUsed
		};
	}

	/**
	 * Check if streak is at risk
	 */
	checkStreakStatus(currentDate: Date = new Date()): {
		status: 'safe' | 'at_risk' | 'broken' | 'catch_up_available';
		daysSinceLastPractice: number;
		canUseForgiveness: boolean;
		canUseCatchUp: boolean;
		hoursRemaining?: number;
		message: string;
	} {
		const today = this.normalizeDate(currentDate);
		const lastPractice = this.normalizeDate(this._streak.lastPracticeDate);
		const daysSinceLastPractice = this.daysBetweenDates(lastPractice, today);

		const canUseForgiveness = this._streak.forgivenessCredits > 0;
		const canUseCatchUp = this._streak.catchUpDeadline && today <= this._streak.catchUpDeadline;

		let status: 'safe' | 'at_risk' | 'broken' | 'catch_up_available';
		let message: string;
		let hoursRemaining: number | undefined;

		if (daysSinceLastPractice === 0) {
			status = 'safe';
			message = `Great job! You practiced today. Your streak is ${this._streak.currentStreak} days!`;
		} else if (daysSinceLastPractice === 1) {
			status = 'at_risk';
			message = `Don't forget to practice today to keep your ${this._streak.currentStreak}-day streak!`;
		} else if (daysSinceLastPractice === 2 && canUseForgiveness) {
			status = 'at_risk';
			message = `Your streak can be saved with a forgiveness day! Practice now to continue your ${this._streak.currentStreak}-day streak.`;
		} else if (canUseCatchUp) {
			status = 'catch_up_available';
			const hoursUntilDeadline = Math.max(
				0,
				Math.floor((this._streak.catchUpDeadline!.getTime() - today.getTime()) / (1000 * 60 * 60))
			);
			hoursRemaining = hoursUntilDeadline;
			message = `Catch-up time! You have ${hoursUntilDeadline} hours to save your streak.`;
		} else {
			status = 'broken';
			message = `Time to start a new streak! Your longest was ${this._streak.longestStreak} days.`;
		}

		return {
			status,
			daysSinceLastPractice,
			canUseForgiveness,
			canUseCatchUp,
			hoursRemaining,
			message
		};
	}

	/**
	 * Activate catch-up window for missed day
	 */
	activateCatchUpWindow(): boolean {
		if (this._streak.forgivenessCredits === 0) {
			return false;
		}

		const catchUpDeadline = new Date();
		catchUpDeadline.setHours(catchUpDeadline.getHours() + STREAK_SETTINGS.catchUpWindowHours);

		this._streak.catchUpDeadline = catchUpDeadline;
		return true;
	}

	/**
	 * Use a forgiveness credit to save streak
	 */
	useForgiveness(): boolean {
		if (this._streak.forgivenessCredits === 0) {
			return false;
		}

		this._streak.forgivenessCredits--;
		return true;
	}

	/**
	 * Get streak statistics
	 */
	getStreakStatistics(): {
		currentStreak: number;
		longestStreak: number;
		totalPracticeDays: number;
		streakStartDate: Date;
		daysInCurrentStreak: number;
		averageStreakLength: number;
		forgivenessCreditsRemaining: number;
		consistency: number;
	} {
		const today = new Date();
		const daysInCurrentStreak = this.daysBetweenDates(this._streak.streakStartDate, today) + 1;

		// Calculate consistency (practice days / possible days)
		const totalPossibleDays = Math.max(
			1,
			this._streak.totalPracticeDays +
				this.daysBetweenDates(this._streak.streakStartDate, today) -
				this._streak.currentStreak
		);
		const consistency = Math.min(100, (this._streak.totalPracticeDays / totalPossibleDays) * 100);

		// Calculate average streak length (rough estimate)
		const averageStreakLength =
			this._streak.totalPracticeDays > 0
				? this._streak.totalPracticeDays /
					Math.max(
						1,
						Math.floor(this._streak.totalPracticeDays / Math.max(1, this._streak.longestStreak))
					)
				: 0;

		return {
			currentStreak: this._streak.currentStreak,
			longestStreak: this._streak.longestStreak,
			totalPracticeDays: this._streak.totalPracticeDays,
			streakStartDate: new Date(this._streak.streakStartDate),
			daysInCurrentStreak,
			averageStreakLength: Math.round(averageStreakLength * 100) / 100,
			forgivenessCreditsRemaining: this._streak.forgivenessCredits,
			consistency: Math.round(consistency * 100) / 100
		};
	}

	/**
	 * Generate motivation message based on streak milestone
	 */
	private generateMotivationMessage(
		streakCount: number,
		bonusApplied: boolean,
		forgivenessUsed: boolean
	): string {
		let message = '';

		// Milestone celebrations
		if (STREAK_SETTINGS.motivationThresholds.includes(streakCount)) {
			if (streakCount === 7) {
				message = '🎉 Amazing! One week streak! Your Typingotchi is so proud!';
			} else if (streakCount === 14) {
				message = "🔥 Two weeks strong! You're building an incredible habit!";
			} else if (streakCount === 21) {
				message = "🌟 Three weeks! You're a typing superstar!";
			} else if (streakCount === 30) {
				message = "👑 One month streak! You're absolutely incredible!";
			} else if (streakCount >= 50) {
				message = `🚀 ${streakCount} days! You're in the typing hall of fame!`;
			}
		} else if (bonusApplied) {
			message = '🎁 Weekend bonus applied! Extra streak days earned!';
		} else if (forgivenessUsed) {
			message = '💝 Forgiveness used - your streak is safe! Great comeback!';
		} else if (streakCount % 5 === 0 && streakCount > 0) {
			message = `🎯 ${streakCount} days! Keep the momentum going!`;
		} else {
			const encouragements = [
				'Great job practicing today!',
				'Your Typingotchi is getting stronger!',
				'Another day, another step forward!',
				'Consistency is key - well done!',
				"You're building great habits!"
			];
			message = encouragements[Math.floor(Math.random() * encouragements.length)];
		}

		return message;
	}

	/**
	 * Reset forgiveness credits on first Monday of each month
	 */
	private resetForgivenessCreditsIfNeeded(currentDate: Date): void {
		const firstMondayOfMonth = this.getFirstMondayOfMonth(currentDate);
		const lastReset = this.getFirstMondayOfMonth(this._streak.lastPracticeDate);

		if (firstMondayOfMonth > lastReset) {
			this._streak.forgivenessCredits = STREAK_SETTINGS.maxForgivenessCredits;
		}
	}

	/**
	 * Get first Monday of the month
	 */
	private getFirstMondayOfMonth(date: Date): Date {
		const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
		const dayOfWeek = firstDay.getDay();
		const daysToMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7;
		return new Date(date.getFullYear(), date.getMonth(), 1 + daysToMonday);
	}

	/**
	 * Check if date is weekend
	 */
	private isWeekend(date: Date): boolean {
		const day = date.getDay();
		return day === 0 || day === 6; // Sunday or Saturday
	}

	/**
	 * Normalize date to midnight for comparison
	 */
	private normalizeDate(date: Date): Date {
		const normalized = new Date(date);
		normalized.setHours(0, 0, 0, 0);
		return normalized;
	}

	/**
	 * Calculate days between two dates
	 */
	private daysBetweenDates(date1: Date, date2: Date): number {
		const timeDiff = date2.getTime() - date1.getTime();
		return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
	}

	/**
	 * Reset streak (with confirmation)
	 */
	resetStreak(confirmation: string): void {
		if (confirmation !== 'RESET_STREAK_CONFIRMED') {
			throw new Error('Streak reset requires confirmation');
		}

		this._streak = {
			...DEFAULT_STREAK_DATA,
			totalPracticeDays: this._streak.totalPracticeDays, // Keep total practice days
			longestStreak: this._streak.longestStreak // Keep personal best
		};
	}

	/**
	 * Export streak for persistence
	 */
	toJSON(): StreakData {
		return { ...this._streak };
	}

	/**
	 * Create instance from persisted data
	 */
	static fromJSON(data: any): StreakDataModel {
		if (!data || typeof data !== 'object') {
			throw new Error('Invalid streak data');
		}

		// Convert date strings back to Date objects if needed
		const convertedData = { ...data };

		if (convertedData.lastPracticeDate && typeof convertedData.lastPracticeDate === 'string') {
			convertedData.lastPracticeDate = new Date(convertedData.lastPracticeDate);
		}

		if (convertedData.streakStartDate && typeof convertedData.streakStartDate === 'string') {
			convertedData.streakStartDate = new Date(convertedData.streakStartDate);
		}

		if (convertedData.catchUpDeadline && typeof convertedData.catchUpDeadline === 'string') {
			convertedData.catchUpDeadline = new Date(convertedData.catchUpDeadline);
		}

		return new StreakDataModel(convertedData);
	}

	/**
	 * Validate streak state integrity
	 */
	validateState(): { isValid: boolean; errors: string[] } {
		const errors: string[] = [];

		if (this._streak.currentStreak < 0) {
			errors.push('Current streak cannot be negative');
		}

		if (this._streak.longestStreak < this._streak.currentStreak) {
			errors.push('Longest streak cannot be less than current streak');
		}

		if (this._streak.totalPracticeDays < this._streak.currentStreak) {
			errors.push('Total practice days cannot be less than current streak');
		}

		if (
			this._streak.forgivenessCredits < 0 ||
			this._streak.forgivenessCredits > STREAK_SETTINGS.maxForgivenessCredits
		) {
			errors.push(
				`Forgiveness credits must be between 0 and ${STREAK_SETTINGS.maxForgivenessCredits}`
			);
		}

		if (!(this._streak.lastPracticeDate instanceof Date)) {
			errors.push('Last practice date must be a valid Date object');
		}

		if (!(this._streak.streakStartDate instanceof Date)) {
			errors.push('Streak start date must be a valid Date object');
		}

		if (this._streak.catchUpDeadline && !(this._streak.catchUpDeadline instanceof Date)) {
			errors.push('Catch-up deadline must be a valid Date object or null');
		}

		return {
			isValid: errors.length === 0,
			errors
		};
	}
}
