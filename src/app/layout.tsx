import { ThemeProvider } from "next-themes";
import "@/app/globals.css";
import { InteractiveLight } from "@/components/ui/InteractiveLight";
import { MindVisualizer } from "@/components/ui/MindVisualizer";
import { AudioResonance } from "@/components/ui/AudioResonance";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="h-full w-full overflow-hidden bg-[#0e0f12] text-white">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <InteractiveLight />
          <MindVisualizer />
          <AudioResonance />
          <LoadingOverlay />
        </ThemeProvider>
      </body>
    </html>
  );
}
