import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vedant Sinha | Full-Stack Developer",
  description:
    "Portfolio of Vedant Sinha, a full-stack developer and future blockchain engineer.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-[#07070b]">{children}</body>
    </html>
  );
}
