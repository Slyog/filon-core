import { useEffect } from "react";
import { usePanelRegistry } from "@/store/PanelRegistry";
import { usePanelFocus } from "@/store/PanelFocusStore";

export const usePanelHotkeys = () => {
  const { panels } = usePanelRegistry();
  const { activePanel, setActivePanel } = usePanelFocus();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return;

      // Refresh Hotkey (Ctrl + R)
      if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        if (activePanel) console.log(`Hotkey Refresh → ${activePanel}`);
        return;
      }

      const index = parseInt(e.key);
      if (!index || index < 1 || index > panels.length) return;

      const panel = panels[index - 1];
      if (panel.active) {
        e.preventDefault();
        setActivePanel(panel.key);
        // Scroll to panel
        const panelElement = document.querySelector(
          `[aria-label="${panel.title}"]`
        );
        if (panelElement) {
          panelElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [panels, setActivePanel, activePanel]);
};
