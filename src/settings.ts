/**
 * Settings definitions and defaults for the YCSB Benchmark Plugin
 */

import { YCSBPluginSettings } from './types';

/**
 * Default settings for the plugin
 */
export const DEFAULT_SETTINGS: YCSBPluginSettings = {
	apiUrl: 'http://localhost:5000/api/ycsb',
	enabledBasePaths: [],
	runPropertyName: 'is_run',
	variablesPropertyName: '[>] variables',
	runningNameTemplate: '{Operation}_{filename}',
};

