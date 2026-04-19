import { createFileRoute } from "@tanstack/react-router";

const ROUTES = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/auth", priority: "0.6", changefreq: "monthly" },
  { path: "/calendar", priority: "0.8", changefreq: "weekly" },
  { path: "/insights", priority: "0.8", changefreq: "weekly" },
  { path: "/assistant", priority: "0.8", changefreq: "weekly" },
  { path: "/community", priority: "0.9", changefreq: "daily" },
  { path: "/partner", priority: "0.7", changefreq: "monthly" },
  { path: "/invite", priority: "0.6", changefreq: "monthly" },
  { path: "/premium", priority: "0.7", changefreq: "monthly" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const origin = `${url.protocol}//${url.host}`;
        const lastmod = new Date().toISOString().split("T")[0];

        const urls = ROUTES.map(
          (r) =>
            `  <url>\n    <loc>${origin}${r.path}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`,
        ).join("\n");

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

        return new Response(sitemap, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
