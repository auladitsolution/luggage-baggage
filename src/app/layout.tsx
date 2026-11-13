import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ShopSettingsProvider } from "@/context/ShopSettingsContext";
import { AuthProvider } from "@/context/AuthContext";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#14263D",
};

export const metadata: Metadata = {
  title: "Luggage & Baggage (লাগেজ অ্যান্ড ব্যাগেজ) | যমুনা ফিউচার পার্ক, ঢাকা",
  description: "Luggage & Baggage - যমুনা ফিউচার পার্ক, ঢাকা। অরিজিনাল প্রিমিয়াম লাগেজ, ট্রলি ব্যাগ, ট্রাভেল স্যুটকেস ও ব্যাকপ্যাক। প্রোপাইটর: মোঃ সোহেল শিকদার এবং মোঃ আলম। মোবাইল: 01869749988",
  keywords: [
    "Luggage & Baggage",
    "লাগেজ অ্যান্ড ব্যাগেজ",
    "jamuna future park luggage",
    "trolley bag bangladesh",
    "travel suitcase dhaka",
    "লাগেজ",
    "ট্রলি ব্যাগ",
    "যমুনা ফিউচার পার্ক লাগেজ",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
      { url: "/logo.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
  manifest: "/manifest.json",
  other: {
    google: "notranslate",
    robots: "notranslate",
    "content-language": "bn",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" translate="no" className="notranslate" suppressHydrationWarning>
      <head>
        <meta name="google" content="notranslate" />
        <meta name="robots" content="notranslate" />
        <meta httpEquiv="Content-Language" content="bn" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body 
        className="min-h-screen bg-[#F8FAFC] text-[#0F172A] antialiased selection:bg-[#0D9488]/20 selection:text-[#0D9488]"
        suppressHydrationWarning
      >
        <AuthProvider>
          <ShopSettingsProvider>
            {children}
          </ShopSettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
