import { Barlow_Condensed, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-barlow",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jbmono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jbmono",
});

export const metadata = {
  title: "Papan Produksi — Monitoring Line",
  description: "Dashboard monitoring produksi, overtime, dan delivery per line",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body
        className={`${barlow.variable} ${inter.variable} ${jbmono.variable} font-body bg-base-bg text-ink-primary min-h-screen`}
      >
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
