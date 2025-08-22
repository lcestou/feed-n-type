<script lang="ts">
	import Header from './Header.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<div class="flex flex-col min-h-screen">
	<Header />

	<main class="flex-grow flex flex-col">
		{@render children()}
	</main>

	<footer class="flex flex-col justify-center items-center px-3 py-4 sm:py-5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white mt-auto">
		<div class="text-center max-w-xl">
			<p class="text-lg font-semibold mb-2 drop-shadow-sm">🎮 Feed & Type - Making typing fun with content you love!</p>
			<p class="text-sm opacity-90 m-0 font-normal">Practice with Minecraft, Roblox, Pokemon & more</p>
		</div>
	</footer>
</div>
