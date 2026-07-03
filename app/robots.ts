import type { MetadataRoute } from "next"
import { getSiteUrl } from "@/lib/marketing/landing-seo"

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl()

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/claver/",
          "/claver/claverp/",
          "/demo/",
          "/login/register",
          "/marketing/",
        ],
        disallow: ["/api/", "/dashboard/", "/claver-cloud/", "/claver-cliente/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}