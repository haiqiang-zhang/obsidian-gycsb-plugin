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

		// Header
		containerEl.createEl('h1', { text: 'YCSB Benchmark settings' });

		// API URL setting
		new Setting(containerEl)
			.setName('YCSB Benchmark API URL')
			.setDesc('The URL of your YCSB Server API endpoint')
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

		// Enabled base files section
		containerEl.createEl('h2', { text: 'Enabled base files' });
		containerEl.createEl('p', { 
			text: 'Select the base files where you want to enable the YCSB benchmark functionality.',
			cls: 'setting-item-description'
		});

		
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

		// Display enabled base files
		const enabledPaths = this.plugin.settings.enabledBasePaths;
		if (enabledPaths.length > 0) {
			
			for (const filePath of enabledPaths) {
				const fileName = filePath.split('/').pop() || filePath;
				
				new Setting(containerEl)
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
			}
		}
	}
}

