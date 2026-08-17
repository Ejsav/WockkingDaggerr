import type { Metadata, Viewport } from "next";
import { Anton, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/site/Navigation";
import Footer from "@/components/site/Footer";
import MotionProvider from "@/components/motion/MotionProvider";
import { CartProvider } from "@/components/shop/CartProvider";
import JsonLd from "@/components/site/JsonLd";
import { personSchema, websiteSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/env";
import { WD } from "@/lib/wockkingdagger";

// next/font self-hosts the files and inlines the @font-face rules, so
// there is no render-blocking request to fonts.googleapis.com and no
// layout shift when the display face arrives.
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-anton",
  // Anton is narrow; the fallback is adjusted so the swap does not reflow.
  adjustFontFallback: true,
});

const manrope = Manrope({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

const jetbrains = JetBrains_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${WD.copy.siteTitle} — Official Hub`,
    template: `%s · ${WD.copy.siteTitle}`,
  },
  description: WD.copy.siteDescription,
  applicationName: WD.copy.siteTitle,
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: WD.copy.siteTitle,
    title: `${WD.copy.siteTitle} — Official Hub`,
    description: WD.copy.siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: `${WD.copy.siteTitle} — Official Hub`,
    description: WD.copy.siteDescription,
    creator: WD.tiktok.handle,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-video-preview": -1 },
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  // Never block a reader from zooming.
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`no-js ${anton.variable} ${manrope.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <body className="grain">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <JsonLd data={[websiteSchema(), personSchema()]} />
        <CartProvider>
          <Navigation />
          <main id="main" className="relative z-[2] pt-nav">
            {children}
          </main>
          <Footer />
        </CartProvider>
        <MotionProvider />
      </body>
    </html>
  );
}
