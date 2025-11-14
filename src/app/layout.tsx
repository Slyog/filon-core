import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-filon-bg text-filon-text">
        {children}
      </body>
    </html>
  );
}
