import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Orbitron, Montserrat } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { WalletProvider } from "@/components/providers/WalletProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KaspaClash - Web3 Fighting Game",
  description:
    "A real-time PvP fighting game powered by Kaspa blockchain. Connect your wallet, choose your fighter, and battle for supremacy!",
  keywords: [
    "Kaspa",
    "blockchain",
    "fighting game",
    "PvP",
    "Web3",
    "crypto gaming",
  ],
  authors: [{ name: "KaspaClash Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KaspaClash",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "KaspaClash - Web3 Fighting Game",
    description: "Real-time PvP battles on Kaspa blockchain",
    type: "website",
    locale: "en_US",
    siteName: "KaspaClash",
  },
  twitter: {
    card: "summary_large_image",
    title: "KaspaClash - Web3 Fighting Game",
    description: "Real-time PvP battles on Kaspa blockchain",
    creator: "@KaspaClash",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152" },
      { url: "/icons/icon-180x180.png", sizes: "180x180" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F0B71F" },
    { media: "(prefers-color-scheme: dark)", color: "#0D0D0D" },
  ],
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* PWA Apple-specific meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
        <link rel="apple-touch-startup-image" href="/icons/splash-screen.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} ${montserrat.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <WalletProvider>{children}</WalletProvider>
        
        {/* Service Worker Registration */}
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                    console.log('[PWA] Service Worker registered:', registration.scope);
                  })
                  .catch(function(error) {
                    console.log('[PWA] Service Worker registration failed:', error);
                  });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
