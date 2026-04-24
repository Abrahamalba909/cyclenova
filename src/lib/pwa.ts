/**
 * PWA helpers: environment detection, install-prompt capture, service-worker registration.
 *
 * IMPORTANT: The service worker only registers in production on the deployed origin.
 * It is intentionally disabled inside the Lovable preview iframe and on preview/dev
 * hosts to avoid stale caches and navigation interference in the editor.
 */

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function isPreviewHost(): boolean {
  const h = window.location.hostname;
  return (
    h.includes("id-preview--") ||
    h.includes("lovableproject.com") ||
    h.includes("lovable.dev") ||
    h === "localhost" ||
    h === "127.0.0.1"
  );
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  // iOS exposes a non-standard `standalone` flag on navigator.
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone;
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  // iPadOS 13+ reports as Mac with touch support.
  const iPadOS = /Macintosh/.test(ua) && "ontouchend" in document;
  return /iPad|iPhone|iPod/.test(ua) || iPadOS;
}

export function pwaDisabled(): boolean {
  if (typeof window === "undefined") return true;
  return isInIframe() || isPreviewHost();
}

let cachedPrompt: BeforeInstallPromptEvent | null = null;

export function setDeferredPrompt(e: BeforeInstallPromptEvent | null) {
  cachedPrompt = e;
}

export function getDeferredPrompt(): BeforeInstallPromptEvent | null {
  return cachedPrompt;
}

/**
 * Register the service worker. Only runs in production-like environments
 * (not in the Lovable preview iframe). Notifies via callback when an
 * update is waiting so UI can prompt the user.
 */
export function registerServiceWorker(opts: { onUpdateReady: (reg: ServiceWorkerRegistration) => void }) {
  if (typeof window === "undefined") return;
  if (pwaDisabled()) {
    // Aggressively unregister any previously installed worker so it can't
    // interfere with the preview iframe or local dev.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister().catch(() => {}));
      });
    }
    return;
  }
  if (!("serviceWorker" in navigator)) return;

  const onLoad = () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        if (reg.waiting) opts.onUpdateReady(reg);
        reg.addEventListener("updatefound", () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener("statechange", () => {
            if (sw.state === "installed" && navigator.serviceWorker.controller) {
              opts.onUpdateReady(reg);
            }
          });
        });
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.warn("[pwa] sw registration failed", err);
      });

    // When the new SW takes control, reload once so the app picks it up.
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  };

  if (document.readyState === "complete") onLoad();
  else window.addEventListener("load", onLoad, { once: true });
}
