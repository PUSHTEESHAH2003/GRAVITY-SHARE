import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import GravityScene from "@/components/3d/GravityScene";
import { GravityProvider } from "@/context/GravityContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GravityShare | Temporary File Sharing",
  description: "Share files and text securely for up to 1 hour with unique codes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GravityProvider>
          <GravityScene />
          <nav className="nav" style={{ position: 'relative', zIndex: 10 }}>
            <div className="logo">GRAVITY SHARE</div>
            <div style={{ opacity: 0.6, fontSize: '0.9rem' }}>Secure. Temporary. Instant.</div>
          </nav>
          <main className="container" style={{ position: 'relative', zIndex: 10 }}>
            {children}
          </main>
        </GravityProvider>
      </body>
    </html>
  );
}
