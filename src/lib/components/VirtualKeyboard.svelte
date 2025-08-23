<script lang="ts">
	interface Props {
		onKeyPress: (key: string) => void;
		pressedKey?: string;
	}

	let { onKeyPress, pressedKey }: Props = $props();

	// PC keyboard layout with proper staggering and key arrangement
	const keyboardRows = [
		// Numbers row with symbols
		{
			keys: ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
			leftModifier: null,
			rightModifier: { key: 'Backspace', label: 'Backspace', class: 'backspace' }
		},
		// QWERTY row
		{
			keys: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
			leftModifier: { key: 'Tab', label: 'Tab', class: 'tab' },
			rightModifier: null
		},
		// ASDF row (home row)
		{
			keys: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
			leftModifier: { key: 'CapsLock', label: 'Caps Lock', class: 'caps-lock' },
			rightModifier: { key: 'Enter', label: 'Enter', class: 'enter' }
		},
		// ZXCV row
		{
			keys: ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
			leftModifier: { key: 'Shift', label: 'Shift', class: 'left-shift' },
			rightModifier: { key: 'RightShift', label: 'Shift', class: 'right-shift' }
		}
	];

	// Bottom row with modifiers and space bar - PC layout
	const bottomRowKeys = [
		{ key: 'Ctrl', label: 'Ctrl', class: 'ctrl' },
		{ key: 'Alt', label: 'Alt', class: 'alt' },
		{ key: 'Space', label: '', class: 'space' },
		{ key: 'RightAlt', label: 'Alt', class: 'alt' },
		{ key: 'Menu', label: 'Menu', class: 'menu' },
		{ key: 'RightCtrl', label: 'Ctrl', class: 'ctrl' }
	];

	function handleKeyClick(key: string) {
		// Map display keys to actual functionality
		if (key === 'Space') {
			onKeyPress(' ');
		} else if (key === 'CapsLock') {
			// CapsLock doesn't produce characters in our simple implementation
			return;
		} else if (key === 'RightShift' || key === 'Shift') {
			onKeyPress('Shift');
		} else if (['Ctrl', 'Alt', 'RightCtrl', 'RightAlt', 'Menu'].includes(key)) {
			// Modifier keys don't produce characters
			return;
		} else {
			onKeyPress(key);
		}
	}

	function isKeyPressed(key: string): boolean {
		if (key === 'Space') {
			return pressedKey === ' ';
		}
		return pressedKey === key || pressedKey === key.toLowerCase();
	}
</script>

