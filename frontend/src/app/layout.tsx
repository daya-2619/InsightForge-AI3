import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Sturvixa AI | Visionary Reliability",
  description: "The first enterprise-grade generative AI platform that turns complex datasets into actionable executive insights with human-level reasoning.",
  keywords: ["AI", "Analytics", "FastAPI", "Next.js", "Enterprise Intelligence", "Data Dashboard"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-[#13121b] text-[#e4e1ee]">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
