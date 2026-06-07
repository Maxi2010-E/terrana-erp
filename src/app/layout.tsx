import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/terrana-dashboard-shell.css";
import "../styles/terrana-sidebar-nav.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Terrana ERP",
  description: "Terrana Africa operations platform for hibiscus export",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-terrana-app className={`${inter.variable} antialiased`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
