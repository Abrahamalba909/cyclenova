import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const LOGO_SRC = "/icons/icon-512.png?v=2";
const LOGO_FALLBACK = "/icons/icon-192.png?v=2";
const SESSION_KEY = "cn:splash:shown";
const DURATION_MS = 2400;
const REDUCED_DURATION_MS = 700;

/**
 * Premium animated splash screen.
 * - Shows once per app open (sessionStorage guard, survives back/forward & route changes).
 * - Preloads logo assets so the splash appears with no blank frame.
 * - Blocks interaction (pointer + scroll) until fade-out completes.
 * - Respects prefers-reduced-motion: quick fade only, no sweep / glow.
 */
export function SplashScreen() {
  const prefersReducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);

  // Preload critical assets ASAP so the splash appears instantly on slow networks.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const hrefs = [LOGO_SRC, LOGO_FALLBACK, "/icons/apple-touch-icon.png?v=2"];
    const links: HTMLLinkElement[] = hrefs.map((href) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = href;
      link.fetchPriority = "high";
      document.head.appendChild(link);
      return link;
    });
    // Also warm the browser image cache directly.
    hrefs.forEach((h) => {
      const img = new Image();
      img.decoding = "async";
      img.src = h;
    });
    return () => {
      links.forEach((l) => l.parentNode?.removeChild(l));
    };
  }, []);

  // Visibility lifecycle — once per app open.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY) === "1") {
      setVisible(false);
      return;
    }
    const duration = prefersReducedMotion ? REDUCED_DURATION_MS : DURATION_MS;
    const t = window.setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, "1");
      setVisible(false);
    }, duration);
    return () => window.clearTimeout(t);
  }, [prefersReducedMotion]);

  // Lock scroll & block interactions while splash is up.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!visible) return;
    const prevOverflow = document.body.style.overflow;
    const prevTouch = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouch;
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="cn-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.25 : 0.6, ease: "easeInOut" }}
          className="splash-root"
          role="presentation"
          aria-hidden="true"
          // Hard interaction block — captures all pointer & wheel events.
          onPointerDownCapture={(e) => e.preventDefault()}
          onTouchStartCapture={(e) => e.preventDefault()}
          onWheelCapture={(e) => e.preventDefault()}
          onClickCapture={(e) => e.preventDefault()}
          style={{ pointerEvents: "auto", touchAction: "none" }}
        >
          <div className="splash-bg" />
          {!prefersReducedMotion && <div className="splash-glow" />}

          {prefersReducedMotion ? (
            <div className="splash-logo-wrap">
              <img
                src={LOGO_SRC}
                alt=""
                width={160}
                height={160}
                className="splash-logo"
                draggable={false}
                fetchPriority="high"
                decoding="async"
              />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, filter: "brightness(0.7)" }}
              animate={{
                opacity: [0, 1, 1, 1],
                scale: [0.85, 1, 1.04, 1],
                filter: ["brightness(0.7)", "brightness(1)", "brightness(1.15)", "brightness(1.05)"],
              }}
              transition={{ duration: 2.2, ease: "easeInOut", times: [0, 0.35, 0.75, 1] }}
              className="splash-logo-wrap"
            >
              <img
                src={LOGO_SRC}
                alt=""
                width={160}
                height={160}
                className="splash-logo"
                draggable={false}
                fetchPriority="high"
                decoding="async"
              />
              {/* Light sweep */}
              <motion.span
                className="splash-sweep"
                initial={{ x: "-120%" }}
                animate={{ x: "120%" }}
                transition={{ duration: 1.4, ease: "easeInOut", delay: 0.5 }}
              />
            </motion.div>
          )}

          <motion.p
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.25 : 0.6, delay: prefersReducedMotion ? 0 : 0.9 }}
            className="splash-wordmark"
          >
            CycleNova
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
