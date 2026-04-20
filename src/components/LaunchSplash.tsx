import { useEffect, useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import logoUrl from "@/assets/cyclesense-logo.png";

/**
 * LaunchSplash
 * Premium animated splash shown once per browser session on first mount.
 * - Soft logo fade-in
 * - Light sweep crossing the logo ("turning on")
 * - Gentle glow pulse
 * - Smooth fade-out into the app
 *
 * Total duration: ~2.6s. Honors prefers-reduced-motion (skips immediately).
 */
export function LaunchSplash() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Skip if already shown this session
    if (sessionStorage.getItem("cyclesense-splash-shown") === "1") {
      setVisible(false);
      return;
    }

    // Skip for reduced-motion users
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      sessionStorage.setItem("cyclesense-splash-shown", "1");
      setVisible(false);
      return;
    }

    sessionStorage.setItem("cyclesense-splash-shown", "1");

    const fadeTimer = setTimeout(() => setFadingOut(true), 2200);
    const removeTimer = setTimeout(() => setVisible(false), 2900);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={`launch-splash ${fadingOut ? "launch-splash--out" : ""} ${isDark ? "launch-splash--dark" : "launch-splash--light"}`}
    >
      <div className="launch-splash__bg" />
      <div className="launch-splash__halo" />
      <div className="launch-splash__logo-wrap">
        <img
          src={logoUrl}
          alt="CycleSense"
          width={192}
          height={192}
          className="launch-splash__logo"
          draggable={false}
        />
        <div className="launch-splash__sweep" />
      </div>
      <p className="launch-splash__wordmark">CycleSense</p>
    </div>
  );
}
