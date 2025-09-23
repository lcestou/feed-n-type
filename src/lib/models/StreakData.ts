/**
 * @fileoverview StreakData Model with Forgiveness Logic
 *
 * Manages daily practice streaks with child-friendly forgiveness mechanics
 * designed specifically for young learners aged 7-12. Features include
 * forgiveness credits for missed days, catch-up windows, weekend bonuses,
 * and motivational messages to maintain engagement.
 *
 * The system encourages consistency while being understanding of real-life
 * interruptions that children may face, promoting healthy practice habits.
 *
 * @module StreakDataModel
 * @since 1.0.0
 */

import type { StreakData } from '$lib/types/index.js';

/**
 * Configuration settings for streak management and forgiveness mechanics.
 * Designed to be encouraging for children while maintaining meaningful progress tracking.
 *
 * @constant STREAK_SETTINGS
 * @property {number} maxForgivenessCredits - Maximum forgiveness credits per month (3)
 * @property {number} catchUpWindowHours - Hours available for catch-up practice (48)
 * @property {number} weekendBonusMultiplier - Weekend streak bonus multiplier (1.5x)
 * @property {number[]} motivationThresholds - Streak milestones for special messages
 * @property {number} resetForgivenessDay - Day of week for credit reset (1 = Monday)
 * @property {number} minSessionDurationForStreak - Minimum session time for streak credit (5 minutes)
 * @example
 * const canForgive = forgivenessCredits < STREAK_SETTINGS.maxForgivenessCredits;
 * const isLongEnough = sessionDuration >= STREAK_SETTINGS.minSessionDurationForStreak;
 * @since 1.0.0
 */
export const STREAK_SETTINGS = {
	maxForgivenessCredits: 3,
	catchUpWindowHours: 48,
	weekendBonusMultiplier: 1.5,
	motivationThresholds: [7, 14, 21, 30, 50, 75, 100],
	resetForgivenessDay: 1, // Monday (0=Sunday, 1=Monday, etc.)
	minSessionDurationForStreak: 300000 // 5 minutes minimum
} as const;

/**
 * Default initial state for new streak tracking.
 * Provides fresh start values for all streak-related data.
 *
 * @constant DEFAULT_STREAK_DATA
 * @property {number} currentStreak - Starting streak count (0)
 * @property {number} longestStreak - Personal best streak (0)
 * @property {Date} lastPracticeDate - Last practice session date (current time)
 * @property {number} forgivenessCredits - Starting forgiveness credits (maximum)
 * @property {number} totalPracticeDays - Total days practiced (0)
 * @property {Date} streakStartDate - When current streak began (current time)
 * @property {boolean} weekendBonusUsed - Weekend bonus status (false)
 * @property {Date | null} catchUpDeadline - Active catch-up deadline (null)
 * @example
 * const newStreak = { ...DEFAULT_STREAK_DATA, userId: 'user123' };
 * @see {@link StreakData} for complete interface
 * @since 1.0.0
 */
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

/**
 * Model class for managing practice streaks with child-friendly forgiveness mechanics.
 * Tracks daily practice consistency while providing encouraging features like
 * forgiveness credits, catch-up opportunities, and celebration messages.
 *
 * @class StreakDataModel
 * @example
 * // Create new streak tracker
 * const streak = new StreakDataModel();
 *
 * // Record practice sessions
 * const result = streak.recordPracticeSession(new Date(), 600000); // 10 minutes
 * if (result.streakIncreased) {
 *   console.log(`Streak: ${result.newStreakCount} days! ${result.motivationMessage}`);
 * }
 *
 * // Check streak status
 * const status = streak.checkStreakStatus();
 * console.log(status.message);
 *
 * // Use forgiveness if needed
 * if (status.canUseForgiveness) {
 *   streak.useForgiveness();
 * }
 * @since 1.0.0
 */
export class StreakDataModel {
	private _streak: StreakData;

	constructor(streak: Partial<StreakData> = {}) {
		this._streak = this.validateAndNormalize(streak);
	}

	/**
	 * Get a deep copy of the current streak data.
	 * Returns immutable copy to prevent external modifications.
	 *
	 * @returns {StreakData} Complete streak data with all properties
	 * @example
	 * const currentStreak = model.streak;
	 * console.log(`Current: ${currentStreak.currentStreak}, Best: ${currentStreak.longestStreak}`);
	 * @since 1.0.0
	 */
	get streak(): StreakData {
		return { ...this._streak };
	}

