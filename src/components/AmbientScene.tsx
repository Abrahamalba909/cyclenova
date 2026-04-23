import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useAmbient, type AmbientPhase } from "@/hooks/useAmbient";
import ambientLight from "@/assets/ambient-light.png";
import ambientDark from "@/assets/ambient-dark.png";
import ambientPeriod from "@/assets/ambient-period.png";
import ambientOvulation from "@/assets/ambient-ovulation.png";
import ambientLuteal from "@/assets/ambient-luteal.png";

/**
 * AmbientScene
 * Phase-aware, theme-aware animated background.
 *
 * - When `enabled` is false (user toggle), renders a static phase-tinted
 *   gradient only (no character, no particles, no animation) for accessibility
 *   + battery savings.
 * - Otherwise renders the matching cycle-phase illustration with breathing
 *   motion, drifting orbs, particles and a subtle scroll-driven parallax.
 *
 * All motion uses transform/opacity only (GPU-friendly) and respects
 * prefers-reduced-motion via CSS.
 */
export function AmbientScene() {
  const { theme } = useTheme();
  const { phase, enabled } = useAmbient();
  const isDark = theme === "dark";

  const characterSrc = pickCharacter(phase, isDark);
  const phaseClass = `ambient-phase-${phase}`;

  // Subtle scroll parallax — character drifts ~12px max over a viewport scroll.
  const charRef = useRef<HTMLDivElement | null>(null);
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let last = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        const y = window.scrollY || 0;
        // 4% of scroll, capped at ±18px — extremely subtle
        const next = Math.max(-18, Math.min(18, y * 0.04));
        if (Math.abs(next - last) > 0.2) {
          last = next;
          setOffset(next);
        }
        raf = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [enabled]);

  // Static (animation off) — just a phase-tinted gradient
  if (!enabled) {
    return (
      <div
        aria-hidden="true"
        className={`ambient-scene ambient-static ${phaseClass} fixed inset-0 overflow-hidden pointer-events-none`}
        style={{ zIndex: 0 }}
      >
        <div className={isDark ? "ambient-wash-dark" : "ambient-wash-light"} />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`ambient-scene ${phaseClass} fixed inset-0 overflow-hidden pointer-events-none`}
      style={{ zIndex: 0 }}
    >
      {/* Theme + phase tinted base wash */}
      <div className={isDark ? "ambient-wash-dark" : "ambient-wash-light"} />

      {/* Drifting glow orbs */}
      <div className="ambient-orb ambient-orb--1" />
      <div className="ambient-orb ambient-orb--2" />
      <div className="ambient-orb ambient-orb--3" />

      {/* Floating particles / stars */}
      <div className="ambient-particles">
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} className={`ambient-particle ambient-particle--${i % 6}`} />
        ))}
      </div>

      {/* Character — anchored bottom-right, breathes + parallax drift */}
      <div
        ref={charRef}
        className="ambient-character"
        style={{ transform: `translate3d(0, ${offset}px, 0)` }}
      >
        <img
          src={characterSrc}
          alt=""
          width={1024}
          height={1536}
          loading="eager"
          decoding="async"
          draggable={false}
        />
      </div>

      {/* Top-down vignette so headers/buttons stay readable */}
      <div className={isDark ? "ambient-vignette-dark" : "ambient-vignette-light"} />
    </div>
  );
}

function pickCharacter(phase: AmbientPhase, isDark: boolean): string {
  // Dark mode keeps a single high-contrast illustration to ensure visibility,
  // but the wash + orbs still recolor per phase via CSS.
  if (isDark) return ambientDark;
  switch (phase) {
    case "period":
      return ambientPeriod;
    case "ovulation":
      return ambientOvulation;
    case "luteal":
      return ambientLuteal;
    default:
      return ambientLight;
  }
}
