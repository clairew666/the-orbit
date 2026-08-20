import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "THE ORBIT — Habits, plans and progress",
  description: "A cheerful habit tracker, calendar and growing plant companion.",
  applicationName: "THE ORBIT",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "THE ORBIT" },
  formatDetection: { telephone: false },
  openGraph: { title: "THE ORBIT", description: "Build routines, plan your time and grow your Orbit plant.", images: [{ url: "/og.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "THE ORBIT", description: "Build routines, plan your time and grow your Orbit plant.", images: ["/og.png"] },
  icons: {
    icon: [{ url: "/orbit-logo.svg", type: "image/svg+xml" }, { url: "/icons/orbit-192.png", sizes: "192x192", type: "image/png" }],
    shortcut: "/orbit-logo.svg",
    apple: [{ url: "/icons/orbit-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#dff3f5" },
    { media: "(prefers-color-scheme: dark)", color: "#26354d" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
