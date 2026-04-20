import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import ambientLight from "@/assets/ambient-light.png";
import ambientDark from "@/assets/ambient-dark.png";

/**
 * AmbientScene
 * Theme-aware animated background with drifting glow orbs, floating particles,
 * a calm wellness illustration, and a subtle scroll-driven parallax on the
 * character for depth.
 *
 * - Pure CSS animations (transform/opacity) — GPU friendly
 * - Scroll parallax via rAF + transform only (no layout thrash)
 * - Respects prefers-reduced-motion
 * - pointer-events: none so it never blocks interaction
 */
export function AmbientScene() {
  const { theme, ambientEnabled } = useTheme();
  const isDark = theme === "dark";
  const src = isDark ? ambientDark : ambientLight;
  const characterRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Detect prefers-reduced-motion
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Subtle scroll parallax on the character
  useEffect(() => {
    if (!ambientEnabled || reducedMotion) return;
    if (typeof window === "undefined") return;
    const el = characterRef.current;
    if (!el) return;

    let frameId = 0;
    let pending = false;

    const onScroll = () => {
      if (pending) return;
      pending = true;
      frameId = requestAnimationFrame(() => {
        // Drift up to ~28px upward as user scrolls down ~600px
        const y = Math.min(window.scrollY * 0.06, 32);
        el.style.setProperty("--parallax-y", `${-y}px`);
        pending = false;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frameId);
    };
  }, [ambientEnabled, reducedMotion]);

  if (!ambientEnabled) {
    // Still render the gentle theme-aware wash for visual continuity
    return (
      <div aria-hidden="true" className="ambient-scene fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className={isDark ? "ambient-wash-dark" : "ambient-wash-light"} />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="ambient-scene fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      <div className={isDark ? "ambient-wash-dark" : "ambient-wash-light"} />

      <div className="ambient-orb ambient-orb--1" />
      <div className="ambient-orb ambient-orb--2" />
      <div className="ambient-orb ambient-orb--3" />

      <div className="ambient-particles">
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} className={`ambient-particle ambient-particle--${i % 6}`} />
        ))}
      </div>

      <div ref={characterRef} className="ambient-character">
        <img
          src={src}
          alt=""
          width={1024}
          height={1536}
          loading="eager"
          decoding="async"
          draggable={false}
        />
      </div>

      <div className={isDark ? "ambient-vignette-dark" : "ambient-vignette-light"} />
    </div>
  );
}
