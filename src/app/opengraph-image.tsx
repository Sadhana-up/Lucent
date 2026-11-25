import { ImageResponse } from "next/og";
import { getSiteUrl } from "@/lib/site";

export const alt = "Lucent — AI Skincare Advisor";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "#FAF6F0",
          color: "#1E3D2A",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 34,
            fontWeight: 700,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 9999,
              background: "#2D5A3D",
              color: "#FAF6F0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
            }}
          >
            L
          </div>
          Lucent
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 920,
            }}
          >
            Your skin, finally understood.
          </div>
          <div style={{ fontSize: 32, color: "#5A5F6B", maxWidth: 840 }}>
            AI-powered skincare analysis, personalized routines, and curated
            products.
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 26, color: "#5A5F6B" }}>
          {getSiteUrl().hostname}
        </div>
      </div>
    ),
    { ...size }
  );
}
