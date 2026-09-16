import type { MetadataRoute } from "next";

const siteUrl = "https://hakoneservice.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/calendar",
          "/clients",
          "/bikes",
          "/services",
          "/mechanics",
          "/gastos",
          "/admin",
          "/cuenta",
          "/api",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
