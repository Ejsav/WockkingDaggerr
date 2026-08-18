import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import BootScreen from "@/components/BootScreen";
import LiveProvider from "@/components/LiveProvider";
import EasterEggs from "@/components/EasterEggs";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "WockkingDagger — Official Hub",
    template: "%s · WockkingDagger",
  },
  description:
    "The official hub for WockkingDagger. Releases, drops, video archive, store, and live streams. Built for the ones paying attention.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "WockkingDagger — Official Hub",
    description: "Releases, drops, video archive, store, and live streams.",
    type: "website",
    locale: "en_US",
    siteName: "WockkingDagger",
  },
  twitter: {
    card: "summary_large_image",
    title: "WockkingDagger — Official Hub",
    description: "Releases, drops, video archive, store, and live streams.",
    creator: "@wockkingdaggerr",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-ink">
      <body className="grain min-h-screen bg-ink text-bone">
        <BootScreen />
        <EasterEggs />
        <LiveProvider>
          <Navigation />
          <main className="relative z-[2]">{children}</main>
          <Footer />
        </LiveProvider>
      </body>
    </html>
  );
}
