<script lang="ts">
	import Header from './Header.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<div class="app">
	<Header />

	<main>
		{@render children()}
	</main>

	<footer>
		<div class="footer-content">
			<p class="brand-text">🎮 Feed & Type - Making typing fun with content you love!</p>
			<p class="topics">Practice with Minecraft, Roblox, Pokemon & more</p>
		</div>
	</footer>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
	}

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 16px 12px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		margin-top: auto;
	}

	.footer-content {
		text-align: center;
		max-width: 600px;
	}

	.brand-text {
		font-size: 1.1rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	.topics {
		font-size: 0.9rem;
		opacity: 0.9;
		margin: 0;
		font-weight: 400;
	}

	@media (min-width: 480px) {
		footer {
			padding: 20px 0;
		}
	}
</style>
