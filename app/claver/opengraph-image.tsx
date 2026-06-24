import { ImageResponse } from "next/og"
import { CLAVER_GROUP } from "@/lib/marketing/brand-system"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = `${CLAVER_GROUP.name} — ${CLAVER_GROUP.tagline}`

export default function ClaverOgImage() {
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
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #0f172a 100%)",
          color: "#f8fafc",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 32 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 20,
              background: "#0f172a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "3px solid #f59e0b",
            }}
          >
            <div style={{ fontSize: 48, fontWeight: 700, color: "#f8fafc" }}>C</div>
          </div>
          <div>
            <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: "-0.03em" }}>{CLAVER_GROUP.name}</div>
            <div style={{ fontSize: 28, color: "#94a3b8", marginTop: 8 }}>{CLAVER_GROUP.tagline}</div>
          </div>
        </div>
        <div style={{ fontSize: 26, color: "#cbd5e1", maxWidth: 720, lineHeight: 1.4 }}>
          {CLAVER_GROUP.descriptor}
        </div>
        <div style={{ marginTop: 40, display: "flex", gap: 16 }}>
          {["Clavis", "ClavPay", "ClavAI", "Clav Consult"].map((p) => (
            <div
              key={p}
              style={{
                padding: "10px 20px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                fontSize: 20,
              }}
            >
              {p}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  )
}