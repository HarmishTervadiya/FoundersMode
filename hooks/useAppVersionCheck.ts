import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

interface AppConfig {
  min_version: string;
  ios_store_url: string;
  android_store_url: string;
}

export function useAppVersionCheck() {
  const [isOutdated, setIsOutdated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [storeUrl, setStoreUrl] = useState<string | null>(null);

  const checkVersion = async () => {
    setLoading(true);
    setError(false);
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), 10000)
      );

      // Race the supabase query against the timeout
      const { data, error: supabaseError } = (await Promise.race([
        supabase
          .from('app_config')
          .select('min_version, ios_store_url, android_store_url')
          .single(),
        timeoutPromise.then(() => {
          throw new Error('Timeout');
        }),
      ])) as any; // Cast to any to handle the race result types easier

      if (supabaseError) throw supabaseError;

      if (data) {
        const config = data as AppConfig;
        const currentVersion = Constants.expoConfig?.version || '1.0.0';

        if (compareVersions(currentVersion, config.min_version) < 0) {
          setIsOutdated(true);
          setStoreUrl(Platform.OS === 'ios' ? config.ios_store_url : config.android_store_url);
        }
      }
    } catch (e) {
      console.error('Version check failed:', e);
      // Only set error if it's not a generic checking issue,
      // but here we want to block on connectivity issues too if specific.
      // For now, any failure to check configuration is critical?
      // User asked for "fetch failing due to slow internet".
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkVersion();
  }, []);

  return { isOutdated, loading, error, storeUrl, checkVersion };
}

// Returns:
// -1 if v1 < v2
// 0 if v1 == v2
// 1 if v1 > v2
function compareVersions(v1: string, v2: string): number {
  const v1Parts = v1.split('.').map(Number);
  const v2Parts = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const p1 = v1Parts[i] || 0;
    const p2 = v2Parts[i] || 0;

    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }

  return 0;
}
