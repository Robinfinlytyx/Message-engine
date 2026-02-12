import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "Comm Engine - Admin Dashboard",
  description: "WhatsApp Communication Engine Administration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} antialiased h-full bg-secondary/30`}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
            <div className="container mx-auto p-6 md:p-8 max-w-7xl animate-in fade-in duration-500">
              {/* Add a subtle decorative top gradient */}
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none -z-10" />
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
