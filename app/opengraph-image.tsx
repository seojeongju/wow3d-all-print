import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "와우쓰리디 WOW3D 3D프린팅 자동견적 서비스";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const badgeStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "10px 18px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.06)",
  color: "#7dd3fc",
  fontSize: 24,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
};

function MiniCard({
  title,
  value,
  accent,
}: {
  title: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "24px 26px",
        borderRadius: 28,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "linear-gradient(180deg, rgba(15,23,42,0.92), rgba(15,23,42,0.72))",
        boxShadow: "0 18px 40px rgba(2, 6, 23, 0.38)",
        minWidth: 220,
      }}
    >
      <div
        style={{
          fontSize: 20,
          color: "rgba(226,232,240,0.72)",
          fontWeight: 600,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 34,
          color: accent,
          fontWeight: 800,
          letterSpacing: "-0.04em",
        }}
      >
        {value}
      </div>
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
            "radial-gradient(circle at 15% 18%, rgba(45,212,191,0.22), transparent 28%), radial-gradient(circle at 84% 78%, rgba(99,102,241,0.22), transparent 30%), linear-gradient(135deg, #020617 0%, #0f172a 46%, #111827 100%)",
          color: "white",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
            opacity: 0.35,
          }}
        />

        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            padding: "48px 54px",
            gap: 34,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: "56%",
              zIndex: 1,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={badgeStyle}>WOW3D PRO</div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  letterSpacing: "-0.05em",
                }}
              >
                <div
                  style={{
                    fontSize: 74,
                    lineHeight: 0.98,
                    fontWeight: 900,
                  }}
                >
                  3D프린팅 자동견적
                </div>
                <div
                  style={{
                    fontSize: 74,
                    lineHeight: 0.98,
                    fontWeight: 900,
                    color: "#2dd4bf",
                  }}
                >
                  출력부터 시제품 제작까지
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  color: "rgba(226,232,240,0.82)",
                  fontSize: 30,
                  lineHeight: 1.4,
                  maxWidth: 580,
                }}
              >
                <div>STL, OBJ, 3MF 업로드만으로 실시간 견적 확인</div>
                <div>3D 미리보기, 출력 가능성 분석, 시제품 제작 상담 지원</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {["STL", "OBJ", "3MF", "STEP", "STP"].map((label) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    padding: "12px 18px",
                    borderRadius: 18,
                    background: "rgba(45,212,191,0.08)",
                    border: "1px solid rgba(45,212,191,0.28)",
                    color: "#99f6e4",
                    fontSize: 24,
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              position: "relative",
              width: "44%",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 52,
                right: 4,
                display: "flex",
                width: 420,
                height: 500,
                borderRadius: 40,
                border: "1px solid rgba(255,255,255,0.12)",
                background:
                  "linear-gradient(180deg, rgba(15,23,42,0.88), rgba(15,23,42,0.62))",
                boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
                padding: 28,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(circle at 50% 10%, rgba(45,212,191,0.16), transparent 35%)",
                }}
              />

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 18,
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ fontSize: 34, fontWeight: 900 }}>실시간 견적 분석</div>
                    <div style={{ fontSize: 20, color: "rgba(226,232,240,0.72)" }}>
                      업로드 후 즉시 가격과 공정을 확인
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      width: 18,
                      height: 18,
                      borderRadius: 999,
                      background: "#2dd4bf",
                      boxShadow: "0 0 28px rgba(45,212,191,0.75)",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    marginBottom: 18,
                    width: "100%",
                    height: 16,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: "87%",
                      height: "100%",
                      borderRadius: 999,
                      background: "linear-gradient(90deg, #2dd4bf 0%, #60a5fa 100%)",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    padding: "26px 24px",
                    borderRadius: 30,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    marginBottom: 20,
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ fontSize: 18, color: "rgba(226,232,240,0.68)" }}>예상 견적가</div>
                    <div style={{ fontSize: 48, fontWeight: 900, color: "#f8fafc" }}>₩ 48,700</div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      padding: "10px 14px",
                      borderRadius: 999,
                      fontSize: 18,
                      fontWeight: 800,
                      background: "rgba(45,212,191,0.12)",
                      color: "#99f6e4",
                    }}
                  >
                    FDM
                  </div>
                </div>

                <div style={{ display: "flex", gap: 14 }}>
                  <MiniCard title="정확도" value="99%" accent="#2dd4bf" />
                  <MiniCard title="리드타임" value="10초" accent="#60a5fa" />
                </div>
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                left: -6,
                bottom: 18,
                display: "flex",
                flexDirection: "column",
                gap: 14,
                padding: "24px 26px",
                borderRadius: 32,
                background: "rgba(15,23,42,0.92)",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 20px 60px rgba(2, 6, 23, 0.42)",
              }}
            >
              <div style={{ fontSize: 22, color: "rgba(226,232,240,0.72)" }}>지원 서비스</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 30, fontWeight: 800 }}>
                <div>3D프린팅 출력</div>
                <div>시제품 제작</div>
                <div style={{ color: "#2dd4bf" }}>자동견적 플랫폼</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
