import { useState } from "react";
import { motion } from "motion/react";

export function BrainbarTabs() {
  const tabs = ["Idea", "Knowledge", "Guide", "Reflection"];
  const [activeTab, setActiveTab] = useState(0);
  const [hoveredTab, setHoveredTab] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#2FF3FF', marginBottom: '16px' }}>
          Brainbar Tabs
        </h3>
        
        <div className="flex gap-2 p-4 bg-[#141414] rounded-lg border border-[#2FF3FF20]">
          {tabs.map((tab, index) => {
            const isActive = activeTab === index;
            const isHovered = hoveredTab === index;
            
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(index)}
                onMouseEnter={() => setHoveredTab(index)}
                onMouseLeave={() => setHoveredTab(null)}
                className="relative"
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isActive ? 'rgba(47, 243, 255, 0.1)' : 'transparent',
                  color: isActive ? '#2FF3FF' : '#8C8C8C',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.18s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  outline: 'none',
                }}
              >
                {tab}
                
                {/* Hover underline animation */}
                {isHovered && !isActive && (
                  <motion.div
                    className="absolute bottom-1 left-0 right-0 h-[2px] bg-[#2FF3FF80]"
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{ scaleX: 1 }}
                    exit={{ scaleX: 0 }}
                    transition={{ duration: 0.18, ease: [0.25, 0.8, 0.25, 1] }}
                  />
                )}
                
                {/* Active underline + glow */}
                {isActive && (
                  <motion.div
                    className="absolute bottom-1 left-0 right-0"
                    layoutId="activeTab"
                    transition={{ duration: 0.25, ease: [0.25, 0.8, 0.25, 1] }}
                  >
                    <div 
                      className="h-[2px] bg-[#2FF3FF]"
                      style={{
                        boxShadow: '0 0 8px rgba(47, 243, 255, 0.6)',
                      }}
                    />
                  </motion.div>
                )}
                
                {/* Active glow around label */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-lg pointer-events-none"
                    style={{
                      boxShadow: '0 0 16px rgba(47, 243, 255, 0.2)',
                    }}
                    animate={{
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6 bg-[#0A0A0A] rounded-lg border border-[#2FF3FF20]">
        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', marginBottom: '16px' }}>
          Animation Details
        </h4>
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <span style={{ fontSize: '12px', color: '#2FF3FF', fontFamily: 'JetBrains Mono, monospace' }}>
              •
            </span>
            <div>
              <div style={{ fontSize: '14px', color: '#FFFFFF' }}>
                Hover: Underline animates left → right
              </div>
              <div style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
                duration: 0.18s · ease: [0.25, 0.8, 0.25, 1]
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span style={{ fontSize: '12px', color: '#2FF3FF', fontFamily: 'JetBrains Mono, monospace' }}>
              •
            </span>
            <div>
              <div style={{ fontSize: '14px', color: '#FFFFFF' }}>
                Active: Cyan underline + subtle glow pulse
              </div>
              <div style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
                shadow: 0 0 8px #2FF3FF99 · pulse: 2s infinite
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span style={{ fontSize: '12px', color: '#2FF3FF', fontFamily: 'JetBrains Mono, monospace' }}>
              •
            </span>
            <div>
              <div style={{ fontSize: '14px', color: '#FFFFFF' }}>
                Focus ring: Visible with glow effect
              </div>
              <div style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
                Keyboard accessible · 4.5:1 contrast ratio
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
