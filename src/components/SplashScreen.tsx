import { useEffect, useState } from "react";
import logo from "/icons/icon-512.png?url";

const SPLASH_DURATION = 2400; // ms

export function SplashScreen() {
  const [phase, setPhase] = useState<"visible" | "leaving" | "done">("visible");

  useEffect(() => {
    const leaveTimer = setTimeout(() => setPhase("leaving"), SPLASH_DURATION - 500);
    const doneTimer = setTimeout(() => setPhase("done"), SPLASH_DURATION);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      aria-hidden="true"
      className={`splash-root ${phase === "leaving" ? "splash-leaving" : ""}`}
    >
      <div className="splash-glow" />
      <div className="splash-logo-wrap">
        <div className="splash-logo-halo" />
        <img
          src={logo}
          alt=""
          width={160}
          height={160}
          className="splash-logo"
          fetchPriority="high"
        />
        <div className="splash-sweep" />
      </div>
      <div className="splash-wordmark">CycleNova</div>
    </div>
  );
}
