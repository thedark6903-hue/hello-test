import { APP_VERSION } from '../version.ts';

export const APP_NAME = 'Hello Test';
export const APP_BUILD_NUMBER = 1;

export interface VersionInfo {
  version: string;
  buildNumber?: number;
  releaseNotes?: string;
  downloadUrl?: string;
  publishedAt?: string;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  latestVersion: string;
  releaseNotes?: string;
  downloadUrl?: string;
  checkedAt: Date;
}

/**
 * Checks for updates against the version.json file or release endpoint.
 * Compares against the dynamically read APP_VERSION from src/version.ts.
 */
export async function checkForAppUpdates(): Promise<UpdateCheckResult> {
  try {
    const res = await fetch('/version.json', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.version && data.version !== APP_VERSION) {
        return {
          hasUpdate: true,
          latestVersion: data.version,
          releaseNotes: data.releaseNotes || 'New features and improvements.',
          downloadUrl: data.downloadUrl || '#',
          checkedAt: new Date(),
        };
      }
    }
  } catch (err) {
    console.warn('Unable to reach update server:', err);
  }
  return {
    hasUpdate: false,
    latestVersion: APP_VERSION,
    checkedAt: new Date(),
  };
}
