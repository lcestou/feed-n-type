<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="flex min-h-screen flex-col">
	<main class="flex flex-grow flex-col">
		{@render children()}
	</main>

	<footer
		class="mt-auto flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 px-3 py-4 text-white sm:py-5"
	>
		<div class="max-w-xl text-center">
			<p class="mb-2 text-lg font-semibold drop-shadow-sm">
				🎮 Feed & Type - Making typing fun with content you love!
			</p>
			<p class="m-0 text-sm font-normal opacity-90">
				Practice with Minecraft, Roblox, Pokemon & more
			</p>
		</div>
	</footer>
</div>
