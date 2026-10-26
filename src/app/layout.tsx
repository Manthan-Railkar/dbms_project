import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Live Cricket Score Tracker | Match Setup",
  description: "Create and track live cricket matches with real-time scoring and ball-by-ball updates",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased h-full`}>
      <body className="min-h-screen w-full font-sans bg-white text-slate-900 m-0 p-0 selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
