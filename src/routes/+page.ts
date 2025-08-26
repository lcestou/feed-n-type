/**
 * Enable prerendering for this page.
 *
 * Since there's no dynamic data here, we can prerender the page
 * so that it gets served as a static asset in production.
 * This improves performance and SEO by generating the HTML at build time.
 *
 * @see https://kit.svelte.dev/docs/page-options#prerender
 */
export const prerender = true;
