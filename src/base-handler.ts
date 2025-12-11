/**
 * Base file parsing and benchmark extraction logic
 */

import { App, TFile, parseYaml, BasesView } from 'obsidian';
import { BenchmarkEntry } from './types';

/**
 * Get the list of files referenced by a base file using the official BasesView API
 * @param baseView The BasesView instance containing the base data
 * @returns List of files referenced by the base
 */
export async function getBaseReferencedFiles(
	basesView: BasesView
): Promise<TFile[]> {
	const queryResult = basesView.data.data;
	if (queryResult) {
		return queryResult.map(entry => entry.file);
	}
	return [];
}

/**
 * Extract YAML content from a markdown file's body (not frontmatter)
 * @param content The full markdown content
 * @returns The YAML content from the body, or empty string if not found
 */
export function extractYamlFromBody(content: string): string {
	// Remove frontmatter first
	let bodyContent = content;
	const frontmatterMatch = content.match(/^---\n[\s\S]*?\n---\n/);
	if (frontmatterMatch) {
		bodyContent = content.slice(frontmatterMatch[0].length);
	}

	// Look for YAML code blocks in the body
	const yamlBlockMatch = bodyContent.match(/```yaml_ycsb_run\n([\s\S]*?)```/);
	let yamlContent = '';
	if (yamlBlockMatch) {
		yamlContent = yamlBlockMatch[1].trim();
	} else {
		// If no code block, try to parse the entire body as YAML
		// This handles cases where the entire body is YAML content
		const trimmedBody = bodyContent.trim();
		if (trimmedBody) {
			yamlContent = trimmedBody;
		}
	}

	// Normalize YAML: convert tabs to spaces (YAML requires spaces, not tabs)
	// Replace tabs with 2 spaces (common YAML indentation)
	if (yamlContent) {
		yamlContent = yamlContent.replace(/\t/g, '  ');
	}

	return yamlContent;
}



/**
 * Get the value of a property from a file's frontmatter
 * @param app The Obsidian App instance
 * @param file The file to get the property value from
 * @param propertyName The property name to get the value of
 * @returns The value of the property, or null if not found
 */
export function getPropertyValue(
	app: App,
	file: TFile,
	propertyName: string
): unknown {
	const cache = app.metadataCache.getFileCache(file);
	if (cache?.frontmatter) {
		return cache.frontmatter[propertyName];
	}
	return null;
}

/**
 * Get all frontmatter properties from a file
 * @param app The Obsidian App instance
 * @param file The file to get properties from
 * @returns Record of all frontmatter properties
 */
export function getAllProperties(app: App, file: TFile): Record<string, unknown> {
	const cache = app.metadataCache.getFileCache(file);
	if (cache?.frontmatter) {
		// Create a copy and process link values
		const properties: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(cache.frontmatter)) {
			if (typeof value === 'string') {
				// Strip [[]] if the value is a link
				properties[key] = value.replace(/^\[\[(.+?)\]\]$/, '$1');
			} else {
				properties[key] = value;
			}
		}
		return properties;
	}
	return {};
}

/**
 * Get all benchmark entries from a base file
 * @param app The Obsidian App instance
 * @param baseFilePath Path to the .base file
 * @param runPropertyName The frontmatter property name to check for run status
 * @returns List of benchmark entries
 */
export async function getBenchmarkEntries(
	app: App,
	baseFilePath: string,
	runPropertyName: string
): Promise<BenchmarkEntry[]> {
	const entries: BenchmarkEntry[] = [];

	let leaf = app.workspace.getLeavesOfType("bases").first();
	const basesView = leaf ? (leaf.view as any).controller.view as BasesView : null;
	if (!basesView){
		return entries;
	}

	const queryResult = basesView.data.data;
	if (!queryResult) {
		return entries;
	}

	console.log('[YCSB] Base entries:', queryResult);
	
	for (const entry of queryResult) {
		const file = entry.file;
		if (!file) {
			continue;
		}

		const isRun = getPropertyValue(app, file, runPropertyName) === true;
		
		if (isRun) {
			const content = await app.vault.read(file);
			const yamlContent = extractYamlFromBody(content);
			const variables = getPropertyValue(app, file, '[>] variables');
			const properties = getAllProperties(app, file);
			
			console.log('[YCSB] Properties:', properties);
			entries.push({
				filePath: file.path,
				yamlContent,
				isRun,
				variables,
				properties,
			});
		}
	}
	
	return entries;
}

/**
 * Get all runnable benchmark entries (run property === true) from a base file
 * @param app The Obsidian App instance
 * @param baseFilePath Path to the .base file
 * @param runPropertyName The frontmatter property name to check for run status
 * @returns List of benchmark entries where run property is true
 */
export async function getRunnableBenchmarks(
	app: App,
	baseFilePath: string,
	runPropertyName: string
): Promise<BenchmarkEntry[]> {
	const allEntries = await getBenchmarkEntries(app, baseFilePath, runPropertyName);
	return allEntries.filter(entry => entry.isRun);
}

