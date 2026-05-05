import type { Metadata, Viewport } from "next";
import "./globals.css";

const APP_NAME = "识物图鉴";
const APP_DESCRIPTION = "拍照识物 · 风格生成 · 图鉴收藏";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body
        className="antialiased min-h-[100dvh]"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, #29252444 0%, transparent 60%),
            radial-gradient(ellipse at 50% 100%, #1c191722 0%, transparent 60%),
            #1c1917
          `,
        }}
      >
        {children}
      </body>
    </html>
  );
}
