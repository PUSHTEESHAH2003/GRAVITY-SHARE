import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
        <nav className="nav">
          <div className="logo">GRAVITY SHARE</div>
          <div style={{ opacity: 0.6, fontSize: '0.9rem' }}>Secure. Temporary. Instant.</div>
        </nav>
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
