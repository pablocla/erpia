import { ImageResponse } from "next/og"
import { CLAVERGROW_PRODUCT, CLAVER_GROUP } from "@/lib/marketing/brand-system"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = `${CLAVERGROW_PRODUCT.name} by ${CLAVER_GROUP.name}`

export default function ClavergrowOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "64px 80px",
          background: "linear-gradient(135deg, #064e3b 0%, #059669 50%, #14532d 100%)",
          color: "#f8fafc",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ fontSize: 22, color: "#a7f3d0", marginBottom: 12 }}>{`by ${CLAVER_GROUP.name}`}</div>
        <div style={{ fontSize: 80, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 16 }}>
          {CLAVERGROW_PRODUCT.name}
        </div>
        <div style={{ fontSize: 32, color: "#e2e8f0", marginBottom: 40 }}>{CLAVERGROW_PRODUCT.tagline}</div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {["Lotes & NDVI", "IoT agro", "Acopio & CPE", "Pizarra BCR", "Cultivo regulado"].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "12px 22px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.12)",
                fontSize: 22,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  )
}