	/**
	 * Get the current consecutive practice streak in days.
	 *
	 * @returns {number} Current streak count
	 * @example
	 * const days = model.currentStreak; // 15
	 * console.log(`You've practiced ${days} days in a row!`);
	 * @since 1.0.0
	 */
	get currentStreak(): number {
		return this._streak.currentStreak;
	}

	/**
	 * Get the user's personal best (longest ever) practice streak.
	 *
	 * @returns {number} Longest streak achieved
	 * @example
	 * const record = model.longestStreak; // 42
	 * console.log(`Your record is ${record} days!`);
	 * @since 1.0.0
	 */
	get longestStreak(): number {
		return this._streak.longestStreak;
	}

	/**
	 * Get the date of the last practice session.
	 * Returns a new Date object to prevent external modification.
	 *
	 * @returns {Date} Date of last practice session
	 * @example
	 * const lastPractice = model.lastPracticeDate;
	 * const daysSince = Math.floor((Date.now() - lastPractice.getTime()) / (1000 * 60 * 60 * 24));
	 * console.log(`Last practiced ${daysSince} days ago`);
	 * @since 1.0.0
	 */
	get lastPracticeDate(): Date {
		return new Date(this._streak.lastPracticeDate);
	}

	/**
	 * Get the number of remaining forgiveness credits.
	 * Credits allow missed days without breaking the streak.
	 *
	 * @returns {number} Available forgiveness credits (0-3)
	 * @example
	 * const credits = model.forgivenessCredits; // 2
	 * if (credits > 0) {
	 *   console.log(`You have ${credits} forgiveness days available`);
	 * }
	 * @see {@link STREAK_SETTINGS.maxForgivenessCredits} for maximum
	 * @since 1.0.0
	 */
	get forgivenessCredits(): number {
		return this._streak.forgivenessCredits;
	}

	/**
	 * Get the total number of days the user has practiced.
	 * Includes all practice sessions regardless of streaks.
	 *
	 * @returns {number} Total practice days across all time
	 * @example
	 * const totalDays = model.totalPracticeDays; // 127
	 * console.log(`You've practiced typing for ${totalDays} days total!`);
	 * @since 1.0.0
	 */
	get totalPracticeDays(): number {
		return this._streak.totalPracticeDays;
	}

	/**
	 * Get the date when the current streak began.
	 * Returns a new Date object to prevent external modification.
	 *
	 * @returns {Date} Start date of current streak
	 * @example
	 * const startDate = model.streakStartDate;
	 * const streakDuration = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
	 * console.log(`Current streak started ${streakDuration} days ago`);
	 * @since 1.0.0
	 */
	get streakStartDate(): Date {
		return new Date(this._streak.streakStartDate);
	}

	/**
	 * Get whether the weekend bonus has been used this week.
	 * Weekend bonus provides extra streak days for weekend practice.
	 *
	 * @returns {boolean} True if weekend bonus was used this week
	 * @example
	 * const bonusUsed = model.weekendBonusUsed;
	 * if (!bonusUsed && isWeekend) {
	 *   console.log('Weekend practice will earn bonus streak days!');
	 * }
	 * @see {@link STREAK_SETTINGS.weekendBonusMultiplier} for bonus amount
	 * @since 1.0.0
	 */
	get weekendBonusUsed(): boolean {
		return this._streak.weekendBonusUsed;
	}

	/**
	 * Get the current catch-up deadline if one is active.
	 * Returns null if no catch-up window is available.
	 *
	 * @returns {Date | null} Catch-up deadline or null
	 * @example
	 * const deadline = model.catchUpDeadline;
	 * if (deadline) {
	 *   const hoursLeft = Math.floor((deadline.getTime() - Date.now()) / (1000 * 60 * 60));
	 *   console.log(`${hoursLeft} hours left to catch up!`);
	 * }
	 * @see {@link STREAK_SETTINGS.catchUpWindowHours} for window duration
	 * @since 1.0.0
	 */
	get catchUpDeadline(): Date | null {
		return this._streak.catchUpDeadline ? new Date(this._streak.catchUpDeadline) : null;
	}

