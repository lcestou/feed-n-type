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
	 * Simple keyboard layout with fixed rows.
	 * Each row is an array of key objects.
	 */
	const row1 = ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'];
	const row2 = ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'];
	const row3 = ['CapsLock', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'];
	const row4 = ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'RightShift'];
	const row5 = ['Ctrl', 'Fn', 'Win', 'Alt', 'Space', 'AltGr', 'Menu', 'RightCtrl'];

	/**
	 * Get display label for a key
	 */
	function getKeyLabel(key: string): string {
		const labels: Record<string, string> = {
			Backspace: '⌫',
			Tab: 'Tab',
			CapsLock: 'Caps Lock',
			Enter: '↵',
			Shift: 'Shift',
			RightShift: 'Shift',
			Ctrl: 'Ctrl',
			RightCtrl: 'Ctrl',
			Alt: 'Alt',
			AltGr: 'Alt',
			Win: '⊞',
			Fn: 'Fn',
			Menu: '☰',
			Space: ''
		};
		return labels[key] || key.toUpperCase();
	}

	/**
	 * Get CSS class for special keys
	 */
	function getKeyClass(key: string): string {
		const classes: Record<string, string> = {
			Backspace: 'key-backspace',
			Tab: 'key-tab',
			CapsLock: 'key-caps',
			Enter: 'key-enter',
			Shift: 'key-shift-left',
			RightShift: 'key-shift-right',
			Space: 'key-space',
			Ctrl: 'key-ctrl',
			RightCtrl: 'key-ctrl',
			Alt: 'key-alt',
			AltGr: 'key-alt',
			Win: 'key-mod',
			Fn: 'key-mod',
			Menu: 'key-mod'
		};
		return classes[key] || 'key-regular';
	}

	/**
	 * Handles virtual keyboard key clicks.
	 */
	function handleKeyClick(key: string) {
		if (key === 'Space') {
			onKeyPress(' ');
		} else if (key === 'CapsLock' || key === 'Win' || key === 'Fn' || key === 'Menu' || key === 'AltGr') {
			// These keys don't produce characters
			return;
		} else if (key === 'RightShift' || key === 'Shift') {
			onKeyPress('Shift');
		} else if (key === 'Ctrl' || key === 'Alt' || key === 'RightCtrl') {
			// Modifier keys don't produce characters
			return;
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
	class="keyboard-frame"
	role="group"
	aria-label="Virtual keyboard"
	data-component-id={componentId}
	data-testid="virtual-keyboard"
>
	<div class="keyboard-container">
		<!-- Row 1: Numbers -->
		<div class="keyboard-row">
			{#each row1 as key}
				<button
					class="key {getKeyClass(key)} {isKeyPressed(key) ? 'pressed' : ''}"
					onclick={() => handleKeyClick(key)}
					type="button"
					aria-label="{key} key"
					aria-pressed={isKeyPressed(key)}
				>
					{getKeyLabel(key)}
				</button>
			{/each}
		</div>

		<!-- Row 2: QWERTY -->
		<div class="keyboard-row">
			{#each row2 as key}
				<button
					class="key {getKeyClass(key)} {isKeyPressed(key) ? 'pressed' : ''}"
					onclick={() => handleKeyClick(key)}
					type="button"
					aria-label="{key} key"
					aria-pressed={isKeyPressed(key)}
				>
					{getKeyLabel(key)}
				</button>
			{/each}
		</div>

		<!-- Row 3: ASDF -->
		<div class="keyboard-row">
			{#each row3 as key}
				<button
					class="key {getKeyClass(key)} {isKeyPressed(key) ? 'pressed' : ''}"
					onclick={() => handleKeyClick(key)}
					type="button"
					aria-label="{key} key"
					aria-pressed={isKeyPressed(key)}
				>
					{getKeyLabel(key)}
				</button>
			{/each}
		</div>

		<!-- Row 4: ZXCV -->
		<div class="keyboard-row">
			{#each row4 as key}
				<button
					class="key {getKeyClass(key)} {isKeyPressed(key) ? 'pressed' : ''}"
					onclick={() => handleKeyClick(key)}
					type="button"
					aria-label="{key} key"
					aria-pressed={isKeyPressed(key)}
				>
					{getKeyLabel(key)}
				</button>
			{/each}
		</div>

		<!-- Row 5: Bottom control row -->
		<div class="keyboard-row">
			{#each row5 as key}
				<button
					class="key {getKeyClass(key)} {isKeyPressed(key) ? 'pressed' : ''}"
					onclick={() => handleKeyClick(key)}
					type="button"
					aria-label="{key} key"
					aria-pressed={isKeyPressed(key)}
				>
					{getKeyLabel(key)}
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.keyboard-frame {
		background: #f5f5f7;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		border: 1px solid #e1e1e3;
		max-width: 900px;
		margin: 0 auto;
		width: 100%;
	}

	.keyboard-container {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.keyboard-row {
		display: flex;
		gap: 6px;
		justify-content: center;
	}

	.key {
		height: 48px;
		min-width: 48px;
		background: #ffffff;
		border: 1px solid #d1d1d6;
		border-radius: 8px;
		color: #333336;
		font-weight: 600;
		font-size: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 100ms ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
		padding: 0 8px;
		flex-shrink: 0;
	}

	.key:hover {
		background: #f8f8fa;
		border-color: #b8b8bd;
		transform: translateY(-1px);
		box-shadow: 0 3px 6px rgba(0, 0, 0, 0.12);
	}

	.key:active,
	.key.pressed {
		background: #007aff;
		color: white;
		border-color: #0051d5;
		transform: translateY(0);
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	/* Regular keys - standard width */
	.key-regular {
		width: 48px;
	}

	/* Special key widths */
	.key-backspace {
		width: 96px;
	}

	.key-tab {
		width: 72px;
	}

	.key-caps {
		width: 84px;
	}

	.key-enter {
		width: 84px;
	}

	.key-shift-left {
		width: 108px;
	}

	.key-shift-right {
		width: 108px;
	}

	.key-space {
		width: 280px;
	}

	.key-ctrl,
	.key-alt,
	.key-mod {
		width: 60px;
		font-size: 12px;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.keyboard-frame {
			padding: 16px;
		}

		.keyboard-row {
			gap: 4px;
		}

		.key {
			height: 42px;
			min-width: 36px;
			font-size: 12px;
			padding: 0 4px;
		}

		.key-regular {
			width: 36px;
		}

		.key-backspace {
			width: 72px;
		}

		.key-tab {
			width: 54px;
		}

		.key-caps {
			width: 64px;
		}

		.key-enter {
			width: 64px;
		}

		.key-shift-left,
		.key-shift-right {
			width: 80px;
		}

		.key-space {
			width: 200px;
		}

		.key-ctrl,
		.key-alt,
		.key-mod {
			width: 45px;
			font-size: 11px;
		}
	}

	@media (max-width: 480px) {
		.keyboard-frame {
			padding: 12px;
		}

		.keyboard-row {
			gap: 3px;
		}

		.key {
			height: 36px;
			min-width: 28px;
			font-size: 11px;
			padding: 0 2px;
		}

		.key-regular {
			width: 28px;
		}

		.key-backspace {
			width: 56px;
		}

		.key-tab {
			width: 42px;
		}

		.key-caps {
			width: 50px;
		}

		.key-enter {
			width: 50px;
		}

		.key-shift-left,
		.key-shift-right {
			width: 64px;
		}

		.key-space {
			width: 150px;
		}

		.key-ctrl,
		.key-alt,
		.key-mod {
			width: 35px;
			font-size: 10px;
		}
	}
</style>