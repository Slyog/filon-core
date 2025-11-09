import { useState } from "react";
import { motion } from "framer-motion";

export function Motion() {
  const [hoveredShadow, setHoveredShadow] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#FFFFFF' }}>Shadows & Motion</h2>
        <span style={{ fontSize: '14px', color: '#8C8C8C' }}>Effects & timing</span>
      </div>
      
      <div className="grid grid-cols-2 gap-8">
        {/* Shadows */}
        <div className="flex flex-col gap-4">
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#2FF3FF' }}>Glow Shadow</h3>
          <motion.div
            className="w-full h-32 bg-[#141414] rounded-xl cursor-pointer"
            onMouseEnter={() => setHoveredShadow(true)}
            onMouseLeave={() => setHoveredShadow(false)}
            animate={{
              boxShadow: hoveredShadow 
                ? '0 0 48px rgba(47, 243, 255, 0.4)' 
                : '0 0 32px rgba(47, 243, 255, 0.2)',
            }}
            transition={{
              duration: 0.25,
              ease: [0.3, 0.7, 0.3, 1]
            }}
          />
          <div className="flex flex-col gap-1">
            <span style={{ fontSize: '14px', color: '#FFFFFF', fontFamily: 'JetBrains Mono, monospace' }}>
              shadow.glow
            </span>
            <span style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
              0 0 32px #2FF3FF33 · hover to enhance
            </span>
          </div>
        </div>

        {/* Motion */}
        <div className="flex flex-col gap-4">
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#2FF3FF' }}>Motion Presets</h3>
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-[#141414] rounded-lg border border-[#2FF3FF20]">
              <div className="flex flex-col gap-1">
                <span style={{ fontSize: '14px', color: '#FFFFFF', fontFamily: 'JetBrains Mono, monospace' }}>
                  motion.fast
                </span>
                <span style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
                  0.15s ease [0.2, 0.8, 0.2, 1]
                </span>
                <span style={{ fontSize: '11px', color: '#8C8C8C', marginTop: '4px' }}>
                  Buttons, toggles, hovers
                </span>
              </div>
            </div>

            <div className="p-4 bg-[#141414] rounded-lg border border-[#2FF3FF20]">
              <div className="flex flex-col gap-1">
                <span style={{ fontSize: '14px', color: '#FFFFFF', fontFamily: 'JetBrains Mono, monospace' }}>
                  motion.soft
                </span>
                <span style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
                  0.25s ease [0.3, 0.7, 0.3, 1]
                </span>
                <span style={{ fontSize: '11px', color: '#8C8C8C', marginTop: '4px' }}>
                  Cards, modals, layouts
                </span>
              </div>
            </div>

            <div className="p-4 bg-[#141414] rounded-lg border border-[#2FF3FF20]">
              <div className="flex flex-col gap-1">
                <span style={{ fontSize: '14px', color: '#FFFFFF', fontFamily: 'JetBrains Mono, monospace' }}>
                  motion.tabs
                </span>
                <span style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
                  0.18s ease [0.25, 0.8, 0.25, 1]
                </span>
                <span style={{ fontSize: '11px', color: '#8C8C8C', marginTop: '4px' }}>
                  Tab navigation
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
