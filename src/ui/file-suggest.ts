/**
 * File suggestion component for input fields
 * Uses Obsidian's AbstractInputSuggest API for autocomplete dropdown
 */

import { AbstractInputSuggest, App, TFile } from 'obsidian';

export class FileSuggest extends AbstractInputSuggest<TFile> {
	private fileExtension: string;

	constructor(
		app: App,
		inputEl: HTMLInputElement,
		fileExtension: string = 'base'
	) {
		super(app, inputEl);
		this.fileExtension = fileExtension;
	}

	getSuggestions(query: string): TFile[] {
		const files = this.app.vault.getFiles().filter(
			(file: TFile) => file.extension === this.fileExtension
		);

		const lowerQuery = query.toLowerCase();
		return files.filter((file: TFile) => 
			file.path.toLowerCase().includes(lowerQuery) ||
			file.basename.toLowerCase().includes(lowerQuery)
		);
	}

	renderSuggestion(file: TFile, el: HTMLElement): void {
		el.createEl('div', { text: file.basename, cls: 'suggestion-title' });
		el.createEl('small', { text: file.path, cls: 'suggestion-note' });
	}

	selectSuggestion(file: TFile, evt: MouseEvent | KeyboardEvent): void {
		this.setValue(file.path);
		this.close();
	}
}

