import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings } from 'lucide-react';
import { APP_VERSION } from './version.ts';
import { APP_NAME } from './utils/updateChecker.ts';
import { SettingsView, ThemePreference } from './components/SettingsView.tsx';

export default function App() {
  const [count, setCount] = useState<number>(0);
  const [toast, setToast] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<ThemePreference>(() => {
    const saved = localStorage.getItem('app_theme');
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
    return 'system';
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleThemeChange = (newTheme: ThemePreference) => {
    setTheme(newTheme);
    localStorage.setItem('app_theme', newTheme);
  };

  const isDark = theme === 'dark' || (theme === 'system' && systemIsDark);

  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerToast = (msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  return (
    <div
      id="app-container"
      className={`min-h-screen ${
        isDark ? 'bg-[#121214] text-[#EDEDED]' : 'bg-[#F9F9F9] text-[#1A1A1A]'
      } flex items-center justify-center p-4 sm:p-6 font-sans antialiased relative transition-colors duration-200`}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            id="toast-notification"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed top-6 z-50 px-6 py-3 rounded-full shadow-xl text-sm font-medium flex items-center gap-2 border ${
              isDark 
                ? 'bg-zinc-800 text-white border-zinc-700' 
                : 'bg-slate-900 text-white border-slate-700/50'
            }`}
          >
            <span>✨</span>
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main App Window / Card */}
      <div
        className={`w-full max-w-md ${
          isDark
            ? 'bg-zinc-900/95 border-zinc-800 text-[#EDEDED] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]'
            : 'bg-white border-gray-100 text-[#1A1A1A] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)]'
        } rounded-3xl sm:rounded-[40px] border flex flex-col justify-between overflow-hidden min-h-[640px] relative my-auto transition-colors duration-200`}
      >
        {/* Header */}
        <header id="app-header" className="pt-8 sm:pt-10 px-8 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-1">
                Mobile Application
              </p>
              <h1 id="app-title" className="text-2xl font-serif italic">
                {APP_NAME}
              </h1>
            </div>
            
            {/* Settings & Update Center Gear Button */}
            <button
              id="open-settings-btn"
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className={`p-2.5 rounded-2xl transition-all duration-200 cursor-pointer ${
                isDark
                  ? 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 active:scale-95'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 active:scale-95'
              }`}
              title="Settings & Update Center"
              aria-label="Settings & Update Center"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
          <div className={`h-[1px] w-full ${isDark ? 'bg-zinc-800' : 'bg-gray-100'} mt-4`} />
        </header>

        {/* Main Content */}
        <main id="main-content" className="flex-1 flex flex-col items-center justify-center px-8 text-center py-6">
          <div className="space-y-2 mb-8">
            <h2 id="hello-world-text" className="text-4xl sm:text-5xl font-serif leading-tight tracking-tight">
              Hello World 👋
            </h2>
            <p className="text-gray-400 text-sm font-light italic">
              A simple demonstration of interactive design.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-3 mb-6">
            <button
              id="happy-btn"
              type="button"
              onClick={() => triggerToast('Happy clicked! 😊')}
              className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white py-4 px-6 rounded-full text-base font-semibold shadow-lg shadow-amber-200 dark:shadow-amber-950/30 active:scale-95 transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 flex items-center justify-center gap-2"
            >
              😊 Happy
            </button>

            <button
              id="firework-btn"
              type="button"
              onClick={() => triggerToast('Firework clicked!')}
              className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white py-4 px-6 rounded-full text-base font-semibold shadow-lg shadow-purple-200 dark:shadow-purple-950/30 active:scale-95 transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 flex items-center justify-center gap-2"
            >
              🔥 Firework
            </button>
          </div>

          <div className="w-full space-y-6">
            {/* Blue Action Button */}
            <button
              id="click-me-btn"
              type="button"
              onClick={() => setCount((prev) => prev + 1)}
              className="w-full bg-[#2563EB] hover:bg-blue-700 text-white py-5 rounded-2xl text-sm font-bold tracking-widest uppercase shadow-lg shadow-blue-200 dark:shadow-blue-950/40 active:scale-95 transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Click Me
            </button>

            <div className={`py-6 border-y ${isDark ? 'border-zinc-800' : 'border-gray-100'} flex flex-col items-center w-full`}>
              <span className="text-[10px] uppercase tracking-[0.1em] text-gray-400 mb-1">
                Interaction Stats
              </span>
              <p id="counter-display" className="text-2xl sm:text-3xl font-mono font-light">
                Button clicked: {count}
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer id="app-footer" className="pb-8 px-8 flex flex-col items-center justify-center">
          <div className={`w-24 h-1 ${isDark ? 'bg-zinc-800' : 'bg-gray-200'} rounded-full mb-2`} />
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="text-[10px] text-gray-400 uppercase tracking-widest hover:text-blue-500 transition-colors cursor-pointer"
          >
            {APP_NAME} • v{APP_VERSION}
          </button>
        </footer>
      </div>

      {/* Settings & Update Center Screen */}
      <SettingsView
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onThemeChange={handleThemeChange}
        isDark={isDark}
        onShowToast={triggerToast}
      />
    </div>
  );
}


