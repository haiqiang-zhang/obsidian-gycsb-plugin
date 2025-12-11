/**
 * TypeScript interfaces and types for the YCSB Benchmark Plugin
 */

/**
 * Plugin settings interface
 */
export interface YCSBPluginSettings {
	/** URL of the Flask server API endpoint */
	apiUrl: string;
	/** List of base file paths that are enabled for this plugin */
	enabledBasePaths: string[];
	/** The frontmatter property name used to determine if a benchmark should run */
	runPropertyName: string;
	/** Template for generating running_name, supports {propertyName} and {filename} placeholders */
	runningNameTemplate: string;
}

/**
 * Represents a benchmark entry from a base file
 */
export interface BenchmarkEntry {
	/** The file path of the benchmark note */
	filePath: string;
	/** The YAML workload content from the file body */
	yamlContent: string;
	/** Whether this benchmark should be run */
	isRun: boolean;
	/** The variables from the [>] variables column, or null if not present */
	variables: unknown | null;
	/** All frontmatter properties from the file */
	properties: Record<string, unknown>;
}

/**
 * Response from the Flask API
 */
export interface BenchmarkApiResponse {
	success: boolean;
	message?: string;
	data?: unknown;
}

