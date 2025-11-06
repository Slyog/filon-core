import { BrainbarTabs } from "./BrainbarTabs";
import { ExplainOverlayShowcase } from "./ExplainOverlay";

export function InteractiveShowcase() {
  return (
    <div className="flex flex-col gap-12">
      <div className="flex items-center justify-between">
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#FFFFFF' }}>Navigation & Overlays</h2>
        <span style={{ fontSize: '14px', color: '#8C8C8C' }}>Advanced interactions</span>
      </div>
      
      <div className="flex flex-col gap-12">
        <BrainbarTabs />
        <div className="h-px bg-gradient-to-r from-transparent via-[#2FF3FF20] to-transparent" />
        <ExplainOverlayShowcase />
      </div>
    </div>
  );
}