	/**
	 * Validate and normalize streak data to ensure data integrity.
	 * Clamps values to valid ranges and ensures logical relationships.
	 *
	 * @private
	 * @param {Partial<StreakData>} streak - Raw streak data to validate
	 * @returns {StreakData} Validated and normalized streak data
	 * @example
	 * // Internal use only - called by constructor
	 * const safeStreak = this.validateAndNormalize(rawData);
	 * @since 1.0.0
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
	 * Record a completed practice session and update streak status.
	 * Handles forgiveness logic, weekend bonuses, and motivation messages.
	 *
	 * @param {Date} [sessionDate=new Date()] - Date of the practice session
	 * @param {number} sessionDurationMs - Duration of session in milliseconds
	 * @returns {object} Session recording result
	 * @returns {boolean} returns.streakIncreased - Whether streak count increased
	 * @returns {number} returns.newStreakCount - Updated streak count
	 * @returns {boolean} returns.bonusApplied - Whether weekend bonus was applied
	 * @returns {string} [returns.motivationMessage] - Encouraging message for user
	 * @returns {boolean} returns.forgivenessUsed - Whether forgiveness credit was used
	 * @example
	 * // Record a 10-minute practice session
	 * const result = streak.recordPracticeSession(new Date(), 600000);
	 *
	 * if (result.streakIncreased) {
	 *   console.log(`New streak: ${result.newStreakCount} days!`);
	 *   if (result.bonusApplied) {
	 *     console.log('Weekend bonus applied! 🎉');
	 *   }
	 *   if (result.motivationMessage) {
	 *     showMessage(result.motivationMessage);
	 *   }
	 * }
	 *
	 * // Too short session
	 * const shortResult = streak.recordPracticeSession(new Date(), 120000); // 2 minutes
	 * console.log(shortResult.streakIncreased); // false
	 * @see {@link STREAK_SETTINGS.minSessionDurationForStreak} for minimum duration
	 * @since 1.0.0
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
		const motivationMessage = this.generateMotivationMessage(
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
	 * Check the current status of the practice streak and available options.
	 * Provides status assessment and user-friendly messages.
	 *
	 * @param {Date} [currentDate=new Date()] - Date to check status against
	 * @returns {object} Streak status information
	 * @returns {'safe' | 'at_risk' | 'broken' | 'catch_up_available'} returns.status - Current streak status
	 * @returns {number} returns.daysSinceLastPractice - Days since last practice
	 * @returns {boolean} returns.canUseForgiveness - Whether forgiveness is available
	 * @returns {boolean} returns.canUseCatchUp - Whether catch-up window is active
	 * @returns {number} [returns.hoursRemaining] - Hours left in catch-up window
	 * @returns {string} returns.message - User-friendly status message
	 * @example
	 * const status = streak.checkStreakStatus();
	 * console.log(status.message);
	 *
	 * switch (status.status) {
	 *   case 'safe':
	 *     showSuccessMessage(status.message);
	 *     break;
	 *   case 'at_risk':
	 *     showWarningMessage(status.message);
	 *     if (status.canUseForgiveness) {
	 *       showForgivenessOption();
	 *     }
	 *     break;
	 *   case 'catch_up_available':
	 *     showCatchUpMessage(status.message, status.hoursRemaining);
	 *     break;
	 *   case 'broken':
	 *     showRestartMessage(status.message);
	 *     break;
	 * }
	 * @since 1.0.0
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
		const canUseCatchUp = Boolean(
			this._streak.catchUpDeadline && today <= this._streak.catchUpDeadline
		);

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
	 * Activate a catch-up window to allow streak recovery.
	 * Provides a limited time window to practice and maintain the streak.
	 *
	 * @returns {boolean} True if catch-up window was activated, false if no credits available
	 * @example
	 * if (streak.activateCatchUpWindow()) {
	 *   console.log('Catch-up window activated! You have 48 hours to practice.');
	 * } else {
	 *   console.log('No forgiveness credits available for catch-up.');
	 * }
	 *
	 * // Check deadline after activation
	 * const deadline = streak.catchUpDeadline;
	 * if (deadline) {
	 *   const hoursLeft = Math.floor((deadline.getTime() - Date.now()) / (1000 * 60 * 60));
	 *   showCatchUpTimer(hoursLeft);
	 * }
	 * @see {@link STREAK_SETTINGS.catchUpWindowHours} for window duration
	 * @since 1.0.0
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
	 * Use a forgiveness credit to excuse a missed practice day.
	 * Reduces available forgiveness credits by one.
	 *
	 * @returns {boolean} True if forgiveness was used, false if no credits available
	 * @example
	 * if (streak.useForgiveness()) {
	 *   console.log('Forgiveness used! Your streak is safe.');
	 *   const remaining = streak.forgivenessCredits;
	 *   console.log(`${remaining} forgiveness credits remaining.`);
	 * } else {
	 *   console.log('No forgiveness credits available.');
	 * }
	 * @see {@link forgivenessCredits} to check available credits
	 * @since 1.0.0
	 */
	useForgiveness(): boolean {
		if (this._streak.forgivenessCredits === 0) {
			return false;
		}

		this._streak.forgivenessCredits--;
		return true;
	}

