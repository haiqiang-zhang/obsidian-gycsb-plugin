/**
 * Settings tab UI for the YCSB Benchmark Plugin
 */

import { App, PluginSettingTab, Setting, TFile } from 'obsidian';
import { FileSuggest } from './file-suggest';
import type YCSBBenchmarkPlugin from '../../main';

export class YCSBSettingTab extends PluginSettingTab {
	plugin: YCSBBenchmarkPlugin;

	constructor(app: App, plugin: YCSBBenchmarkPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// API URL setting
		new Setting(containerEl)
			.setName('gYCSB Server API URL')
			.setDesc('The URL of your gYCSB Server API endpoint')
			.addText(text => text
				.setPlaceholder('http://localhost:5000/api/ycsb')
				.setValue(this.plugin.settings.apiUrl)
				.onChange(async (value) => {
					this.plugin.settings.apiUrl = value;
					await this.plugin.saveSettings();
				}));

		// Run property name setting
		new Setting(containerEl)
			.setName('Run property name')
			.setDesc('The frontmatter property used to determine if a benchmark should run (default: is_run)')
			.addText(text => text
				.setPlaceholder('is_run')
				.setValue(this.plugin.settings.runPropertyName)
				.onChange(async (value) => {
					this.plugin.settings.runPropertyName = value || 'is_run';
					await this.plugin.saveSettings();
				}));

		// Variables property name setting
		new Setting(containerEl)
			.setName('Variables property name')
			.setDesc('The frontmatter property used to get variables (default: [>] variables)')
			.addText(text => text
				.setPlaceholder('[>] variables')
				.setValue(this.plugin.settings.variablesPropertyName)
				.onChange(async (value) => {
					this.plugin.settings.variablesPropertyName = value || '[>] variables';
					await this.plugin.saveSettings();
				}));

		// Running name template setting
		new Setting(containerEl)
			.setName('Running name template')
			.setDesc('Template for generating running_name. Use {propertyName} to insert any frontmatter property value, and {filename} for the file name without extension.')
			.addText(text => text
				.setPlaceholder('{Operation}_{filename}')
				.setValue(this.plugin.settings.runningNameTemplate)
				.onChange(async (value) => {
					this.plugin.settings.runningNameTemplate = value || '{Operation}_{filename}';
					await this.plugin.saveSettings();
				}));

			
		// Enabled base files section
		new Setting(containerEl).setName('Enabled base files').setHeading();
		
		let inputEl: HTMLInputElement;
		new Setting(containerEl)
			.setName('Base file path')
			.setDesc('Start typing to search for .base files in your vault')
			.addText(text => {
				inputEl = text.inputEl;
				text.setPlaceholder('Search for .base file...');
				// Attach the file suggest to this text input
				new FileSuggest(this.app, text.inputEl, 'base');
			})
			.addButton(button => button
				.setButtonText('Add')
				.onClick(async () => {
					const inputValue = inputEl.value;
					if (inputValue && inputValue.endsWith('.base')) {
						if (!this.plugin.settings.enabledBasePaths.includes(inputValue)) {
							this.plugin.settings.enabledBasePaths.push(inputValue);
							await this.plugin.saveSettings();
							this.plugin.refreshRunButtons(); // Update run buttons
							inputEl.value = ''; // Clear the input
							this.display(); // Refresh the settings display
						}
					}
				}));

		// Display enabled base files as nested items under "Base file path"
		const enabledPaths = this.plugin.settings.enabledBasePaths;
		if (enabledPaths.length > 0) {
			// Create a nested container to visually group these as sub-items
			const enabledFilesContainer = containerEl.createDiv('gycsb-enabled-files-container');
			
			enabledPaths.forEach((filePath) => {
				const fileName = filePath.split('/').pop() || filePath;
				
				new Setting(enabledFilesContainer)
					.setName(fileName)
					.setDesc(filePath)
					.addButton(button => button
						.setButtonText('Remove')
						.setWarning()
						.onClick(async () => {
							this.plugin.settings.enabledBasePaths = 
								enabledPaths.filter(p => p !== filePath);
							await this.plugin.saveSettings();
							this.plugin.refreshRunButtons(); // Update run buttons
							this.display(); // Refresh the settings display
						}));
			});
		}
	}
}

