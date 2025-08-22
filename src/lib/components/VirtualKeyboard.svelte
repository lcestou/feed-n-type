<script lang="ts">
	interface Props {
		onKeyPress: (key: string) => void;
		pressedKey?: string;
	}

	let { onKeyPress, pressedKey }: Props = $props();

	// Define keyboard layout
	const keyboardLayout = [
		// Number row
		['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
		// Top row
		['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
		// Middle row  
		['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'"],
		// Bottom row
		['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '?', '!']
	];

	// Special keys
	const specialKeys = [
		{ key: 'Tab', label: 'Tab', width: 'w-16' },
		{ key: 'Shift', label: 'Shift', width: 'w-20' },
		{ key: 'Space', label: 'Space', width: 'w-64' },
		{ key: 'Enter', label: 'Enter', width: 'w-20' },
		{ key: 'Backspace', label: '⌫', width: 'w-20' }
	];

	// Punctuation keys
	const punctuationKeys = ['"', ':'];

	function handleKeyClick(key: string) {
		onKeyPress(key);
	}

	function isKeyPressed(key: string): boolean {
		return pressedKey === key || pressedKey === key.toLowerCase();
	}
</script>

<div class="virtual-keyboard bg-gray-800 p-4 rounded-lg shadow-2xl">
	<div class="keyboard-container space-y-2">
		<!-- Main keyboard rows -->
		{#each keyboardLayout as row, rowIndex}
			<div class="keyboard-row flex justify-center gap-1">
				{#if rowIndex === 2}
					<!-- Add Tab before middle row -->
					<button 
						class="key special-key {specialKeys[0].width} {isKeyPressed(specialKeys[0].key) ? 'pressed' : ''}"
						onclick={() => handleKeyClick(specialKeys[0].key)}
						type="button"
					>
						{specialKeys[0].label}
					</button>
				{/if}
				
				{#each row as key}
					<button 
						class="key letter-key {isKeyPressed(key) ? 'pressed' : ''}"
						onclick={() => handleKeyClick(key.toLowerCase())}
						type="button"
					>
						{key}
					</button>
				{/each}
				
				{#if rowIndex === 3}
					<!-- Add Shift after bottom row -->
					<button 
						class="key special-key {specialKeys[1].width} {isKeyPressed(specialKeys[1].key) ? 'pressed' : ''}"
						onclick={() => handleKeyClick(specialKeys[1].key)}
						type="button"
					>
						{specialKeys[1].label}
					</button>
				{/if}
			</div>
		{/each}

		<!-- Additional punctuation row -->
		<div class="keyboard-row flex justify-center gap-1">
			{#each punctuationKeys as key}
				<button 
					class="key letter-key {isKeyPressed(key) ? 'pressed' : ''}"
					onclick={() => handleKeyClick(key)}
					type="button"
				>
					{key}
				</button>
			{/each}
		</div>

		<!-- Special keys row -->
		<div class="keyboard-row flex justify-center gap-1 items-center">
			<button 
				class="key special-key {specialKeys[4].width} {isKeyPressed(specialKeys[4].key) ? 'pressed' : ''}"
				onclick={() => handleKeyClick('Backspace')}
				type="button"
			>
				{specialKeys[4].label}
			</button>
			
			<button 
				class="key special-key {specialKeys[2].width} {isKeyPressed(' ') ? 'pressed' : ''}"
				onclick={() => handleKeyClick(' ')}
				type="button"
			>
				{specialKeys[2].label}
			</button>
			
			<button 
				class="key special-key {specialKeys[3].width} {isKeyPressed(specialKeys[3].key) ? 'pressed' : ''}"
				onclick={() => handleKeyClick('Enter')}
				type="button"
			>
				{specialKeys[3].label}
			</button>
		</div>
	</div>
</div>

<style>
	.key {
		height: 3rem;
		min-width: 40px;
		background-color: rgb(55 65 81);
		color: white;
		border-radius: 0.375rem;
		border: 1px solid rgb(75 85 99);
		font-weight: 500;
		font-size: 0.875rem;
		transition: all 150ms ease-in-out;
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
		cursor: default;
	}
	
	.key:hover {
		background-color: rgb(75 85 99);
		box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
	}
	
	.key:active {
		background-color: rgb(107 114 128);
		transform: scale(0.95);
	}
	
	.key:focus {
		outline: none;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
	}
	
	.letter-key {
		width: 2.5rem;
	}
	
	.special-key {
		background-color: rgb(75 85 99);
		font-size: 0.75rem;
	}
	
	.special-key:hover {
		background-color: rgb(107 114 128);
	}
	
	.key.pressed {
		background-color: rgb(59 130 246);
		color: white;
		transform: scale(0.95);
		box-shadow: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
	}
	
	.keyboard-row {
		flex-wrap: wrap;
	}
	
	@media (max-width: 640px) {
		.key {
			height: 2.5rem;
			min-width: 35px;
			font-size: 0.75rem;
		}
		
		.letter-key {
			width: 2rem;
		}
		
		.virtual-keyboard {
			padding: 0.5rem;
		}
		
		.keyboard-container {
			gap: 0.25rem;
		}
		
		.keyboard-row {
			gap: 0.125rem;
		}
	}
</style>