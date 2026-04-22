import { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인 / 회원가입",
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
