import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { Toaster } from "@/components/ui/Toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Maatri Suraksha | Maternal Health AI Care Companion",
  description:
    "Predict, prevent, and care for maternal health risks in rural India with an AI-powered companion for ASHA workers, nurses, and doctors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[var(--gradient-soft)] text-[var(--foreground)]`}
      >
        <AppProviders>
          <OfflineBanner />
          {children}
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