<div id="virtual-keyboard" class="pc-keyboard" role="group" aria-label="Virtual keyboard">
	<!-- Main keyboard rows -->
	{#each keyboardRows as row, rowIndex}
		<div id="keyboard-row-{rowIndex + 1}" class="keyboard-row row-{rowIndex + 1}" role="row">
			<!-- Left modifier key -->
			{#if row.leftModifier}
				<button 
					id="key-{row.leftModifier.key.toLowerCase()}"
					class="key modifier-key {row.leftModifier.class} {isKeyPressed(row.leftModifier.key) ? 'pressed' : ''}"
					onclick={() => handleKeyClick(row.leftModifier.key)}
					type="button"
					aria-label="{row.leftModifier.label} key"
					aria-pressed={isKeyPressed(row.leftModifier.key)}
				>
					{row.leftModifier.label}
				</button>
			{/if}
			
			<!-- Regular keys -->
			{#each row.keys as key, keyIndex}
				<button 
					id="key-{key.replace(/[^a-z0-9]/gi, '')}-{rowIndex}-{keyIndex}"
					class="key regular-key {isKeyPressed(key) ? 'pressed' : ''}"
					onclick={() => handleKeyClick(key)}
					type="button"
					aria-label="{key.toUpperCase()} key"
					aria-pressed={isKeyPressed(key)}
				>
					{key.toUpperCase()}
				</button>
			{/each}
			
			<!-- Right modifier key -->
			{#if row.rightModifier}
				<button 
					id="key-{row.rightModifier.key.toLowerCase()}"
					class="key modifier-key {row.rightModifier.class} {isKeyPressed(row.rightModifier.key) ? 'pressed' : ''}"
					onclick={() => handleKeyClick(row.rightModifier.key)}
					type="button"
					aria-label="{row.rightModifier.label} key"
					aria-pressed={isKeyPressed(row.rightModifier.key)}
				>
					{row.rightModifier.label}
				</button>
			{/if}
		</div>
	{/each}

	<!-- Bottom row with space bar and modifiers -->
	<div id="keyboard-bottom-row" class="keyboard-row bottom-row" role="row">
		{#each bottomRowKeys as key, keyIndex}
			<button 
				id="key-{key.key.toLowerCase().replace(/\s+/g, '-')}"
				class="key {key.class} {isKeyPressed(key.key) ? 'pressed' : ''}"
				onclick={() => handleKeyClick(key.key)}
				type="button"
				aria-label="{key.key === 'Space' ? 'Space bar' : key.label + ' key'}"
				aria-pressed={isKeyPressed(key.key)}
			>
				{key.label}
			</button>
		{/each}
	</div>
</div>

<style>
	.pc-keyboard {
		background: #f8f9fa;
		border-radius: 8px;
		padding: 16px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		border: 1px solid #dee2e6;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		max-width: 800px;
		margin: 0 auto;
	}

	.keyboard-row {
		display: flex;
		justify-content: center;
		margin-bottom: 4px;
		gap: 2px;
	}

	/* Row staggering for standard PC keyboard layout */
	.row-1 { margin-left: 0; }
	.row-2 { margin-left: 24px; }
	.row-3 { margin-left: 36px; }
	.row-4 { margin-left: 48px; }
	.bottom-row { 
		margin-left: 0; 
		margin-top: 8px;
		gap: 2px;
	}

	.key {
		height: 36px;
		background: #ffffff;
		border: 1px solid #ced4da;
		border-radius: 4px;
		color: #495057;
		font-weight: 500;
		font-size: 13px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: default;
		transition: all 150ms ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
		user-select: none;
		-webkit-user-select: none;
	}

	.key:hover {
		background: #f8f9fa;
		border-color: #adb5bd;
		transform: translateY(-1px);
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
	}

	.key:active,
	.key.pressed {
		background: #e9ecef;
		border-color: #6c757d;
		transform: translateY(0);
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	/* Regular character keys */
	.regular-key {
		width: 36px;
		min-width: 36px;
	}

	/* Modifier keys with proper PC sizing */
	.tab {
		width: 60px;
		font-size: 11px;
	}

	.caps-lock {
		width: 72px;
		font-size: 11px;
	}

	.left-shift {
		width: 88px;
		font-size: 11px;
	}

	.right-shift {
		width: 88px;
		font-size: 11px;
	}

	.backspace {
		width: 72px;
		font-size: 11px;
	}

	.enter {
		width: 72px;
		font-size: 11px;
	}

	/* Bottom row modifiers */
	.ctrl,
	.alt {
		width: 52px;
		font-size: 11px;
		background: #f1f3f4;
		color: #495057;
	}

	.menu {
		width: 44px;
		font-size: 10px;
		background: #f1f3f4;
		color: #495057;
	}

	.space {
		width: 240px;
		background: #ffffff;
	}

	/* Arrow keys removed from PC layout */

	/* Special visual effects for certain keys */
	.caps-lock.pressed {
		background: #0d6efd;
		color: white;
		border-color: #0a58ca;
	}

	.ctrl,
	.alt,
	.menu {
		color: #6c757d;
	}

	.ctrl:hover,
	.alt:hover,
	.menu:hover {
		color: #495057;
		background: #e9ecef;
	}

	/* Responsive design */
	@media (max-width: 900px) {
		.pc-keyboard {
			padding: 16px;
			max-width: 700px;
		}

		.key {
			height: 32px;
			font-size: 12px;
		}

		.regular-key {
			width: 32px;
			min-width: 32px;
		}

		.tab { width: 52px; }
		.caps-lock { width: 64px; }
		.left-shift, .right-shift { width: 76px; }
		.backspace { width: 64px; }
		.enter { width: 64px; }
		.space { width: 200px; }
		.ctrl, .alt { width: 44px; }
		.menu { width: 36px; }

		.row-2 { margin-left: 20px; }
		.row-3 { margin-left: 32px; }
		.row-4 { margin-left: 40px; }
	}

	@media (max-width: 640px) {
		.pc-keyboard {
			padding: 12px;
			max-width: 100%;
		}

		.key {
			height: 28px;
			font-size: 11px;
		}

		.regular-key {
			width: 28px;
			min-width: 28px;
		}

		.tab { width: 44px; }
		.caps-lock { width: 56px; }
		.left-shift, .right-shift { width: 64px; }
		.backspace { width: 56px; }
		.enter { width: 56px; }
		.space { width: 160px; }
		.ctrl, .alt { width: 36px; }
		.menu { width: 32px; }

		.row-2 { margin-left: 16px; }
		.row-3 { margin-left: 24px; }
		.row-4 { margin-left: 32px; }

		.keyboard-row {
			margin-bottom: 3px;
			gap: 1px;
		}
	}
</style>