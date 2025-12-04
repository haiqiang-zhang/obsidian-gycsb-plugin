/**
 * Run button injection for enabled base views
 */

import { App, setIcon, WorkspaceLeaf } from 'obsidian';
import { getRunnableBenchmarks } from '../base-handler';
import { runBenchmarks } from '../api';
import { YCSBPluginSettings } from '../types';

const RUN_BUTTON_CLASS = 'ycsb-run-button';

/**
 * Create a run button element
 * @param onClick Callback when button is clicked
 * @returns The button element
 */
function createRunButton(onClick: () => void): HTMLElement {
	const button = document.createElement('button');
	button.className = `clickable-icon view-action ${RUN_BUTTON_CLASS}`;
	button.title = 'Run YCSB benchmarks';
	
	// Add play icon
	setIcon(button, 'play');
	
	button.addEventListener('click', (evt) => {
		evt.stopPropagation();
		onClick();
	});
	
	return button;
}

/**
 * Check if a leaf is displaying an enabled base file
 * @param leaf The workspace leaf to check
 * @param enabledBasePaths List of enabled base file paths
 * @returns The base file path if enabled, null otherwise
 */
function getEnabledBasePath(
	leaf: WorkspaceLeaf,
	enabledBasePaths: string[]
): string | null {
	const view = leaf.view;
	const viewType = view.getViewType();
	if (viewType === 'bases') {
		const viewAny = view as any;
		const file = viewAny.file;
		if (file) {
			if (enabledBasePaths.includes(file.path)) {
				return file.path;
			}
		}
	}
	return null;
}

/**
 * Update run button on a leaf - add if enabled, remove if not
 * @param app The Obsidian App instance
 * @param leaf The workspace leaf
 * @param settings Plugin settings
 */
export function updateRunButtonOnLeaf(
	app: App,
	leaf: WorkspaceLeaf,
	settings: YCSBPluginSettings
): void {
	const containerEl = leaf.view.containerEl;
	const existingButton = containerEl.querySelector(`.${RUN_BUTTON_CLASS}`);
	const basePath = getEnabledBasePath(leaf, settings.enabledBasePaths);
	
	// If not enabled, remove button if it exists
	if (!basePath) {
		if (existingButton) {
			existingButton.remove();
		}
		return;
	}

	// If enabled and button already exists, keep it
	if (existingButton) return;

	// Try multiple selectors for the view header
	const selectors = [
		'.view-header .view-actions'
	];
	
	let viewHeader: Element | null = null;
	for (const selector of selectors) {
		viewHeader = containerEl.querySelector(selector);
		if (viewHeader) {
			break;
		}
	}

	if (!viewHeader) {
		console.error('[YCSB] Could not find view header');
		return;
	}

	// Create and add the button
	const runButton = createRunButton(async () => {
		const entries = await getRunnableBenchmarks(app, basePath, settings.runPropertyName);
		await runBenchmarks(settings.apiUrl, entries);
	});

	// Insert at the beginning of the actions
	viewHeader.insertBefore(runButton, viewHeader.firstChild);
}

/**
 * Remove run button from a leaf if present
 * @param leaf The workspace leaf
 */
export function removeRunButtonFromLeaf(leaf: WorkspaceLeaf): void {
	const button = leaf.view.containerEl.querySelector(`.${RUN_BUTTON_CLASS}`);
	if (button) {
		button.remove();
	}
}

/**
 * Refresh run buttons on all leaves
 * @param app The Obsidian App instance
 * @param settings Plugin settings
 */
export function refreshAllRunButtons(
	app: App,
	settings: YCSBPluginSettings
): void {
	// Update all leaves - will add or remove buttons as needed
	app.workspace.iterateAllLeaves((leaf) => {
		updateRunButtonOnLeaf(app, leaf, settings);
	});
}

/**
 * Setup workspace event handlers for run button management
 * @param app The Obsidian App instance
 * @param settings Plugin settings
 * @param registerEvent Function to register events for cleanup
 */
export function setupRunButtonHandlers(
	app: App,
	getSettings: () => YCSBPluginSettings,
	registerEvent: (event: ReturnType<typeof app.workspace.on>) => void
): void {
	// Handle layout changes
	registerEvent(
		app.workspace.on('layout-change', () => {
			app.workspace.iterateAllLeaves((leaf) => {
				updateRunButtonOnLeaf(app, leaf, getSettings());
			});
		})
	);

	// Handle active leaf changes
	registerEvent(
		app.workspace.on('active-leaf-change', (leaf) => {
			if (leaf) {
				updateRunButtonOnLeaf(app, leaf, getSettings());
			}
		})
	);

	// Handle file opens
	registerEvent(
		app.workspace.on('file-open', () => {
			const activeLeaf = app.workspace.getLeaf();
			if (activeLeaf) {
				updateRunButtonOnLeaf(app, activeLeaf, getSettings());
			}
		})
	);
}

