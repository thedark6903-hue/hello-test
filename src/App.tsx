import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [count, setCount] = useState<number>(0);
  const [toast, setToast] = useState<string | null>(null);
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
    <div id="app-container" className="min-h-screen bg-[#F9F9F9] flex items-center justify-center p-4 sm:p-6 font-sans text-[#1A1A1A] antialiased relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            id="toast-notification"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-6 z-50 bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl text-sm font-medium flex items-center gap-2 border border-slate-700/50"
          >
            <span>✨</span>
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-md bg-white rounded-3xl sm:rounded-[40px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col justify-between overflow-hidden min-h-[640px] relative my-auto">
        {/* Header */}
        <header id="app-header" className="pt-8 sm:pt-10 px-8 pb-4">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-1">
            Mobile Application
          </p>
          <h1 id="app-title" className="text-2xl font-serif italic text-[#1A1A1A]">
            Hello Test
          </h1>
          <div className="h-[1px] w-full bg-gray-100 mt-4" />
        </header>

        {/* Main Content */}
        <main id="main-content" className="flex-1 flex flex-col items-center justify-center px-8 text-center py-6">
          <div className="space-y-2 mb-8">
            <h2 id="hello-world-text" className="text-4xl sm:text-5xl font-serif text-[#1A1A1A] leading-tight tracking-tight">
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
            {/* Blue Action Button */}
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
              <p id="counter-display" className="text-2xl sm:text-3xl font-mono font-light text-[#1A1A1A]">
                Button clicked: {count}
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer id="app-footer" className="pb-8 px-8 flex flex-col items-center justify-center">
          <div className="w-24 h-1 bg-gray-200 rounded-full mb-2" />
          <span className="text-[10px] text-gray-400 uppercase tracking-widest">
            Hello Test
          </span>
        </footer>
      </div>
    </div>
  );
}


