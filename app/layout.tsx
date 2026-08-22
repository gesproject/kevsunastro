import type { Metadata } from "next";
import localFont from "next/font/local";
import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";

const neueHaas = localFont({
  src: [
    { path: "./fonts/NHaasGroteskDSPro-15UltTh.otf", weight: "100", style: "normal" },
    { path: "./fonts/NHaasGroteskDSPro-55Rg.otf", weight: "400", style: "normal" },
    { path: "./fonts/NHaasGroteskDSPro-65Md.otf", weight: "500", style: "normal" },
    { path: "./fonts/NHaasGroteskDSPro-66MdIt.otf", weight: "500", style: "italic" },
    { path: "./fonts/NHaasGroteskDSPro-75Bd.otf", weight: "700", style: "normal" },
    { path: "./fonts/NHaasGroteskDSPro-76BdIt.otf", weight: "700", style: "italic" },
    { path: "./fonts/NHaasGroteskDSPro-95Blk.otf", weight: "900", style: "normal" },
    { path: "./fonts/NHaasGroteskDSPro-96BlkIt.otf", weight: "900", style: "italic" },
  ],
  variable: "--font-neue-haas",
});

export const metadata: Metadata = {
  title: "Sölbo",
  description: "Electronic music artist",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={neueHaas.variable}>
      <body className="min-h-full flex flex-col">
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
