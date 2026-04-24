import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const LOGO_SRC = "/icons/icon-512.png?v=2";

/**
 * Premium animated splash screen.
 * Shows on first mount (per session), fades out after ~2.4s.
 * Adapts to light / dark mode automatically.
 */
export function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Skip splash for already-shown sessions to avoid flashing on every nav.
    if (typeof window !== "undefined") {
      const shown = sessionStorage.getItem("cn:splash:shown");
      if (shown === "1") {
        setVisible(false);
        return;
      }
    }
    const t = window.setTimeout(() => {
      sessionStorage.setItem("cn:splash:shown", "1");
      setVisible(false);
    }, 2400);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="cn-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="splash-root"
          aria-hidden="true"
          role="presentation"
        >
          <div className="splash-bg" />
          <div className="splash-glow" />

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
              alt="CycleNova"
              width={160}
              height={160}
              className="splash-logo"
              draggable={false}
            />
            {/* Light sweep */}
            <motion.span
              className="splash-sweep"
              initial={{ x: "-120%" }}
              animate={{ x: "120%" }}
              transition={{ duration: 1.4, ease: "easeInOut", delay: 0.5 }}
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="splash-wordmark"
          >
            CycleNova
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
