import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { APP_VERSION } from './version';

const GITHUB_REPO = 'thedark6903-hue/hello-test';

const CURRENT_VERSION = APP_VERSION;

type UpdateInfo = {
  versionName: string;
  apkUrl: string;
};

type GitHubAsset = {
  name?: string;
  browser_download_url?: string;
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

export default function App() {
  const [count, setCount] = useState<number>(0);
  const [toast, setToast] = useState<string | null>(null);
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerToast = (msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setToast(msg);

    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 5000);
  };

 const checkForUpdate = async () => {
  if (checkingUpdate) return;

  setCheckingUpdate(true);

  try {
    const cacheBuster = Date.now();

    const versionUrl =
      `https://raw.githubusercontent.com/${GITHUB_REPO}/main/version.json?_=${cacheBuster}`;

    console.log('Checking version:', versionUrl);
    console.log('Current version:', CURRENT_VERSION);

    const response = await fetch(versionUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Version file HTTP ${response.status}`);
    }

    const data = await response.json();

    const latestVersion = String(data.version || '')
      .replace(/^v/i, '')
      .trim();

    const apkUrl = String(data.apk || '').trim();

    if (!latestVersion) {
      throw new Error('version.json has no version');
    }

    if (!apkUrl) {
      throw new Error('version.json has no APK URL');
    }

    console.log('Latest version:', latestVersion);
    console.log('APK URL:', apkUrl);

    if (compareVersions(latestVersion, CURRENT_VERSION) > 0) {
      setUpdate({
        versionName: latestVersion,
        apkUrl,
      });

      triggerToast(`New version ${latestVersion} available!`);
    } else {
      setUpdate(null);

      triggerToast(
        `You are using the latest version (${CURRENT_VERSION}).`
      );
    }
  } catch (error) {
    console.error('Update check failed:', error);

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    triggerToast(`Update check failed: ${message}`);
  } finally {
    setCheckingUpdate(false);
  }
};

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          `GitHub API ${response.status}: ${errorText.slice(0, 120)}`
        );
      }

      const release = await response.json();

      const latestVersion = String(release.tag_name || '')
        .replace(/^v/i, '')
        .trim();

      if (!latestVersion) {
        throw new Error('GitHub latest release has no tag_name');
      }

      const assets: GitHubAsset[] = Array.isArray(release.assets)
        ? release.assets
        : [];

      const apkAsset = assets.find(
        (asset) =>
          asset.name === 'app-release.apk' &&
          typeof asset.browser_download_url === 'string'
      );

      const apkUrl =
        apkAsset?.browser_download_url ||
        `https://github.com/${GITHUB_REPO}/releases/latest/download/app-release.apk`;

      console.log('Latest version:', latestVersion);
      console.log('APK URL:', apkUrl);

      if (compareVersions(latestVersion, CURRENT_VERSION) > 0) {
        setUpdate({
          versionName: latestVersion,
          apkUrl,
        });

        triggerToast(`New version ${latestVersion} available!`);
      } else {
        setUpdate(null);
        triggerToast(
          `You are using the latest version (${CURRENT_VERSION}).`
        );
      }
    } catch (error) {
      console.error('Update check failed:', error);

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      triggerToast(`Update check failed: ${message}`);
    } finally {
      setCheckingUpdate(false);
    }
  };

  useEffect(() => {
    checkForUpdate();

    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      id="app-container"
      className="min-h-screen bg-[#F9F9F9] flex items-center justify-center p-4 sm:p-6 font-sans text-[#1A1A1A] antialiased relative"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            id="toast-notification"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-6 left-4 right-4 z-50 mx-auto max-w-md bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-medium flex items-center gap-2 border border-slate-700/50"
          >
            <span>✨</span>
            <span className="break-words">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-md bg-white rounded-3xl sm:rounded-[40px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col justify-between overflow-hidden min-h-[640px] relative my-auto">
        <header id="app-header" className="pt-8 sm:pt-10 px-8 pb-4">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-1">
            Mobile Application
          </p>

          <h1
            id="app-title"
            className="text-2xl font-serif italic text-[#1A1A1A]"
          >
            Hello Test
          </h1>

          <div className="h-[1px] w-full bg-gray-100 mt-4" />
        </header>

        <AnimatePresence>
          {update && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="px-6"
            >
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🚀</div>

                  <div className="flex-1">
                    <p className="font-semibold text-blue-900">
                      New update available
                    </p>

                    <p className="text-sm text-blue-700 mt-1">
                      Version {update.versionName} is ready.
                    </p>

                    <a
                      href={update.apkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-semibold"
                    >
                      Download Update
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main
          id="main-content"
          className="flex-1 flex flex-col items-center justify-center px-8 text-center py-6"
        >
          <div className="space-y-2 mb-8">
            <h2
              id="hello-world-text"
              className="text-4xl sm:text-5xl font-serif text-[#1A1A1A] leading-tight tracking-tight"
            >
              Hello World 👋
            </h2>

            <p className="text-gray-400 text-sm font-light italic">
              A simple demonstration of interactive design.
            </p>
          </div>

          <div className="w-full space-y-3 mb-6">
            <button
              id="happy-btn"
              type="button"
              onClick={() => triggerToast('Happy clicked! 😊')}
              className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white py-4 px-6 rounded-full text-base font-semibold shadow-lg shadow-amber-200 active:scale-95 transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 flex items-center justify-center gap-2"
            >
              😊 Happy
            </button>

            <button
              id="firework-btn"
              type="button"
              onClick={() => triggerToast('Firework clicked!')}
              className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white py-4 px-6 rounded-full text-base font-semibold shadow-lg shadow-purple-200 active:scale-95 transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 flex items-center justify-center gap-2"
            >
              🔥 Firework
            </button>
          </div>

          <div className="w-full space-y-6">
            <button
              id="click-me-btn"
              type="button"
              onClick={() => setCount((prev) => prev + 1)}
              className="w-full bg-[#2563EB] hover:bg-blue-700 text-white py-5 rounded-2xl text-sm font-bold tracking-widest uppercase shadow-lg shadow-blue-200 active:scale-95 transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Click Me
            </button>

            <div className="py-6 border-y border-gray-100 flex flex-col items-center w-full">
              <span className="text-[10px] uppercase tracking-[0.1em] text-gray-400 mb-1">
                Interaction Stats
              </span>

              <p
                id="counter-display"
                className="text-2xl sm:text-3xl font-mono font-light text-[#1A1A1A]"
              >
                Button clicked: {count}
              </p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-gray-400">
                Version {CURRENT_VERSION}
              </span>

              <button
                type="button"
                onClick={checkForUpdate}
                disabled={checkingUpdate}
                className="text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400 font-medium"
              >
                {checkingUpdate ? 'Checking...' : 'Check for updates'}
              </button>
            </div>
          </div>
        </main>

        <footer
          id="app-footer"
          className="pb-8 px-8 flex flex-col items-center justify-center"
        >
          <div className="w-24 h-1 bg-gray-200 rounded-full mb-2" />

          <span className="text-[10px] text-gray-400 uppercase tracking-widest">
            Hello Test
          </span>
        </footer>
      </div>
    </div>
  );
}
