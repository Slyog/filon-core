"use client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFeature } from "@/config/featureFlags";
import { usePanelRegistry } from "@/store/PanelRegistry";

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
  const register = usePanelRegistry((s) => s.register);

  useEffect(() => {
    register(flag, title);
  }, [flag, title, register]);

  return (
    <AnimatePresence initial={false}>
      {enabled && (
        <motion.section
          key={flag}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="mb-4 rounded-2xl border border-cyan-700/40 bg-black/40 p-4 shadow-inner"
          role="region"
          aria-label={title}
        >
          <h3 className="mb-2 text-cyan-300 font-medium">{title}</h3>
          {children}
        </motion.section>
      )}
    </AnimatePresence>
  );
}
