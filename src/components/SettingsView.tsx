import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  RotateCw,
  CheckCircle2,
  Download,
  Sparkles,
  Sun,
  Moon,
  Laptop,
  Smartphone,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { CapacitorHttp } from '@capacitor/core';
import { APP_VERSION, VERSION_CODE } from '../version.ts';

const GITHUB_REPO = 'thedark6903-hue/hello-test';

export type ThemePreference = 'system' | 'light' | 'dark';

type UpdateCheckResult = {
  hasUpdate: boolean;
  latestVersion: string;
  releaseNotes?: string;
  downloadUrl?: string;
  checkedAt: Date;
};

function compareVersions(a: string, b: string) {
  const aParts = a.replace(/^v/i, '').split('.').map(Number);
  const bParts = b.replace(/^v/i, '').split('.').map(Number);

  const length = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < length; i++) {
    const aPart = Number.isFinite(aParts[i]) ? aParts[i] : 0;
    const bPart = Number.isFinite(bParts[i]) ? bParts[i] : 0;

    if (aPart > bPart) return 1;
    if (aPart < bPart) return -1;
  }

  return 0;
}

interface SettingsViewProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  isDark: boolean;
  onShowToast: (msg: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  isOpen,
  onClose,
  theme,
  onThemeChange,
  isDark,
  onShowToast,
}) => {
  const [checking, setChecking] = useState(false);
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);

  const handleCheckUpdates = async () => {
    if (checking) return;

    setChecking(true);

    try {
      const versionUrl =
        `https://raw.githubusercontent.com/${GITHUB_REPO}/main/version.json?_=${Date.now()}`;

      const response = await CapacitorHttp.get({
        url: versionUrl,
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Version file HTTP ${response.status}`);
      }

      const data =
        typeof response.data === 'string'
          ? JSON.parse(response.data)
          : response.data;

      const latestVersion = String(data?.version || '')
        .replace(/^v/i, '')
        .trim();

      const downloadUrl = String(
        data?.apk ||
        `https://github.com/${GITHUB_REPO}/releases/latest/download/app-release.apk`
      ).trim();

      if (!latestVersion) {
        throw new Error('version.json has no version');
      }

      const result: UpdateCheckResult = {
        hasUpdate: compareVersions(latestVersion, APP_VERSION) > 0,
        latestVersion,
        releaseNotes: data?.releaseNotes || 'New features and improvements.',
        downloadUrl,
        checkedAt: new Date(),
      };

      setUpdateResult(result);

      if (result.hasUpdate) {
        onShowToast(`Update ${result.latestVersion} available!`);
      } else {
        onShowToast(`You're using the latest version (${APP_VERSION}).`);
      }
    } catch (error) {
      console.error('Update check failed:', error);

      const message =
        error instanceof Error ? error.message : String(error);

      setUpdateResult(null);
      onShowToast(`Update check failed: ${message}`);
    } finally {
      setChecking(false);
    }
  };

  const handleDownloadUpdate = (url?: string) => {
    const apkUrl =
      url ||
      `https://github.com/${GITHUB_REPO}/releases/latest/download/app-release.apk`;

    onShowToast('Starting APK download...');
    window.open(apkUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="settings-view-overlay"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className={`fixed inset-0 z-40 flex flex-col ${
            isDark
              ? 'bg-[#121214] text-[#EDEDED]'
              : 'bg-[#F9F9F9] text-[#1A1A1A]'
          } overflow-y-auto`}
        >
          <div
            className={`sticky top-0 z-50 px-4 py-3.5 flex items-center justify-between border-b backdrop-blur-md ${
              isDark
                ? 'bg-[#121214]/90 border-zinc-800'
                : 'bg-[#F9F9F9]/90 border-gray-200/80'
            }`}
          >
            <button
              id="settings-back-btn"
              type="button"
              onClick={onClose}
              className={`p-2 rounded-full transition-colors flex items-center gap-1.5 text-sm font-medium cursor-pointer ${
                isDark
                  ? 'hover:bg-zinc-800 text-zinc-300'
                  : 'hover:bg-gray-200 text-gray-700'
              }`}
              aria-label="Back to home"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>

            <h2 className="text-base font-semibold tracking-tight">
              Settings & Update Center
            </h2>

            <div className="w-14" />
          </div>

          <div className="max-w-md w-full mx-auto p-4 sm:p-6 space-y-6 pb-12">
            <div
              className={`p-5 rounded-3xl border transition-all ${
                isDark
                  ? 'bg-zinc-900/90 border-zinc-800 shadow-lg shadow-black/20'
                  : 'bg-white border-gray-100 shadow-md shadow-gray-200/50'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-bold text-xl">
                  HT
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold tracking-tight truncate">
                      Hello Test
                    </h3>

                    <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>
                  </div>

                  <p
                    className={`text-xs ${
                      isDark ? 'text-zinc-400' : 'text-gray-500'
                    }`}
                  >
                    Version{' '}
                    <span className="font-mono font-medium">
                      {APP_VERSION}
                    </span>{' '}
                    (Build #{VERSION_CODE})
                  </p>
                </div>
              </div>
            </div>

            <div
              id="update-center-card"
              className={`p-5 rounded-3xl border transition-all ${
                isDark
                  ? 'bg-zinc-900/90 border-zinc-800'
                  : 'bg-white border-gray-100 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <RefreshCw
                    className={`w-4 h-4 ${
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    }`}
                  />

                  <h4 className="text-xs uppercase font-bold tracking-wider text-gray-400">
                    Update Center
                  </h4>
                </div>

                {updateResult?.checkedAt && (
                  <span
                    className={`text-[11px] ${
                      isDark ? 'text-zinc-500' : 'text-gray-400'
                    }`}
                  >
                    Checked{' '}
                    {updateResult.checkedAt.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>

              {updateResult && !checking && (
                <div className="mb-4">
                  {updateResult.hasUpdate ? (
                    <div
                      className={`p-4 rounded-2xl border ${
                        isDark
                          ? 'bg-blue-950/30 border-blue-800/40 text-blue-200'
                          : 'bg-blue-50 border-blue-200 text-blue-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-semibold text-sm mb-1.5">
                        <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
                        <span>
                          Update v{updateResult.latestVersion} Available!
                        </span>
                      </div>

                      {updateResult.releaseNotes && (
                        <p
                          className={`text-xs whitespace-pre-line mb-3 leading-relaxed ${
                            isDark ? 'text-zinc-300' : 'text-gray-700'
                          }`}
                        >
                          {updateResult.releaseNotes}
                        </p>
                      )}

                      <button
                        id="download-update-btn"
                        type="button"
                        onClick={() =>
                          handleDownloadUpdate(updateResult.downloadUrl)
                        }
                        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Update APK</span>
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`p-3.5 rounded-2xl border flex items-center gap-2.5 ${
                        isDark
                          ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />

                      <span className="text-xs font-medium">
                        You're using the latest version ({APP_VERSION})
                      </span>
                    </div>
                  )}
                </div>
              )}

              <button
                id="check-updates-btn"
                type="button"
                disabled={checking}
                onClick={handleCheckUpdates}
                className={`w-full py-3 px-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  checking
                    ? 'bg-blue-600/70 text-white cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-md shadow-blue-500/20'
                }`}
              >
                <RotateCw
                  className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`}
                />

                <span>
                  {checking ? 'Checking for updates...' : 'Check for Updates'}
                </span>
              </button>
            </div>

            <div
              id="appearance-card"
              className={`p-5 rounded-3xl border transition-all ${
                isDark
                  ? 'bg-zinc-900/90 border-zinc-800'
                  : 'bg-white border-gray-100 shadow-sm'
              }`}
            >
              <h4 className="text-xs uppercase font-bold tracking-wider text-gray-400 mb-3.5">
                Appearance
              </h4>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'light' as ThemePreference, label: 'Light', icon: Sun },
                  { id: 'dark' as ThemePreference, label: 'Dark', icon: Moon },
                  {
                    id: 'system' as ThemePreference,
                    label: 'System',
                    icon: Laptop,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = theme === item.id;

                  return (
                    <button
                      key={item.id}
                      id={`theme-btn-${item.id}`}
                      type="button"
                      onClick={() => onThemeChange(item.id)}
                      className={`py-3 px-2 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-medium cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : isDark
                            ? 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              id="about-card"
              className={`p-5 rounded-3xl border transition-all ${
                isDark
                  ? 'bg-zinc-900/90 border-zinc-800'
                  : 'bg-white border-gray-100 shadow-sm'
              }`}
            >
              <h4 className="text-xs uppercase font-bold tracking-wider text-gray-400 mb-3.5">
                About & Information
              </h4>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-zinc-800">
                  <span className={isDark ? 'text-zinc-400' : 'text-gray-500'}>
                    Application Name
                  </span>
                  <span className="font-semibold">Hello Test</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-zinc-800">
                  <span className={isDark ? 'text-zinc-400' : 'text-gray-500'}>
                    Current Version
                  </span>
                  <span className="font-mono font-medium">
                    {APP_VERSION}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-zinc-800">
                  <span className={isDark ? 'text-zinc-400' : 'text-gray-500'}>
                    Build Number
                  </span>
                  <span className="font-mono font-medium">
                    #{VERSION_CODE}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-zinc-800">
                  <span className={isDark ? 'text-zinc-400' : 'text-gray-500'}>
                    Channel
                  </span>
                  <span className="font-medium text-blue-500">
                    Release (Production)
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-zinc-800">
                  <span className={isDark ? 'text-zinc-400' : 'text-gray-500'}>
                    Platform
                  </span>

                  <span className="font-medium flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-gray-400" />
                    Android
                  </span>
                </div>

                <div className="pt-2">
                  <p
                    className={`leading-relaxed ${
                      isDark ? 'text-zinc-400' : 'text-gray-500'
                    }`}
                  >
                    Hello Test is a mobile application featuring interactive
                    controls, animation workflows, dynamic theming, and an
                    integrated release and update checking mechanism.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center pt-2">
              <span
                className={`text-[11px] font-medium inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${
                  isDark
                    ? 'bg-zinc-800/80 text-zinc-400'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Verified & Ready for Android Deployment
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
