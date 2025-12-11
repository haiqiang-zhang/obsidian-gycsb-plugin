/**
 * Flask API client for YCSB Benchmark
 */

import { Notice, requestUrl } from 'obsidian';
import { BenchmarkApiResponse, BenchmarkEntry } from './types';

/**
 * Generate the running_name based on the template
 * @param template The template string with {propertyName} and {filename} placeholders
 * @param entry The benchmark entry
 * @returns The generated running_name
 */
export function generateRunningName(template: string, entry: BenchmarkEntry): string {
	// Extract filename without extension from the file path
	const pathParts = entry.filePath.split('/');
	const fullFileName = pathParts[pathParts.length - 1] || '';
	const fileName = fullFileName.replace(/\.[^/.]+$/, ''); // Remove extension
	
	// Replace {filename} first (special built-in placeholder)
	let result = template.replace(/\{filename\}/gi, fileName);
	
	// Replace all {propertyName} placeholders with values from frontmatter properties
	result = result.replace(/\{([^}]+)\}/g, (match, propertyName) => {
		const value = entry.properties[propertyName];
		if (value !== undefined && value !== null) {
			return String(value);
		}
		return ''; // Return empty string if property not found
	});
	
	return result;
}

/**
 * Send a YAML workload to the Flask server for YCSB benchmark execution
 * @param apiUrl The Flask server API URL
 * @param entry The benchmark entry containing YAML content
 * @param runningNameTemplate Template for generating running_name
 * @returns Promise with the API response
 */
export async function sendBenchmarkRequest(
	apiUrl: string,
	entry: BenchmarkEntry,
	runningNameTemplate: string
): Promise<BenchmarkApiResponse> {
	try {
		const runningName = generateRunningName(runningNameTemplate, entry);
		const body = {
			filePath: entry.filePath,
			yamlContent: entry.yamlContent,
			variables: entry.variables ?? null,
			running_name: runningName,
		};
		console.log('[YCSB] Sending benchmark request:', body);
		const response = await requestUrl({
			url: apiUrl,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		});

		if (response.status >= 200 && response.status < 300) {
			return {
				success: true,
				message: `Benchmark for ${entry.filePath} submitted successfully`,
				data: response.json,
			};
		} else {
			return {
				success: false,
				message: `Server error: ${response.status}`,
			};
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		return {
			success: false,
			message: `Request failed: ${errorMessage}`,
		};
	}
}

/**
 * Run all benchmarks and send to the Flask server
 * @param apiUrl The Flask server API URL
 * @param entries List of benchmark entries to run
 * @param runningNameTemplate Template for generating running_name
 * @param runPropertyName The property name used to determine if a benchmark should run
 */
export async function runBenchmarks(
	apiUrl: string,
	entries: BenchmarkEntry[],
	runningNameTemplate: string,
	runPropertyName: string
): Promise<void> {
	const runnableEntries = entries.filter(e => e.isRun);
	
	if (runnableEntries.length === 0) {
		new Notice(`No benchmarks with ${runPropertyName}=true found`);
		return;
	}

	new Notice(`Running ${runnableEntries.length} benchmark(s)...`);

	let successCount = 0;
	let failCount = 0;

	for (const entry of runnableEntries) {
		const result = await sendBenchmarkRequest(apiUrl, entry, runningNameTemplate);
		if (result.success) {
			successCount++;
		} else {
			failCount++;
			console.error(`Failed to run benchmark for ${entry.filePath}: ${result.message}`);
		}
	}

	if (failCount === 0) {
		new Notice(`All ${successCount} benchmark(s) submitted successfully`);
	} else {
		new Notice(`Completed: ${successCount} success, ${failCount} failed`);
	}
}

