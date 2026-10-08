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
          // Seguimiento del cliente y vista del mecánico: enlaces privados, no deben indexarse.
          "/s/",
          "/m/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
