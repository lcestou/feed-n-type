<script lang="ts">
	/**
	 * Props interface for the VirtualKeyboard component.
	 * Provides an interactive virtual keyboard with visual feedback.
	 */
	interface Props {
		onKeyPress: (key: string) => void;
		pressedKey?: string;
		'data-component-id'?: string;
	}

	let { onKeyPress, pressedKey, 'data-component-id': componentId }: Props = $props();

	/**
	 * Keyboard layout with CSS Grid configuration.
	 * Each key has a span property to define how many grid columns it occupies.
	 */
	const keyboardLayout = [
		// Row 1: Numbers (14 columns total)
		[
			{ key: '`', label: '`', span: 1 },
			{ key: '1', label: '1', span: 1 },
			{ key: '2', label: '2', span: 1 },
			{ key: '3', label: '3', span: 1 },
			{ key: '4', label: '4', span: 1 },
			{ key: '5', label: '5', span: 1 },
			{ key: '6', label: '6', span: 1 },
			{ key: '7', label: '7', span: 1 },
			{ key: '8', label: '8', span: 1 },
			{ key: '9', label: '9', span: 1 },
			{ key: '0', label: '0', span: 1 },
			{ key: '-', label: '-', span: 1 },
			{ key: '=', label: '=', span: 1 },
			{ key: 'Backspace', label: '⌫', span: 2 }
		],
		// Row 2: QWERTY (15 columns total)
		[
			{ key: 'Tab', label: 'tab', span: 2 },
			{ key: 'q', label: 'Q', span: 1 },
			{ key: 'w', label: 'W', span: 1 },
			{ key: 'e', label: 'E', span: 1 },
			{ key: 'r', label: 'R', span: 1 },
			{ key: 't', label: 'T', span: 1 },
			{ key: 'y', label: 'Y', span: 1 },
			{ key: 'u', label: 'U', span: 1 },
			{ key: 'i', label: 'I', span: 1 },
			{ key: 'o', label: 'O', span: 1 },
			{ key: 'p', label: 'P', span: 1 },
			{ key: '[', label: '[', span: 1 },
			{ key: ']', label: ']', span: 1 },
			{ key: '\\', label: '\\', span: 1 }
		],
		// Row 3: ASDF (15 columns total)
		[
			{ key: 'CapsLock', label: 'caps', span: 2 },
			{ key: 'a', label: 'A', span: 1 },
			{ key: 's', label: 'S', span: 1 },
			{ key: 'd', label: 'D', span: 1 },
			{ key: 'f', label: 'F', span: 1 },
			{ key: 'g', label: 'G', span: 1 },
			{ key: 'h', label: 'H', span: 1 },
			{ key: 'j', label: 'J', span: 1 },
			{ key: 'k', label: 'K', span: 1 },
			{ key: 'l', label: 'L', span: 1 },
			{ key: ';', label: ';', span: 1 },
			{ key: "'", label: "'", span: 1 },
			{ key: 'Enter', label: 'enter', span: 2 }
		],
		// Row 4: ZXCV (15 columns total)
		[
			{ key: 'Shift', label: 'shift', span: 2.5 },
			{ key: 'z', label: 'Z', span: 1 },
			{ key: 'x', label: 'X', span: 1 },
			{ key: 'c', label: 'C', span: 1 },
			{ key: 'v', label: 'V', span: 1 },
			{ key: 'b', label: 'B', span: 1 },
			{ key: 'n', label: 'N', span: 1 },
			{ key: 'm', label: 'M', span: 1 },
			{ key: ',', label: ',', span: 1 },
			{ key: '.', label: '.', span: 1 },
			{ key: '/', label: '/', span: 1 },
			{ key: 'RightShift', label: 'shift', span: 2.5 }
		],
		// Row 5: Bottom row (15 columns total)
		[
			{ key: 'Ctrl', label: 'ctrl', span: 1 },
			{ key: 'Alt', label: 'alt', span: 1 },
			{ key: 'LeftMenu', label: 'menu', span: 2 },
			{ key: 'Space', label: 'space', span: 7 },
			{ key: 'Menu', label: 'menu', span: 2 },
			{ key: 'AltGr', label: 'alt', span: 1 },
			{ key: 'RightCtrl', label: 'ctrl', span: 1 }
		]
	];

	/**
	 * Handles virtual keyboard key clicks.
	 */
	function handleKeyClick(key: string) {
		if (key === 'Space') {
			onKeyPress(' ');
		} else if (
			key === 'CapsLock' ||
			key === 'Win' ||
			key === 'Fn' ||
			key === 'RightFn' ||
			key === 'Menu' ||
			key === 'LeftMenu' ||
			key === 'AltGr' ||
			key === 'Ctrl' ||
			key === 'Alt' ||
			key === 'RightCtrl'
		) {
			// These keys don't produce characters (bottom row visual only)
			return;
		} else if (key === 'RightShift' || key === 'Shift') {
			onKeyPress('Shift');
		} else {
			onKeyPress(key);
		}
	}

	/**
	 * Determines if a key should be highlighted as pressed.
	 */
	function isKeyPressed(key: string): boolean {
		if (key === 'Space') {
			return pressedKey === ' ';
		}
		return pressedKey === key || pressedKey === key.toLowerCase();
	}
</script>

<div
	id="virtual-keyboard"
	class="mx-auto w-full max-w-4xl rounded-xl border border-gray-200 bg-gray-100 p-6 shadow-lg"
	role="group"
	aria-label="Virtual keyboard"
	data-component-id={componentId}
	data-testid="virtual-keyboard"
>
	<div class="flex flex-col gap-2">
		{#each keyboardLayout as row, rowIndex (rowIndex)}
			{@const gridTemplate = rowIndex === 0 ? 'repeat(15, 1fr)' : 
									   rowIndex === 1 ? 'repeat(15, 1fr)' :
									   rowIndex === 2 ? 'repeat(15, 1fr)' :
									   rowIndex === 3 ? '2.5fr repeat(10, 1fr) 2.5fr' :
									   'repeat(15, 1fr)'}
			<div
				class="grid gap-2"
				style="grid-template-columns: {gridTemplate};"
				role="row"
				data-testid="keyboard-row-{rowIndex + 1}"
			>
				{#each row as keyObj (keyObj.key)}
					<button
						class="flex h-12 cursor-pointer items-center justify-center rounded-lg border border-gray-300
							   bg-white text-sm font-semibold text-gray-700 transition-all duration-100
							   hover:-translate-y-0.5 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md
							   active:translate-y-0 active:border-blue-600 active:bg-blue-500 active:text-white active:shadow-inner
							   {isKeyPressed(keyObj.key) ? 'border-blue-600 bg-blue-500 text-white shadow-inner' : ''}"
						style="grid-column: span {keyObj.span};"
						onclick={() => handleKeyClick(keyObj.key)}
						type="button"
						aria-label="{keyObj.key} key"
						aria-pressed={isKeyPressed(keyObj.key)}
						data-testid="keyboard-key-{keyObj.key.toLowerCase()}"
					>
						{keyObj.label}
					</button>
				{/each}
			</div>
		{/each}
	</div>
</div>

<style>
	/* Minimal custom CSS - mostly using Tailwind */
	.grid {
		/* Ensures grid columns are exactly equal width */
		width: 100%;
	}
</style>
