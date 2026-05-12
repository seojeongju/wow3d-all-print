import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "와우쓰리디 WOW3D 3D프린팅 자동견적 페이지";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

function Step({
  index,
  title,
  description,
  accent,
}: {
  index: string;
  title: string;
  description: string;
  accent: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        flex: 1,
        minHeight: 176,
        padding: "24px 22px",
        borderRadius: 28,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <div
        style={{
          display: "flex",
          width: 42,
          height: 42,
          borderRadius: 999,
          alignItems: "center",
          justifyContent: "center",
          background: accent,
          color: "#020617",
          fontSize: 20,
          fontWeight: 900,
        }}
      >
        {index}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: "#f8fafc" }}>{title}</div>
      <div style={{ fontSize: 20, lineHeight: 1.45, color: "rgba(226,232,240,0.78)" }}>{description}</div>
    </div>
  );
}

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          background:
            "radial-gradient(circle at 0% 0%, rgba(45,212,191,0.18), transparent 24%), radial-gradient(circle at 100% 100%, rgba(96,165,250,0.18), transparent 28%), linear-gradient(135deg, #020617 0%, #0f172a 48%, #111827 100%)",
          color: "#fff",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "34px 34px",
            opacity: 0.36,
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            padding: "44px 52px",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 30,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 740 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 18px",
                  borderRadius: 999,
                  width: "fit-content",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  color: "#7dd3fc",
                  fontSize: 24,
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                WOW3D QUOTE
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 76, lineHeight: 0.98, fontWeight: 900, letterSpacing: "-0.05em" }}>
                  3D 프린팅 자동 견적
                </div>
                <div
                  style={{
                    fontSize: 40,
                    fontWeight: 800,
                    letterSpacing: "-0.04em",
                    color: "#2dd4bf",
                  }}
                >
                  파일 업로드만으로 10초 실시간 견적
                </div>
              </div>
              <div style={{ fontSize: 28, lineHeight: 1.45, color: "rgba(226,232,240,0.8)" }}>
                STL, OBJ, 3MF 파일을 업로드하면 3D 미리보기, 출력 가능성 분석,
                소재별 가격을 한 번에 확인할 수 있습니다.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                minWidth: 250,
                padding: "24px 24px",
                borderRadius: 30,
                background: "rgba(15,23,42,0.88)",
                border: "1px solid rgba(255,255,255,0.14)",
              }}
            >
              <div style={{ fontSize: 20, color: "rgba(226,232,240,0.7)" }}>지원 포맷</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {["STL", "OBJ", "3MF", "STEP"].map((label) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      padding: "10px 14px",
                      borderRadius: 16,
                      background: "rgba(45,212,191,0.1)",
                      border: "1px solid rgba(45,212,191,0.26)",
                      color: "#99f6e4",
                      fontSize: 22,
                      fontWeight: 800,
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  marginTop: 8,
                  padding: "16px 18px",
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.06)",
                  color: "#f8fafc",
                  fontSize: 28,
                  fontWeight: 900,
                }}
              >
                예상 견적 예시: ₩ 48,700
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 18 }}>
            <Step index="1" title="파일 업로드" description="STL·OBJ·3MF 파일을 올리면 즉시 분석이 시작됩니다." accent="#2dd4bf" />
            <Step index="2" title="자동 분석" description="부피, 표면적, 치수와 출력 가능성을 빠르게 계산합니다." accent="#60a5fa" />
            <Step index="3" title="견적 확인" description="소재와 공정별 가격을 확인하고 바로 주문 단계로 이동합니다." accent="#a78bfa" />
          </div>
        </div>
      </div>
    ),
    size,
  );
}
