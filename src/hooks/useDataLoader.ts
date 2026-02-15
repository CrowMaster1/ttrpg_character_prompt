import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { loadDataFile } from '../lib/utils';
import type { ControlsConfig } from '../types';

/**
 * Custom hook to load application data (controls config and data cache)
 * Runs once on component mount
 */
export function useDataLoader() {
  const { setControlsConfig, setDataCache } = useStore();
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const config: ControlsConfig = await loadDataFile('../controls.json');
      if (!config) {
        throw new Error('Failed to load controls.json');
      }
      setControlsConfig(config);

      const cache: Record<string, any> = {};
      const failedFiles: string[] = [];

      for (const [controlId, controlConfig] of Object.entries(config.controls)) {
        if (controlConfig.data_source) {
          const data = await loadDataFile(controlConfig.data_source);
          if (data) {
            cache[controlId] = data;
          } else {
            failedFiles.push(controlConfig.data_source);
          }
        }
      }

      setDataCache(cache);

      if (failedFiles.length > 0) {
        console.warn(`Failed to load ${failedFiles.length} data files:`, failedFiles);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError(error instanceof Error ? error : new Error('Unknown error loading data'));
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return { error, isLoading, retry: loadData };
}
