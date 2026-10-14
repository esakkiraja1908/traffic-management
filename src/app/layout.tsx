import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/providers/toast-provider";
import { SettingsProvider } from "@/components/providers/settings-provider";
import { AppShell } from "@/components/layout/app-shell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Traffic Intelligence — AI Traffic Management Platform",
    template: "%s · Traffic Intelligence",
  },
  description:
    "Smart-city traffic monitoring, congestion analytics and LibCity/METR-LA spatiotemporal forecasting workspace. Simulated demo data by default.",
  applicationName: "Traffic Intelligence",
};

export const viewport: Viewport = {
  themeColor: "#050811",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="app-backdrop min-h-screen font-sans antialiased">
        <SettingsProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
