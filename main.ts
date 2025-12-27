/**
 * YCSB Benchmark Plugin for Obsidian
 * 
 * This plugin allows running YCSB benchmarks from Obsidian Bases.
 * Each row in a base can contain a YAML workload configuration,
 * which is sent to a Flask server API for benchmark execution.
 */

import { Notice, Plugin } from 'obsidian';
import { YCSBPluginSettings } from './src/types';
import { DEFAULT_SETTINGS } from './src/settings';
import { YCSBSettingTab } from './src/ui/settings-tab';
import { 
	refreshAllRunButtons, 
	setupRunButtonHandlers 
} from './src/ui/run-button';
import { getRunnableBenchmarks } from './src/base-handler';
import { runBenchmarks } from './src/api';

export default class YCSBBenchmarkPlugin extends Plugin {
	settings: YCSBPluginSettings;

	async onload() {
		await this.loadSettings();

		// Add settings tab
		this.addSettingTab(new YCSBSettingTab(this.app, this));

		// Add command to run all benchmarks from enabled bases
		this.addCommand({
			id: 'run-all-ycsb-benchmarks',
			name: 'Run all YCSB benchmarks',
			callback: async () => {
				await this.runAllEnabledBenchmarks();
			}
		});

		// Add command to run benchmarks for current base
		this.addCommand({
			id: 'run-current-base-benchmarks',
			name: 'Run YCSB benchmarks for current base',
			checkCallback: (checking: boolean) => {
				const basePath = this.getCurrentBasePath();
				if (basePath && this.settings.enabledBasePaths.includes(basePath)) {
					if (!checking) {
						this.runCurrentBaseBenchmarks();
					}
					return true;
				}
				return false;
			}
		});

		// Setup run button handlers for base views
		setupRunButtonHandlers(
			this.app, 
			() => this.settings,
			(event) => this.registerEvent(event)
		);

		// Initial refresh of run buttons after layout is ready
		this.app.workspace.onLayoutReady(() => {
			this.refreshRunButtons();
		});
	}

	onunload() {
		// Cleanup is handled automatically by registerEvent
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Refresh run buttons on all enabled base views
	 */
	refreshRunButtons(): void {
		refreshAllRunButtons(this.app, this.settings);
	}

	/**
	 * Get the path of the currently active base file
	 */
	private getCurrentBasePath(): string | null {
		const activeFile = this.app.workspace.getActiveFile();
		if (activeFile && activeFile.extension === 'base') {
			return activeFile.path;
		}
		return null;
	}

	/**
	 * Run benchmarks for the current active base file
	 */
	private async runCurrentBaseBenchmarks(): Promise<void> {
		const basePath = this.getCurrentBasePath();
		if (!basePath) {
			new Notice('Please open a .base file first');
			return;
		}
		if (!this.settings.enabledBasePaths.includes(basePath)) {
			new Notice('This base is not enabled. Enable it in settings first.');
			return;
		}
		await this.runBenchmarksForBase(basePath);
	}

	/**
	 * Run benchmarks for a specific base file
	 */
	private async runBenchmarksForBase(basePath: string): Promise<void> {
		const entries = await getRunnableBenchmarks(
			this.app, 
			basePath, 
			this.settings.runPropertyName,
			this.settings.variablesPropertyName
		);
		await runBenchmarks(
			this.settings.apiUrl, 
			entries,
			this.settings.runningNameTemplate,
			this.settings.runPropertyName
		);
	}

	/**
	 * Run all benchmarks from all enabled base files
	 */
	private async runAllEnabledBenchmarks(): Promise<void> {
		for (const basePath of this.settings.enabledBasePaths) {
			const entries = await getRunnableBenchmarks(
				this.app, 
				basePath,
				this.settings.runPropertyName,
				this.settings.variablesPropertyName
			);
			await runBenchmarks(
				this.settings.apiUrl, 
				entries,
				this.settings.runningNameTemplate,
				this.settings.runPropertyName
			);
		}
	}
}
