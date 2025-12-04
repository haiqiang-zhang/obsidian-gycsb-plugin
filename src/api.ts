/**
 * Flask API client for YCSB Benchmark
 */

import { Notice, requestUrl } from 'obsidian';
import { BenchmarkApiResponse, BenchmarkEntry } from './types';

/**
 * Send a YAML workload to the Flask server for YCSB benchmark execution
 * @param apiUrl The Flask server API URL
 * @param entry The benchmark entry containing YAML content
 * @returns Promise with the API response
 */
export async function sendBenchmarkRequest(
	apiUrl: string,
	entry: BenchmarkEntry
): Promise<BenchmarkApiResponse> {
	try {
		const body = {
			filePath: entry.filePath,
			yamlContent: entry.yamlContent,
			variables: entry.variables ?? null,
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
 */
export async function runBenchmarks(
	apiUrl: string,
	entries: BenchmarkEntry[]
): Promise<void> {
	const runnableEntries = entries.filter(e => e.isRun);
	
	if (runnableEntries.length === 0) {
		new Notice('No benchmarks with is_run=true found');
		return;
	}

	new Notice(`Running ${runnableEntries.length} benchmark(s)...`);

	let successCount = 0;
	let failCount = 0;

	for (const entry of runnableEntries) {
		const result = await sendBenchmarkRequest(apiUrl, entry);
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

