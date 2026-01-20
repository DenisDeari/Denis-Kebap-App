import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TimeProvider } from "@/components/TimeProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "DENIS KEBAP - Bestellen",
  description: "Bestellen Sie online bei DENIS KEBAP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={inter.variable}>
      <body className={inter.className}>
        <TimeProvider>
          {children}
        </TimeProvider>
      </body>
    </html>
  );
}

