import { ThemeProvider } from "next-themes";
import Sidebar from "@/components/Sidebar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="h-full w-full overflow-hidden bg-[#0e0f12] text-white">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex">
            <Sidebar />
            <main className="flex-1 ml-64 min-h-screen bg-[var(--background)]">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
