import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const origin = `${url.protocol}//${url.host}`;
        const body = `User-agent: *\nAllow: /\nDisallow: /auth\nDisallow: /onboarding\nDisallow: /partner/accept\nDisallow: /partner/view\n\nSitemap: ${origin}/sitemap.xml\n`;
        return new Response(body, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
