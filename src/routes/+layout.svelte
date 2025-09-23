<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div id="app-layout" class="flex min-h-screen flex-col" data-testid="app-layout">
	<main id="main-layout" class="flex flex-grow flex-col" data-testid="main-layout">
		{@render children()}
	</main>

	<footer
		id="app-footer"
		class="mt-auto flex flex-col items-center justify-center bg-[#b5b6e4] px-3 py-4 text-[#4f43ae] sm:py-5"
		data-testid="app-footer"
	>
		<div id="footer-content" class="max-w-xl text-center" data-testid="footer-content">
			<p id="footer-title" class="mb-2 text-lg font-semibold" data-testid="footer-title">
				Feed & Type - Making typing fun with content you love!
			</p>
			<p
				id="footer-description"
				class="m-0 text-sm font-normal opacity-90"
				data-testid="footer-description"
			>
				Practice with Minecraft, Roblox, Pokemon & more
			</p>
		</div>
	</footer>
</div>
