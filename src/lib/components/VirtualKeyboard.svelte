<script lang="ts">
	/**
	 * Props interface for the VirtualKeyboard component.
	 * Provides an interactive virtual keyboard with visual feedback.
	 */
	interface Props {
		onKeyPress: (key: string) => void;
		pressedKey?: string;
		capsLockOn?: boolean;
		onCapsLockToggle?: () => void;
		'data-component-id'?: string;
	}

	let {
		onKeyPress,
		pressedKey,
		capsLockOn = false,
		onCapsLockToggle,
		'data-component-id': componentId
	}: Props = $props();

	/**
	 * Keyboard layout with CSS Grid configuration.
	 * Each key has a span property to define how many grid columns it occupies.
	 */
	const keyboardLayout = [
		// Row 1: Numbers (14 columns total)
		[
			{ key: '`', label: '~ `', span: 1 },
			{ key: '1', label: '! 1', span: 1 },
			{ key: '2', label: '@ 2', span: 1 },
			{ key: '3', label: '# 3', span: 1 },
			{ key: '4', label: '$ 4', span: 1 },
			{ key: '5', label: '% 5', span: 1 },
			{ key: '6', label: '^ 6', span: 1 },
			{ key: '7', label: '& 7', span: 1 },
			{ key: '8', label: '* 8', span: 1 },
			{ key: '9', label: '( 9', span: 1 },
			{ key: '0', label: ') 0', span: 1 },
			{ key: '-', label: '_|-', span: 1 },
			{ key: '=', label: '+ =', span: 1 },
			{ key: 'Backspace', label: 'delete', span: 2 }
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
			{ key: '[', label: '{ [', span: 1 },
			{ key: ']', label: '} ]', span: 1 },
			{ key: '\\', label: '| \\', span: 1 }
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
			{ key: ';', label: ': ;', span: 1 },
			{ key: "'", label: '" \'', span: 1 },
			{ key: 'Enter', label: 'return', span: 2 }
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
			{ key: ',', label: '< ,', span: 1 },
			{ key: '.', label: '> .', span: 1 },
			{ key: '/', label: '? /', span: 1 },
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
		} else if (key === 'CapsLock') {
			// Toggle caps lock state
			onCapsLockToggle?.();
			return;
		} else if (
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
	<div class="flex flex-col gap-1">
		{#each keyboardLayout as row, rowIndex (rowIndex)}
			{@const gridTemplate =
				rowIndex === 0
					? 'repeat(15, 1fr)'
					: rowIndex === 1
						? 'repeat(15, 1fr)'
						: rowIndex === 2
							? 'repeat(15, 1fr)'
							: rowIndex === 3
								? '2.5fr repeat(10, 1fr) 2.5fr'
								: 'repeat(15, 1fr)'}
			<div
				class="grid gap-1"
				style="grid-template-columns: {gridTemplate};"
				role="row"
				data-testid="keyboard-row-{rowIndex + 1}"
			>
				{#each row as keyObj (keyObj.key)}
					<button
						class="relative flex h-12 cursor-pointer rounded-lg border border-gray-300 bg-white font-normal
							   text-gray-700 transition-all duration-100
							   hover:-translate-y-0.5 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md
							   active:translate-y-0 active:border-blue-600 active:bg-blue-500 active:text-white active:shadow-inner
							   {isKeyPressed(keyObj.key) ? 'border-blue-600 bg-blue-500 text-white shadow-inner' : ''}
							   {['Ctrl', 'Alt', 'LeftMenu', 'Menu', 'AltGr', 'RightCtrl', 'Space'].includes(keyObj.key)
							? 'items-end justify-center pb-1'
							: ['Tab', 'CapsLock', 'Shift'].includes(keyObj.key)
								? 'items-end justify-start pb-1 pl-2'
								: ['Backspace', 'Enter', 'RightShift'].includes(keyObj.key)
									? 'items-end justify-end pr-2 pb-1'
									: 'flex-col items-center justify-center gap-0.5 p-1'}"
						class:text-xs={![
							'Tab',
							'CapsLock',
							'Enter',
							'Shift',
							'RightShift',
							'Backspace',
							'Ctrl',
							'Alt',
							'LeftMenu',
							'Menu',
							'AltGr',
							'RightCtrl',
							'Space'
						].includes(keyObj.key)}
						style="grid-column: span {keyObj.span}; {[
							'Tab',
							'CapsLock',
							'Enter',
							'Shift',
							'RightShift',
							'Backspace',
							'Ctrl',
							'Alt',
							'LeftMenu',
							'Menu',
							'AltGr',
							'RightCtrl',
							'Space'
						].includes(keyObj.key)
							? 'font-size: 9px !important;'
							: 'font-size: 12px !important;'}"
						onclick={() => handleKeyClick(keyObj.key)}
						type="button"
						aria-label="{keyObj.key} key"
						aria-pressed={isKeyPressed(keyObj.key)}
						data-testid="keyboard-key-{keyObj.key.toLowerCase()}"
					>
						{#if keyObj.key === 'CapsLock'}
							<!-- Caps Lock with indicator -->
							<div
								class="absolute top-2 left-2 h-1.5 w-1.5 rounded-full bg-gray-400 transition-colors duration-200"
								class:bg-green-500={capsLockOn}
								class:bg-gray-400={!capsLockOn}
							></div>
							<span class="mb-1 leading-none">{keyObj.label}</span>
						{:else if keyObj.label.includes(' ')}
							{@const parts = keyObj.label.split(' ')}
							<span class="text-[10px] leading-none text-gray-400">{parts[0]}</span>
							<span class="leading-none">{parts[1]}</span>
						{:else if keyObj.label.includes('|')}
							{@const parts = keyObj.label.split('|')}
							<span class="-mt-1 text-[10px] leading-none text-gray-400">{parts[0]}</span>
							<span class="leading-none">{parts[1]}</span>
						{:else}
							{keyObj.label}
						{/if}
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
