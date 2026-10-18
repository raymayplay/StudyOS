import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudyOS",
  description: "A university study planning and learning workspace",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full text-slate-100">
        <div className="mx-auto flex min-h-screen max-w-[1800px] flex-col md:flex-row">
          <Sidebar />
          <main className="min-w-0 flex-1 px-4 pb-8 pt-5 sm:px-6 md:px-8 md:py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
