import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share, Plus, Download } from "lucide-react";
import {
  type BeforeInstallPromptEvent,
  getDeferredPrompt,
  isIOS,
  isStandalone,
  pwaDisabled,
  registerServiceWorker,
  setDeferredPrompt,
} from "@/lib/pwa";

const DISMISS_KEY = "cn:pwa:install-dismissed";
const DISMISS_DAYS = 7;

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function rememberDismiss() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* no-op */
  }
}

/**
 * PWAInstall
 * - Captures `beforeinstallprompt` so we can fire it later from a custom UI.
 * - Shows a popup a few seconds after load when the app is installable.
 * - Provides iOS-specific instructions (no native prompt on Safari).
 * - Registers the service worker (production only) and surfaces an update banner.
 */
export function PWAInstall() {
  const [showInstall, setShowInstall] = useState(false);
  const [showIOS, setShowIOS] = useState(false);
  const [updateReg, setUpdateReg] = useState<ServiceWorkerRegistration | null>(null);

  // Service worker registration + update detection.
  useEffect(() => {
    registerServiceWorker({
      onUpdateReady: (reg) => setUpdateReg(reg),
    });
  }, []);

  // Capture the install prompt from the browser.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isDismissed()) {
        // Small delay so it doesn't slam in on first paint.
        window.setTimeout(() => setShowInstall(true), 4000);
      }
    };
    const onInstalled = () => {
      setDeferredPrompt(null);
      setShowInstall(false);
      setShowIOS(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // iOS fallback — no beforeinstallprompt on Safari.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pwaDisabled()) return;
    if (!isIOS() || isStandalone() || isDismissed()) return;
    const t = window.setTimeout(() => setShowIOS(true), 5000);
    return () => window.clearTimeout(t);
  }, []);

  const handleInstall = async () => {
    const prompt = getDeferredPrompt();
    if (!prompt) {
      setShowInstall(false);
      return;
    }
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch {
      /* user dismissed */
    } finally {
      setDeferredPrompt(null);
      setShowInstall(false);
    }
  };

  const handleDismissInstall = () => {
    rememberDismiss();
    setShowInstall(false);
  };
  const handleDismissIOS = () => {
    rememberDismiss();
    setShowIOS(false);
  };

  const handleUpdate = () => {
    if (!updateReg) return;
    const target = updateReg.waiting || updateReg.installing;
    target?.postMessage({ type: "SKIP_WAITING" });
    // controllerchange listener in registerServiceWorker triggers reload.
  };

  return (
    <>
      {/* Android / desktop install prompt */}
      <AnimatePresence>
        {showInstall && (
          <motion.div
            key="cn-install"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-x-0 bottom-0 z-[1000] px-4 pb-[max(env(safe-area-inset-bottom),16px)]"
            role="dialog"
            aria-labelledby="cn-install-title"
          >
            <div className="mx-auto max-w-md rounded-3xl border bg-card/95 backdrop-blur-xl shadow-glow p-4">
              <div className="flex items-start gap-3">
                <img
                  src="/icons/icon-192.png?v=2"
                  alt=""
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-2xl shadow-soft shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h2 id="cn-install-title" className="font-display text-base font-semibold">
                    Install CycleNova
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Add CycleNova to your home screen for a better experience.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDismissInstall}
                  aria-label="Dismiss"
                  className="text-muted-foreground hover:text-foreground p-1 -m-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDismissInstall}
                  className="flex-1 px-4 py-2.5 rounded-full text-sm font-medium border hover:bg-muted/50 transition-colors"
                >
                  Not now
                </button>
                <button
                  type="button"
                  onClick={handleInstall}
                  className="flex-1 px-4 py-2.5 rounded-full text-sm font-semibold bg-gradient-primary text-primary-foreground shadow-soft inline-flex items-center justify-center gap-1.5"
                >
                  <Download className="h-4 w-4" />
                  Install
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS install instructions */}
      <AnimatePresence>
        {showIOS && (
          <motion.div
            key="cn-ios"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-x-0 bottom-0 z-[1000] px-4 pb-[max(env(safe-area-inset-bottom),16px)]"
            role="dialog"
            aria-labelledby="cn-ios-title"
          >
            <div className="mx-auto max-w-md rounded-3xl border bg-card/95 backdrop-blur-xl shadow-glow p-4">
              <div className="flex items-start gap-3">
                <img
                  src="/icons/icon-192.png?v=2"
                  alt=""
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-2xl shadow-soft shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h2 id="cn-ios-title" className="font-display text-base font-semibold">
                    Install CycleNova
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Tap{" "}
                    <span className="inline-flex items-center gap-1 align-middle">
                      <Share className="h-3.5 w-3.5" />
                      <span className="font-medium text-foreground">Share</span>
                    </span>
                    {" → "}
                    <span className="inline-flex items-center gap-1 align-middle">
                      <Plus className="h-3.5 w-3.5" />
                      <span className="font-medium text-foreground">Add to Home Screen</span>
                    </span>
                    .
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDismissIOS}
                  aria-label="Dismiss"
                  className="text-muted-foreground hover:text-foreground p-1 -m-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleDismissIOS}
                  className="w-full px-4 py-2.5 rounded-full text-sm font-medium border hover:bg-muted/50 transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update available banner */}
      <AnimatePresence>
        {updateReg && (
          <motion.div
            key="cn-update"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-0 z-[1001] px-4 pt-[max(env(safe-area-inset-top),12px)]"
            role="status"
            aria-live="polite"
          >
            <div className="mx-auto max-w-md rounded-2xl border bg-card/95 backdrop-blur-xl shadow-soft px-3 py-2 flex items-center gap-3">
              <span className="text-sm flex-1">New version available</span>
              <button
                type="button"
                onClick={() => setUpdateReg(null)}
                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
              >
                Later
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gradient-primary text-primary-foreground"
              >
                Refresh
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
