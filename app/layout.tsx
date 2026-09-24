import type { Metadata, Viewport } from "next";
import { Anton, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VICE//CUSTOMS — Build It Loud. Drive It Louder.",
  description:
    "Custom vehicle operations in the Ocean District. Design a livery in the paint array, watch it hit the bodywork, and take it to the streets.",
};

export const viewport: Viewport = {
  themeColor: "#07080c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${inter.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}