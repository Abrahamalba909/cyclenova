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
      // iOS splash screens (launch images)
      { rel: "apple-touch-startup-image", href: "/splash/splash-iphone-14-pro-max-1290x2796.png", media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" },
      { rel: "apple-touch-startup-image", href: "/splash/splash-iphone-14-1179x2556.png", media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" },
      { rel: "apple-touch-startup-image", href: "/splash/splash-iphone-12-pro-max-1284x2778.png", media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" },
      { rel: "apple-touch-startup-image", href: "/splash/splash-iphone-13-1170x2532.png", media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" },
      { rel: "apple-touch-startup-image", href: "/splash/splash-iphone-xs-max-1242x2688.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" },
      { rel: "apple-touch-startup-image", href: "/splash/splash-iphone-xr-828x1792.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" },
      { rel: "apple-touch-startup-image", href: "/splash/splash-iphone-x-1125x2436.png", media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" },
      { rel: "apple-touch-startup-image", href: "/splash/splash-iphone-8-750x1334.png", media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" },
      { rel: "apple-touch-startup-image", href: "/splash/splash-iphone-se-640x1136.png", media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" },
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
