/**
 * @fileoverview SvelteKit application type declarations
 *
 * This file contains global type declarations for the Feed & Type typing game.
 * It extends SvelteKit's built-in types to provide type safety across the application.
 *
 * @see {@link https://svelte.dev/docs/kit/types#app.d.ts} SvelteKit App Types Documentation
 * @example
 * // Example usage in a load function:
 * // export const load: PageLoad = async ({ params }) => {
 * //   return {
 * //     level: params.level
 * //   };
 * // };
 */

/**
 * SvelteKit App namespace containing application-specific type definitions.
 * Used to extend built-in SvelteKit types for the typing game application.
 *
 * @namespace App
 * @example
 * // Future extensions might include:
 * // interface Error {
 * //   code: string;
 * //   id: string;
 * // }
 * // interface Locals {
 * //   user?: UserSession;
 * // }
 * // interface PageData {
 * //   gameSettings?: GameConfig;
 * // }
 */
declare global {
	namespace App {
		/**
		 * Custom error interface for enhanced error handling.
		 * Currently using default SvelteKit error handling.
		 *
		 * @interface Error
		 * @example
		 * // Could be extended for game-specific errors:
		 * // interface Error {
		 * //   message: string;
		 * //   gameContext?: 'typing' | 'pet-feeding' | 'level-progression';
		 * // }
		 */
		// interface Error {}
		/**
		 * Server-side locals for request context.
		 * Currently using default SvelteKit locals handling.
		 *
		 * @interface Locals
		 * @example
		 * // Could store user progress:
		 * // interface Locals {
		 * //   playerStats?: {
		 * //     level: number;
		 * //     typingSpeed: number;
		 * //     petHealth: number;
		 * //   };
		 * // }
		 */
		// interface Locals {}
		/**
		 * Page data interface for load function return types.
		 * Currently using default SvelteKit page data handling.
		 *
		 * @interface PageData
		 * @example
		 * // Could include game configuration:
		 * // interface PageData {
		 * //   currentLevel?: number;
		 * //   availableThemes?: string[];
		 * //   playerProgress?: ProgressData;
		 * // }
		 */
		// interface PageData {}
		/**
		 * Client-side page state for $page.state.
		 * Currently using default SvelteKit page state handling.
		 *
		 * @interface PageState
		 * @example
		 * // Could track game state:
		 * // interface PageState {
		 * //   gameInProgress?: boolean;
		 * //   currentText?: string;
		 * //   typedCharacters?: number;
		 * // }
		 */
		// interface PageState {}
		/**
		 * Platform-specific types for deployment environments.
		 * Currently using default SvelteKit platform handling.
		 *
		 * @interface Platform
		 * @example
		 * // For Cloudflare or other platforms:
		 * // interface Platform {
		 * //   env?: {
		 * //     DATABASE_URL: string;
		 * //     CONTENT_API_KEY: string;
		 * //   };
		 * // }
		 */
		// interface Platform {}
	}
}

export {};