	/**
	 * Get comprehensive statistics about practice streaks and consistency.
	 * Provides detailed analytics for progress tracking and motivation.
	 *
	 * @returns {object} Detailed streak statistics
	 * @returns {number} returns.currentStreak - Current consecutive days
	 * @returns {number} returns.longestStreak - Personal best streak
	 * @returns {number} returns.totalPracticeDays - All-time practice days
	 * @returns {Date} returns.streakStartDate - When current streak began
	 * @returns {number} returns.daysInCurrentStreak - Calendar days in current streak
	 * @returns {number} returns.averageStreakLength - Estimated average streak length
	 * @returns {number} returns.forgivenessCreditsRemaining - Available forgiveness credits
	 * @returns {number} returns.consistency - Practice consistency percentage
	 * @example
	 * const stats = streak.getStreakStatistics();
	 * console.log(`Current: ${stats.currentStreak} days`);
	 * console.log(`Record: ${stats.longestStreak} days`);
	 * console.log(`Total practice: ${stats.totalPracticeDays} days`);
	 * console.log(`Consistency: ${stats.consistency.toFixed(1)}%`);
	 *
	 * // Show progress visualization
	 * updateProgressBar(stats.consistency);
	 * displayStreakCalendar(stats.streakStartDate, stats.currentStreak);
	 * @since 1.0.0
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
	 * Generate encouraging motivation messages based on streak milestones and context.
	 * Provides personalized feedback to maintain engagement and celebrate achievements.
	 *
	 * @private
	 * @param {number} streakCount - Current streak count
	 * @param {boolean} bonusApplied - Whether weekend bonus was applied
	 * @param {boolean} forgivenessUsed - Whether forgiveness was used
	 * @returns {string} Motivational message appropriate for the context
	 * @example
	 * // Internal use only
	 * const message = this.generateMotivationMessage(7, false, false);
	 * // Returns: "🎉 Amazing! One week streak! Your Typingotchi is so proud!"
	 * @see {@link STREAK_SETTINGS.motivationThresholds} for milestone values
	 * @since 1.0.0
	 */
	private generateMotivationMessage(
		streakCount: number,
		bonusApplied: boolean,
		forgivenessUsed: boolean
	): string {
		let message = '';

		// Milestone celebrations
		if ((STREAK_SETTINGS.motivationThresholds as readonly number[]).includes(streakCount)) {
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
	 * Reset forgiveness credits to maximum on the first Monday of each month.
	 * Provides a fresh start with full forgiveness credits monthly.
	 *
	 * @private
	 * @param {Date} currentDate - Current date to check for reset
	 * @example
	 * // Internal use only - called automatically by recordPracticeSession
	 * this.resetForgivenessCreditsIfNeeded(sessionDate);
	 * @see {@link STREAK_SETTINGS.maxForgivenessCredits} for reset amount
	 * @since 1.0.0
	 */
	private resetForgivenessCreditsIfNeeded(currentDate: Date): void {
		const firstMondayOfMonth = this.getFirstMondayOfMonth(currentDate);
		const lastReset = this.getFirstMondayOfMonth(this._streak.lastPracticeDate);

		if (firstMondayOfMonth > lastReset) {
			this._streak.forgivenessCredits = STREAK_SETTINGS.maxForgivenessCredits;
		}
	}

	/**
	 * Calculate the first Monday of the month for a given date.
	 * Used for determining forgiveness credit reset timing.
	 *
	 * @private
	 * @param {Date} date - Date to find first Monday for
	 * @returns {Date} First Monday of the month
	 * @example
	 * // Internal use only
	 * const firstMonday = this.getFirstMondayOfMonth(new Date());
	 * @since 1.0.0
	 */
	private getFirstMondayOfMonth(date: Date): Date {
		const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
		const dayOfWeek = firstDay.getDay();
		const daysToMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7;
		return new Date(date.getFullYear(), date.getMonth(), 1 + daysToMonday);
	}

	/**
	 * Check if a given date falls on a weekend (Saturday or Sunday).
	 * Used for weekend bonus eligibility determination.
	 *
	 * @private
	 * @param {Date} date - Date to check
	 * @returns {boolean} True if date is Saturday or Sunday
	 * @example
	 * // Internal use only
	 * const isWeekendSession = this.isWeekend(sessionDate);
	 * @since 1.0.0
	 */
	private isWeekend(date: Date): boolean {
		const day = date.getDay();
		return day === 0 || day === 6; // Sunday or Saturday
	}

	/**
	 * Normalize a date to midnight (00:00:00) for accurate day-based comparisons.
	 * Ensures consistent date comparisons regardless of time components.
	 *
	 * @private
	 * @param {Date} date - Date to normalize
	 * @returns {Date} Date set to midnight of the same day
	 * @example
	 * // Internal use only
	 * const dayStart = this.normalizeDate(new Date()); // Today at 00:00:00
	 * @since 1.0.0
	 */
	private normalizeDate(date: Date): Date {
		const normalized = new Date(date);
		normalized.setHours(0, 0, 0, 0);
		return normalized;
	}

	/**
	 * Calculate the number of whole days between two dates.
	 * Used for determining streak gaps and timing calculations.
	 *
	 * @private
	 * @param {Date} date1 - Earlier date
	 * @param {Date} date2 - Later date
	 * @returns {number} Number of days between dates (can be negative)
	 * @example
	 * // Internal use only
	 * const daysSince = this.daysBetweenDates(lastPractice, today);
	 * @since 1.0.0
	 */
	private daysBetweenDates(date1: Date, date2: Date): number {
		const timeDiff = date2.getTime() - date1.getTime();
		return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
	}

	/**
	 * Reset the current streak with safety confirmation.
	 * Preserves total practice days and longest streak record.
	 *
	 * @param {string} confirmation - Must be 'RESET_STREAK_CONFIRMED' to proceed
	 * @throws {Error} When confirmation string is incorrect
	 * @example
	 * // Safe reset with confirmation
	 * streak.resetStreak('RESET_STREAK_CONFIRMED');
	 *
	 * // This will throw an error
	 * streak.resetStreak('yes'); // Error: Streak reset requires confirmation
	 *
	 * // Data preserved after reset
	 * const stats = streak.getStreakStatistics();
	 * console.log(stats.currentStreak); // 0
	 * console.log(stats.longestStreak); // Original record preserved
	 * console.log(stats.totalPracticeDays); // Original total preserved
	 * @since 1.0.0
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
	 * Export the current streak data for persistence to storage.
	 * Returns a plain object suitable for JSON serialization.
	 *
	 * @returns {StreakData} Plain object representation of streak data
	 * @example
	 * const streakData = streak.toJSON();
	 * localStorage.setItem('streak-data', JSON.stringify(streakData));
	 * @since 1.0.0
	 */
	toJSON(): StreakData {
		return { ...this._streak };
	}

	/**
	 * Create a StreakDataModel instance from persisted JSON data.
	 * Handles date deserialization and data validation.
	 *
	 * @static
	 * @param {unknown} data - Raw data from storage (JSON parsed)
	 * @returns {StreakDataModel} New model instance with restored streak data
	 * @throws {Error} When data is invalid or corrupted
	 * @example
	 * const savedData = JSON.parse(localStorage.getItem('streak-data'));
	 * const streak = StreakDataModel.fromJSON(savedData);
	 *
	 * // Handle missing data gracefully
	 * try {
	 *   const streak = StreakDataModel.fromJSON(data);
	 *   console.log(`Restored streak: ${streak.currentStreak} days`);
	 * } catch (error) {
	 *   console.error('Failed to load streak:', error);
	 *   const streak = new StreakDataModel(); // Fresh streak
	 * }
	 * @since 1.0.0
	 */
	static fromJSON(data: unknown): StreakDataModel {
		if (!data || typeof data !== 'object') {
			throw new Error('Invalid streak data');
		}

		// Convert date strings back to Date objects if needed
		const convertedData = { ...data } as Partial<StreakData> & { [key: string]: unknown };

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
	 * Validate the current state of the streak data for integrity issues.
	 * Performs comprehensive checks on all properties and logical relationships.
	 *
	 * @returns {object} Validation result
	 * @returns {boolean} returns.isValid - True if all validations pass
	 * @returns {string[]} returns.errors - Array of validation error messages
	 * @example
	 * const validation = streak.validateState();
	 * if (!validation.isValid) {
	 *   console.error('Streak data has issues:');
	 *   validation.errors.forEach(error => console.error(`- ${error}`));
	 * }
	 *
	 * // Use for debugging or data migration
	 * if (validation.isValid) {
	 *   saveStreakData(streak.toJSON());
	 * } else {
	 *   reportDataCorruption(validation.errors);
	 *   // Try to recover or reset streak
	 * }
	 * @since 1.0.0
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
