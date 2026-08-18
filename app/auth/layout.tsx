import { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인 / 회원가입",
  description:
    "WOW3D 로그인·회원가입. STL·STEP 파일 업로드 또는 제품 사진 AI 3D 모델링 후 자동견적·주문을 이용하세요.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
