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
	 * CSS Grid-based keyboard layout with 14-column grid system.
	 * Each row spans exactly 14 columns with proper key sizing.
	 * Grid spans: Regular keys (1), Backspace (2), Tab (1.5→2), Caps (1.75→2), Enter (2.25→2), Shifts (2.25→2 and 2.75→3)
	 */
	const keyboardRows = [
		// Row 1: Numbers - 14 columns total
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
		// Row 2: QWERTY - 14 columns total
		[
			{ key: 'Tab', label: 'Tab', span: 2 },
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
		// Row 3: ASDF - 14 columns total
		[
			{ key: 'CapsLock', label: 'Caps', span: 2 },
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
			{ key: 'Enter', label: '↵', span: 2 }
		],
		// Row 4: ZXCV - 14 columns total
		[
			{ key: 'Shift', label: 'Shift', span: 2 },
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
			{ key: 'RightShift', label: 'Shift', span: 3 }
		]
	];

	/**
	 * Bottom row with modifiers and space bar - 14 columns total.
	 * Space bar spans 6 columns for proper proportions.
	 */
	const bottomRow = [
		{ key: 'Ctrl', label: 'Ctrl', span: 1 },
		{ key: 'Fn', label: 'Fn', span: 1 },
		{ key: 'Win', label: '⊞', span: 1 },
		{ key: 'Alt', label: 'Alt', span: 1 },
		{ key: 'Space', label: '', span: 6 },
		{ key: 'RightAlt', label: 'Alt', span: 1 },
		{ key: 'Menu', label: '☰', span: 1 },
		{ key: 'RightCtrl', label: 'Ctrl', span: 2 }
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

<!-- Outer container: keyboard frame with padding -->
<div
	id="virtual-keyboard"
	class="pc-keyboard"
	role="group"
	aria-label="Virtual keyboard"
	data-component-id={componentId}
	data-testid="virtual-keyboard"
>
	<!-- Inner container: holds all 5 keyboard rows -->
	<div class="keyboard-container">
		<!-- Row 1: Number keys (14 columns total) -->
		<div
			id="keyboard-row-1"
			class="keyboard-row row-numbers"
			role="row"
			data-testid="keyboard-row-1"
		>
			{#each keyboardRows[0] as keyObj, keyIdx (keyObj.key)}
				<button
					id="key-{keyObj.key.replace(/[^a-z0-9]/gi, '')}-0-{keyIdx}"
					class="key {isKeyPressed(keyObj.key) ? 'pressed' : ''}"
					onclick={() => handleKeyClick(keyObj.key)}
					type="button"
					aria-label="{keyObj.label || keyObj.key} key"
					aria-pressed={isKeyPressed(keyObj.key)}
					data-testid="keyboard-key-{keyObj.key.replace(/[^a-z0-9]/gi, '').toLowerCase()}"
					style="grid-column: span {keyObj.span};"
				>
					{keyObj.label}
				</button>
			{/each}
		</div>

		<!-- Row 2: QWERTY row (14 columns total) -->
		<div
			id="keyboard-row-2"
			class="keyboard-row row-qwerty"
			role="row"
			data-testid="keyboard-row-2"
		>
			{#each keyboardRows[1] as keyObj, keyIdx (keyObj.key)}
				<button
					id="key-{keyObj.key.replace(/[^a-z0-9]/gi, '')}-1-{keyIdx}"
					class="key {isKeyPressed(keyObj.key) ? 'pressed' : ''}"
					onclick={() => handleKeyClick(keyObj.key)}
					type="button"
					aria-label="{keyObj.label || keyObj.key} key"
					aria-pressed={isKeyPressed(keyObj.key)}
					data-testid="keyboard-key-{keyObj.key.replace(/[^a-z0-9]/gi, '').toLowerCase()}"
					style="grid-column: span {keyObj.span};"
				>
					{keyObj.label}
				</button>
			{/each}
		</div>

		<!-- Row 3: ASDF row (14 columns total) -->
		<div
			id="keyboard-row-3"
			class="keyboard-row row-asdf"
			role="row"
			data-testid="keyboard-row-3"
		>
			{#each keyboardRows[2] as keyObj, keyIdx (keyObj.key)}
				<button
					id="key-{keyObj.key.replace(/[^a-z0-9]/gi, '')}-2-{keyIdx}"
					class="key {isKeyPressed(keyObj.key) ? 'pressed' : ''}"
					onclick={() => handleKeyClick(keyObj.key)}
					type="button"
					aria-label="{keyObj.label || keyObj.key} key"
					aria-pressed={isKeyPressed(keyObj.key)}
					data-testid="keyboard-key-{keyObj.key.replace(/[^a-z0-9]/gi, '').toLowerCase()}"
					style="grid-column: span {keyObj.span};"
				>
					{keyObj.label}
				</button>
			{/each}
		</div>

		<!-- Row 4: ZXCV row (14 columns total) -->
		<div
			id="keyboard-row-4"
			class="keyboard-row row-zxcv"
			role="row"
			data-testid="keyboard-row-4"
		>
			{#each keyboardRows[3] as keyObj, keyIdx (keyObj.key)}
				<button
					id="key-{keyObj.key.replace(/[^a-z0-9]/gi, '')}-3-{keyIdx}"
					class="key {isKeyPressed(keyObj.key) ? 'pressed' : ''}"
					onclick={() => handleKeyClick(keyObj.key)}
					type="button"
					aria-label="{keyObj.label || keyObj.key} key"
					aria-pressed={isKeyPressed(keyObj.key)}
					data-testid="keyboard-key-{keyObj.key.replace(/[^a-z0-9]/gi, '').toLowerCase()}"
					style="grid-column: span {keyObj.span};"
				>
					{keyObj.label}
				</button>
			{/each}
		</div>

		<!-- Row 5: Bottom control row (14 columns total) -->
		<div
			id="keyboard-bottom-row"
			class="keyboard-row row-bottom"
			role="row"
			data-testid="keyboard-bottom-row"
		>
			{#each bottomRow as keyObj (keyObj.key)}
				<button
					id="key-{keyObj.key.toLowerCase().replace(/\s+/g, '-')}"
					class="key {isKeyPressed(keyObj.key) ? 'pressed' : ''} {keyObj.key === 'Space' ? 'space-key' : keyObj.key.includes('Ctrl') || keyObj.key.includes('Alt') || keyObj.key === 'Menu' ? 'modifier-key' : ''}"
					onclick={() => handleKeyClick(keyObj.key)}
					type="button"
					aria-label={keyObj.key === 'Space' ? 'Space bar' : keyObj.label + ' key'}
					aria-pressed={isKeyPressed(keyObj.key)}
					data-testid="keyboard-key-{keyObj.key.toLowerCase().replace(/\s+/g, '-')}"
					style="grid-column: span {keyObj.span};"
				>
					{keyObj.label}
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	/* Outer container: keyboard frame with padding */
	.pc-keyboard {
		background: #f5f5f7;
		border-radius: 16px;
		padding: 24px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
		border: 1px solid #e1e1e3;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
		max-width: 920px;
		min-width: 600px;
		margin: 0 auto;
		width: 100%;
		box-sizing: border-box;
	}

	/* Inner container: holds all 5 keyboard rows */
	.keyboard-container {
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;
		min-width: 0; /* Prevent flex children from overflowing */
	}

	/* Each row is a separate grid container with fixed 14-column layout */
	.keyboard-row {
		display: grid;
		grid-template-columns: repeat(14, 1fr);
		gap: 6px;
		width: 100%;
		min-width: 0; /* Prevent grid overflow */
		overflow: hidden; /* Prevent any wrapping */
	}

	.key {
		height: 52px;
		min-height: 52px;
		background: #ffffff;
		border: 1px solid #d1d1d6;
		border-radius: 8px;
		color: #1d1d1f;
		font-weight: 600;
		font-size: 15px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: default;
		transition: all 120ms ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
		user-select: none;
		-webkit-user-select: none;
		position: relative;
	}

	.key:hover {
		background: #f0f0f2;
		border-color: #a8a8ad;
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08);
	}

	.key:active,
	.key.pressed {
		background: #007aff;
		color: white;
		border-color: #0051d5;
		transform: translateY(1px);
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	/* Special key styling */
	.space-key {
		background: #fafafa;
		border: 1px solid #d1d1d6;
		font-size: 0;
	}

	.space-key:hover {
		background: #f0f0f2;
	}

	.modifier-key {
		background: #f8f8fa;
		color: #6c757d;
		font-size: 13px;
		font-weight: 500;
	}

	.modifier-key:hover {
		background: #ebebed;
		color: #495057;
	}

	/* Special visual effects for certain keys */
	button[id*="key-capslock"].pressed {
		background: #34c759 !important;
		color: white !important;
		border-color: #2ca048 !important;
	}

	/* Responsive design - maintain 5-row structure at all screen sizes */
	@media (max-width: 900px) {
		.pc-keyboard {
			padding: 20px 16px;
			max-width: 100%;
			min-width: 480px; /* Prevent crushing */
		}

		.keyboard-container {
			gap: 6px;
		}

		.key {
			height: 44px;
			min-height: 44px;
			font-size: 14px;
		}

		.keyboard-row {
			gap: 4px;
		}

		.modifier-key {
			font-size: 12px;
		}
	}

	@media (max-width: 640px) {
		.pc-keyboard {
			padding: 16px 12px;
			max-width: 100%;
			min-width: 400px; /* Prevent crushing on small screens */
		}

		.keyboard-container {
			gap: 4px;
		}

		.key {
			height: 38px;
			min-height: 38px;
			font-size: 13px;
			min-width: 20px; /* Prevent keys from becoming too small */
		}

		.keyboard-row {
			gap: 2px;
		}

		.modifier-key {
			font-size: 11px;
		}
	}

	/* Extra small screens - ensure keyboard remains usable */
	@media (max-width: 420px) {
		.pc-keyboard {
			padding: 12px 8px;
			min-width: 360px;
		}

		.key {
			height: 32px;
			min-height: 32px;
			font-size: 12px;
			min-width: 18px;
		}

		.keyboard-row {
			gap: 1px;
		}

		.keyboard-container {
			gap: 3px;
		}

		.modifier-key {
			font-size: 10px;
		}
	}
</style>
