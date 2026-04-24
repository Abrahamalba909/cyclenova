import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { AmbientProvider } from "@/hooks/useAmbient";
import { GoalProvider } from "@/hooks/useGoal";
import { SplashScreen } from "@/components/SplashScreen";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "CycleNova — Understand your cycle, trust your body" },
      { name: "description", content: "Track your menstrual cycle, predict ovulation, log symptoms, chat with an AI health assistant, and connect with a supportive community." },
      { name: "theme-color", content: "#C2185B" },
      { property: "og:title", content: "CycleNova — Understand your cycle, trust your body" },
      { property: "og:description", content: "Track your menstrual cycle, predict ovulation, log symptoms, chat with an AI health assistant, and connect with a supportive community." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/og/home.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "CycleNova — Understand your cycle, trust your body" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "CycleNova — Understand your cycle, trust your body" },
      { name: "twitter:description", content: "Track your menstrual cycle, predict ovulation, log symptoms, chat with an AI health assistant, and connect with a supportive community." },
      { name: "twitter:image", content: "/og/home.jpg" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "CycleNova" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "application-name", content: "CycleNova" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico?v=2" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/icons/favicon-16.png?v=2" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/icons/favicon-32.png?v=2" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icons/icon-192.png?v=2" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/icons/apple-touch-icon.png?v=2" },
      // Preload critical splash assets so the animated splash appears with no blank frame.
      { rel: "preload", as: "image", href: "/icons/icon-512.png?v=2", fetchpriority: "high" },
      { rel: "preload", as: "image", href: "/icons/icon-192.png?v=2", fetchpriority: "high" },
      // iOS splash screens (launch images)
      // iPhone 16 Pro Max (6.9") — 1320x2868 @3x
      { rel: "apple-touch-startup-image", href: "/splash/splash-iphone-16-pro-max-1320x2868.png", media: "(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3)" },
      // iPhone 16 Pro / 15 Pro (6.3") — 1206x2622 @3x
      { rel: "apple-touch-startup-image", href: "/splash/splash-iphone-16-pro-1206x2622.png", media: "(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3)" },
      // iPhone 14 Pro Max / 15 Plus / 15 Pro Max — 1290x2796 @3x
      { rel: "apple-touch-startup-image", href: "/splash/splash-iphone-14-pro-max-1290x2796.png", media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" },
      // iPhone 14 Pro / 15 / 15 Pro — 1179x2556 @3x
      { rel: "apple-touch-startup-image", href: "/splash/splash-iphone-14-1179x2556.png", media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" },
      // iPhone 12 Pro Max / 13 Pro Max / 14 Plus — 1284x2778 @3x
      { rel: "apple-touch-startup-image", href: "/splash/splash-iphone-12-pro-max-1284x2778.png", media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" },
      // iPhone 12 / 12 Pro / 13 / 13 Pro / 14 — 1170x2532 @3x
      { rel: "apple-touch-startup-image", href: "/splash/splash-iphone-13-1170x2532.png", media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" },
      // iPhone XS Max / 11 Pro Max — 1242x2688 @3x
      { rel: "apple-touch-startup-image", href: "/splash/splash-iphone-xs-max-1242x2688.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" },
      // iPhone XR / 11 — 828x1792 @2x
      { rel: "apple-touch-startup-image", href: "/splash/splash-iphone-xr-828x1792.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" },
      // iPhone X / XS / 11 Pro — 1125x2436 @3x
      { rel: "apple-touch-startup-image", href: "/splash/splash-iphone-x-1125x2436.png", media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" },
      // iPhone 6/7/8 / SE 2/3 — 750x1334 @2x
      { rel: "apple-touch-startup-image", href: "/splash/splash-iphone-8-750x1334.png", media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" },
      // iPhone SE 1st gen / 5/5s — 640x1136 @2x
      { rel: "apple-touch-startup-image", href: "/splash/splash-iphone-se-640x1136.png", media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" },
      // iPad mini (8.3") — 1488x2266 @2x
      { rel: "apple-touch-startup-image", href: "/splash/splash-ipad-mini-1488x2266.png", media: "(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2)" },
      // iPad Air (10.9") — 1640x2360 @2x
      { rel: "apple-touch-startup-image", href: "/splash/splash-ipad-air-1640x2360.png", media: "(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2)" },
      // iPad Pro 11" — 1668x2388 @2x
      { rel: "apple-touch-startup-image", href: "/splash/splash-ipad-pro-11-1668x2388.png", media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)" },
      // iPad Pro 12.9" — 2048x2732 @2x
      { rel: "apple-touch-startup-image", href: "/splash/splash-ipad-pro-12-2048x2732.png", media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 text-center">
      <div>
        <h1 className="font-display text-7xl font-bold text-primary">404</h1>
        <p className="mt-4 text-muted-foreground">This page wandered off.</p>
        <a href="/" className="inline-block mt-6 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-medium">Go home</a>
      </div>
    </div>
  ),
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GoalProvider>
          <AmbientProvider>
            <SplashScreen />
            <Outlet />
            <Toaster />
          </AmbientProvider>
        </GoalProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
