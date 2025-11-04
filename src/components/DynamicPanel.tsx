"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFeature } from "@/config/featureFlags";
import { usePanelFocus } from "@/store/PanelFocusStore";
import PanelOverlay from "@/components/PanelOverlay";

type DynamicPanelProps = {
  flag: keyof typeof import("@/config/featureFlags").FEATURE_FLAGS;
  title: string;
  children: React.ReactNode;
};

export default function DynamicPanel({
  flag,
  title,
  children,
}: DynamicPanelProps) {
  const enabled = useFeature(flag);
  const { activePanel } = usePanelFocus();
  const isFocused = activePanel === flag;
  const [hovered, setHovered] = useState(false);

  return (
    <AnimatePresence initial={false}>
      {enabled && (
        <motion.section
          key={flag}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{
            opacity: 1,
            y: 0,
            boxShadow: isFocused
              ? "0 0 20px 4px rgba(47,243,255,0.4)"
              : "0 0 0 0 rgba(0,0,0,0)",
          }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={`relative mb-4 rounded-2xl border border-cyan-700/40 bg-black/40 p-4 shadow-inner transition-all ${
            isFocused ? "ring-2 ring-cyan-400/50" : ""
          }`}
          role="region"
          aria-label={title}
        >
          <h3 className="mb-2 text-cyan-300 font-medium">{title}</h3>
          {children}

          <AnimatePresence>
            {hovered && (
              <PanelOverlay
                onRefresh={() => console.log(`Refresh ${flag}`)}
                onExplain={() => console.log(`Explain ${flag}`)}
                onPin={() => console.log(`Pin ${flag}`)}
              />
            )}
          </AnimatePresence>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
