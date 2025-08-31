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
	 * PC keyboard layout with proper staggering and key arrangement.
	 * Represents the standard QWERTY layout with modifier keys.
	 * Each row contains regular keys and optional left/right modifiers.
	 */
	const keyboardRows = [
		// Numbers row - 15 keys total
		[
			{ key: '`', label: '`', class: 'regular-key' },
			{ key: '1', label: '1', class: 'regular-key' },
			{ key: '2', label: '2', class: 'regular-key' },
			{ key: '3', label: '3', class: 'regular-key' },
			{ key: '4', label: '4', class: 'regular-key' },
			{ key: '5', label: '5', class: 'regular-key' },
			{ key: '6', label: '6', class: 'regular-key' },
			{ key: '7', label: '7', class: 'regular-key' },
			{ key: '8', label: '8', class: 'regular-key' },
			{ key: '9', label: '9', class: 'regular-key' },
			{ key: '0', label: '0', class: 'regular-key' },
			{ key: '-', label: '-', class: 'regular-key' },
			{ key: '=', label: '=', class: 'regular-key' },
			{ key: 'Backspace', label: '⌫', class: 'regular-key double-width' },
		],
		// QWERTY row - 15 keys total
		[
			{ key: 'Tab', label: 'Tab', class: 'regular-key tab' },
			{ key: 'q', label: 'Q', class: 'regular-key' },
			{ key: 'w', label: 'W', class: 'regular-key' },
			{ key: 'e', label: 'E', class: 'regular-key' },
			{ key: 'r', label: 'R', class: 'regular-key' },
			{ key: 't', label: 'T', class: 'regular-key' },
			{ key: 'y', label: 'Y', class: 'regular-key' },
			{ key: 'u', label: 'U', class: 'regular-key' },
			{ key: 'i', label: 'I', class: 'regular-key' },
			{ key: 'o', label: 'O', class: 'regular-key' },
			{ key: 'p', label: 'P', class: 'regular-key' },
			{ key: '[', label: '[', class: 'regular-key' },
			{ key: ']', label: ']', class: 'regular-key' },
			{ key: '\\', label: '\\', class: 'regular-key' },
		],
		// ASDF row - 15 keys total
		[
			{ key: 'CapsLock', label: 'Caps', class: 'regular-key caps-lock' },
			{ key: 'a', label: 'A', class: 'regular-key' },
			{ key: 's', label: 'S', class: 'regular-key' },
			{ key: 'd', label: 'D', class: 'regular-key' },
			{ key: 'f', label: 'F', class: 'regular-key' },
			{ key: 'g', label: 'G', class: 'regular-key' },
			{ key: 'h', label: 'H', class: 'regular-key' },
			{ key: 'j', label: 'J', class: 'regular-key' },
			{ key: 'k', label: 'K', class: 'regular-key' },
			{ key: 'l', label: 'L', class: 'regular-key' },
			{ key: ';', label: ';', class: 'regular-key' },
			{ key: "'", label: "'", class: 'regular-key' },
			{ key: 'Enter', label: '↵', class: 'regular-key enter' },
		],
		// ZXCV row - 15 keys total
		[
			{ key: 'Shift', label: 'Shift', class: 'regular-key left-shift' },
			{ key: 'z', label: 'Z', class: 'regular-key' },
			{ key: 'x', label: 'X', class: 'regular-key' },
			{ key: 'c', label: 'C', class: 'regular-key' },
			{ key: 'v', label: 'V', class: 'regular-key' },
			{ key: 'b', label: 'B', class: 'regular-key' },
			{ key: 'n', label: 'N', class: 'regular-key' },
			{ key: 'm', label: 'M', class: 'regular-key' },
			{ key: ',', label: ',', class: 'regular-key' },
			{ key: '.', label: '.', class: 'regular-key' },
			{ key: '/', label: '/', class: 'regular-key' },
			{ key: 'RightShift', label: 'Shift', class: 'regular-key right-shift' },
		]
	];

	/**
	 * Bottom row with modifiers and space bar following PC layout conventions.
	 * Contains control keys, alt keys, space bar, and menu key.
	 */
	const bottomRow = [
		{ key: 'Ctrl', label: 'Ctrl', class: 'regular-key ctrl' },
		{ key: 'Fn', label: 'Fn', class: 'regular-key' },
		{ key: 'Win', label: '⊞', class: 'regular-key' },
		{ key: 'Alt', label: 'Alt', class: 'regular-key alt' },
		{ key: 'Space', label: '', class: 'regular-key space' },
		{ key: 'RightAlt', label: 'Alt', class: 'regular-key alt' },
		{ key: 'Menu', label: '☰', class: 'regular-key' },
		{ key: 'RightCtrl', label: 'Ctrl', class: 'regular-key ctrl' }
	];

	/**
	 * Handles virtual keyboard key clicks and maps them to appropriate functionality.
	 * Processes special keys (Space, Shift, modifiers) and regular character keys.
	 *
	 * @param key - The key identifier that was clicked
	 */
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

	/**
	 * Determines if a key should be visually highlighted as pressed.
	 * Handles special case mapping for space key and case-insensitive comparison.
	 *
	 * @param key - The key to check for pressed state
	 * @returns True if the key should appear pressed
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
	class="pc-keyboard"
	role="group"
	aria-label="Virtual keyboard"
	data-component-id={componentId}
	data-testid="virtual-keyboard"
>
	<!-- Main keyboard rows -->
	{#each keyboardRows as row, rowIndex (rowIndex)}
		<div
			id="keyboard-row-{rowIndex + 1}"
			class="keyboard-row row-{rowIndex + 1}"
			role="row"
			data-testid="keyboard-row-{rowIndex + 1}"
		>
			{#each row as keyObj, keyIdx (keyObj.key)}
				<button
					id="key-{keyObj.key.replace(/[^a-z0-9]/gi, '')}-{rowIndex}-{keyIdx}"
					class="key {keyObj.class} {isKeyPressed(keyObj.key) ? 'pressed' : ''}"
					onclick={() => handleKeyClick(keyObj.key)}
					type="button"
					aria-label="{keyObj.label || keyObj.key} key"
					aria-pressed={isKeyPressed(keyObj.key)}
					data-testid="keyboard-key-{keyObj.key.replace(/[^a-z0-9]/gi, '').toLowerCase()}"
				>
					{keyObj.label}
				</button>
			{/each}
		</div>
	{/each}

	<!-- Bottom row with space bar and modifiers -->
	<div
		id="keyboard-bottom-row"
		class="keyboard-row bottom-row"
		role="row"
		data-testid="keyboard-bottom-row"
	>
		{#each bottomRow as keyObj (keyObj.key)}
			<button
				id="key-{keyObj.key.toLowerCase().replace(/\s+/g, '-')}"
				class="key {keyObj.class} {isKeyPressed(keyObj.key) ? 'pressed' : ''}"
				onclick={() => handleKeyClick(keyObj.key)}
				type="button"
				aria-label={keyObj.key === 'Space' ? 'Space bar' : keyObj.label + ' key'}
				aria-pressed={isKeyPressed(keyObj.key)}
				data-testid="keyboard-key-{keyObj.key.toLowerCase().replace(/\s+/g, '-')}"
			>
				{keyObj.label}
			</button>
		{/each}
	</div>
</div>

<style>
	.pc-keyboard {
		background: #f5f5f7;
		border-radius: 12px;
		padding: 24px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		border: 1px solid #e1e1e3;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
		max-width: 900px;
		margin: 0 auto;
	}

	.keyboard-row {
		display: flex;
		justify-content: center;
		margin-bottom: 6px;
		gap: 6px;
	}

	/* All rows aligned flush - no staggering for rectangular layout */
	.row-1,
	.row-2,
	.row-3,
	.row-4 {
		margin-left: 0;
		padding-left: 0;
	}
	
	.bottom-row {
		margin-left: 0;
		margin-top: 6px;
		gap: 6px;
		justify-content: center;
	}

	.key {
		height: 48px;
		background: #ffffff;
		border: 1px solid #d1d1d6;
		border-radius: 6px;
		color: #333336;
		font-weight: 500;
		font-size: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 100ms ease;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05);
		user-select: none;
		-webkit-user-select: none;
	}

	.key:hover {
		background: #f8f8fa;
		border-color: #b8b8bd;
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08);
	}

	.key:active,
	.key.pressed {
		background: #007aff;
		color: white;
		border-color: #0051d5;
		transform: translateY(0);
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	/* Regular character keys - more square proportions */
	.regular-key {
		width: 48px;
		min-width: 48px;
		flex: 0 0 48px;
	}

	/* Modifier keys with proportional sizing */
	.double-width {
		width: 96px;
		flex: 0 0 96px;
	}
	
	.tab {
		width: 72px;
		font-size: 12px;
		flex: 0 0 72px;
	}

	.caps-lock {
		width: 84px;
		font-size: 12px;
		flex: 0 0 84px;
	}

	.left-shift {
		width: 108px;
		font-size: 12px;
		flex: 0 0 108px;
	}

	.right-shift {
		width: 132px;
		font-size: 12px;
		flex: 0 0 132px;
	}

	.enter {
		width: 108px;
		font-size: 12px;
		flex: 0 0 108px;
	}

	/* Bottom row modifiers */
	.ctrl,
	.alt {
		width: 60px;
		font-size: 12px;
		background: #f8f8fa;
		color: #666669;
		flex: 0 0 60px;
	}

	.menu {
		width: 60px;
		font-size: 12px;
		background: #f8f8fa;
		color: #666669;
		flex: 0 0 60px;
	}

	.space {
		width: 336px;
		background: #ffffff;
		flex: 0 0 336px;
	}

	/* Arrow keys removed from PC layout */

	/* Special visual effects for certain keys */
	.caps-lock.pressed {
		background: #34c759;
		color: white;
		border-color: #2ca048;
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
			padding: 20px;
			max-width: 100%;
		}

		.key {
			height: 40px;
			font-size: 13px;
		}

		.regular-key {
			width: 40px;
			min-width: 40px;
			flex: 0 0 40px;
		}

		.tab {
			width: 60px;
			flex: 0 0 60px;
		}
		.caps-lock {
			width: 70px;
			flex: 0 0 70px;
		}
		.left-shift,
		.right-shift {
			width: 90px;
			flex: 0 0 90px;
		}
		.backspace {
			width: 70px;
			flex: 0 0 70px;
		}
		.enter {
			width: 70px;
			flex: 0 0 70px;
		}
		.space {
			width: 240px;
			flex: 0 0 240px;
		}
		.ctrl,
		.alt {
			width: 50px;
			flex: 0 0 50px;
		}
		.menu {
			width: 50px;
			flex: 0 0 50px;
		}

		.row-1,
		.row-2,
		.row-3,
		.row-4 {
			padding-left: 0;
		}

		.keyboard-row {
			gap: 4px;
		}
	}

	@media (max-width: 640px) {
		.pc-keyboard {
			padding: 16px;
			max-width: 100%;
		}

		.key {
			height: 36px;
			font-size: 12px;
		}

		.regular-key {
			width: 32px;
			min-width: 32px;
			flex: 0 0 32px;
		}

		.tab {
			width: 48px;
			flex: 0 0 48px;
		}
		.caps-lock {
			width: 56px;
			flex: 0 0 56px;
		}
		.left-shift,
		.right-shift {
			width: 72px;
			flex: 0 0 72px;
		}
		.backspace {
			width: 56px;
			flex: 0 0 56px;
		}
		.enter {
			width: 56px;
			flex: 0 0 56px;
		}
		.space {
			width: 180px;
			flex: 0 0 180px;
		}
		.ctrl,
		.alt {
			width: 40px;
			flex: 0 0 40px;
		}
		.menu {
			width: 40px;
			flex: 0 0 40px;
		}

		.row-1,
		.row-2,
		.row-3,
		.row-4 {
			padding-left: 0;
		}

		.keyboard-row {
			margin-bottom: 3px;
			gap: 1px;
		}
	}
</style>
