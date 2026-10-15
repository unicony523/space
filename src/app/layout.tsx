import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  title: "RETRO SPACE SHOOTER",
  description: "8-bit Retro Pixel Art Space Shooter Game",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${pressStart2P.variable} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-black text-white select-none overflow-x-hidden font-pixel">
        {children}
      </body>
    </html>
  );
}
