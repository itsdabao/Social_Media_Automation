import type { Metadata } from "next";
import type { ReactElement, ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Social Media · Kết nối API",
  description: "Kiểm tra kết nối API của ứng dụng Social Media.",
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps): ReactElement {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
