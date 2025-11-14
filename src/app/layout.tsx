import "./globals.css";
import { PageTransition } from "@/components/layout/PageTransition";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-filon-bg text-filon-text antialiased">
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
