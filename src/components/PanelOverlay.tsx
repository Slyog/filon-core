"use client";
import { motion } from "framer-motion";
import { RefreshCw, Pin, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/Tooltip";

type PanelOverlayProps = {
  onRefresh?: () => void;
  onExplain?: () => void;
  onPin?: () => void;
};

export default function PanelOverlay({
  onRefresh,
  onExplain,
  onPin,
}: PanelOverlayProps) {
  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute top-2 right-2 flex items-center gap-2 rounded-lg bg-black/60 px-2 py-1 shadow-lg backdrop-blur-sm"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              aria-label="Refresh"
              onClick={onRefresh}
              className="text-cyan-300 hover:text-cyan-100 transition-colors"
            >
              <RefreshCw size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Refresh panel</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              aria-label="Explain"
              onClick={onExplain}
              className="text-cyan-300 hover:text-cyan-100 transition-colors"
            >
              <Info size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Explain this panel</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              aria-label="Pin"
              onClick={onPin}
              className="text-cyan-300 hover:text-cyan-100 transition-colors"
            >
              <Pin size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Pin panel</p>
          </TooltipContent>
        </Tooltip>
      </motion.div>
    </TooltipProvider>
  );
}
