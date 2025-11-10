import "./globals.css";

import type { Metadata } from "next";
import { RootLayoutClient } from "@/components/RootLayoutClient";

export const metadata: Metadata = {
  title: "FILON",
  description: "The mind that visualizes itself.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#0A0F12] text-cyan-100" suppressHydrationWarning>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
