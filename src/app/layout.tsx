import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Orbitron, Montserrat } from "next/font/google";
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
  openGraph: {
    title: "KaspaClash - Web3 Fighting Game",
    description: "Real-time PvP battles on Kaspa blockchain",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "KaspaClash - Web3 Fighting Game",
    description: "Real-time PvP battles on Kaspa blockchain",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#40e0d0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} ${montserrat.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
