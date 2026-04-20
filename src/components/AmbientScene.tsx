import { useTheme } from "@/hooks/useTheme";
import ambientLight from "@/assets/ambient-light.png";
import ambientDark from "@/assets/ambient-dark.png";

/**
 * AmbientScene
 * Theme-aware animated background featuring a calm wellness illustration,
 * floating particles, and a soft ambient glow. Sits behind app content.
 *
 * - Pure CSS animations (transform/opacity) — GPU friendly, low CPU
 * - Respects prefers-reduced-motion via the @media query in styles
 * - pointer-events: none so it never blocks interaction
 */
export function AmbientScene() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const src = isDark ? ambientDark : ambientLight;

  return (
    <div
      aria-hidden="true"
      className="ambient-scene fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      {/* Theme-aware base wash */}
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

      {/* The character — anchored bottom-right, breathes gently */}
      <div className="ambient-character">
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

      {/* Top-down vignette so headers/buttons stay readable */}
      <div className={isDark ? "ambient-vignette-dark" : "ambient-vignette-light"} />
    </div>
  );
}
