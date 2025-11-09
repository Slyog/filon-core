import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Eye, Keyboard } from "lucide-react";

export function AccessibilityDemo() {
  const [focusedElement, setFocusedElement] = useState<string | null>(null);

  const accessibilityFeatures = [
    {
      icon: <Eye size={20} />,
      title: "4.5:1 Contrast",
      description: "All text meets WCAG AA standards",
      details: "Text Primary (21:1), Text Muted (6.8:1), Brand Cyan (11.5:1)"
    },
    {
      icon: <Keyboard size={20} />,
      title: "Keyboard Navigation",
      description: "Full keyboard support with visible focus rings",
      details: "Tab navigation, Esc to close, animated focus indicators"
    },
    {
      icon: <Check size={20} />,
      title: "ARIA Labels",
      description: "Semantic markup and accessibility attributes",
      details: "role, aria-label, aria-modal, aria-labelledby"
    }
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#FFFFFF' }}>Accessibility</h2>
        <span style={{ fontSize: '14px', color: '#8C8C8C' }}>Inclusive design</span>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {accessibilityFeatures.map((feature, index) => (
          <motion.div
            key={index}
            style={{
              backgroundColor: '#141414',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(47, 243, 255, 0.1)',
              cursor: 'pointer',
            }}
            whileHover={{
              boxShadow: '0 4px 24px rgba(47, 243, 255, 0.15)',
              borderColor: 'rgba(47, 243, 255, 0.3)',
            }}
            transition={{ duration: 0.25, ease: [0.3, 0.7, 0.3, 1] }}
          >
            <div className="flex flex-col gap-3">
              <div 
                className="p-3 rounded-lg w-fit"
                style={{
                  backgroundColor: 'rgba(47, 243, 255, 0.1)',
                  color: '#2FF3FF',
                }}
              >
                {feature.icon}
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF' }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: '14px', color: '#8C8C8C', marginTop: '4px' }}>
                  {feature.description}
                </p>
              </div>
              <div 
                className="pt-3 border-t border-[#2FF3FF10]"
                style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}
              >
                {feature.details}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Focus Ring Demo */}
      <div className="p-6 bg-[#0A0A0A] rounded-lg border border-[#2FF3FF20]">
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF', marginBottom: '16px' }}>
          Focus Ring Demo
        </h3>
        <div className="flex flex-wrap gap-4">
          {['Button', 'Input', 'Link', 'Card'].map((element) => (
            <button
              key={element}
              onFocus={() => setFocusedElement(element)}
              onBlur={() => setFocusedElement(null)}
              style={{
                padding: '12px 20px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: focusedElement === element 
                  ? 'rgba(47, 243, 255, 0.15)' 
                  : 'rgba(47, 243, 255, 0.05)',
                color: focusedElement === element ? '#2FF3FF' : '#8C8C8C',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
                outline: 'none',
                boxShadow: focusedElement === element 
                  ? '0 0 0 3px rgba(47, 243, 255, 0.4)' 
                  : 'none',
              }}
            >
              {element}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Keyboard size={16} style={{ color: '#2FF3FF' }} />
          <span style={{ fontSize: '12px', color: '#8C8C8C' }}>
            Press Tab to navigate and see animated focus rings
          </span>
        </div>
      </div>

      {/* Contrast Examples */}
      <div className="p-6 bg-[#0A0A0A] rounded-lg border border-[#2FF3FF20]">
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF', marginBottom: '16px' }}>
          Contrast Ratios
        </h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between p-3 bg-[#141414] rounded-lg">
            <span style={{ fontSize: '14px', color: '#FFFFFF' }}>
              Text Primary on Base
            </span>
            <div className="flex items-center gap-3">
              <span style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
                21:1
              </span>
              <div 
                className="px-2 py-1 rounded"
                style={{ backgroundColor: 'rgba(47, 243, 255, 0.1)', fontSize: '11px', color: '#2FF3FF' }}
              >
                AAA
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-[#141414] rounded-lg">
            <span style={{ fontSize: '14px', color: '#8C8C8C' }}>
              Text Muted on Base
            </span>
            <div className="flex items-center gap-3">
              <span style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
                6.8:1
              </span>
              <div 
                className="px-2 py-1 rounded"
                style={{ backgroundColor: 'rgba(47, 243, 255, 0.1)', fontSize: '11px', color: '#2FF3FF' }}
              >
                AA
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-[#141414] rounded-lg">
            <span style={{ fontSize: '14px', color: '#2FF3FF' }}>
              Brand Cyan on Base
            </span>
            <div className="flex items-center gap-3">
              <span style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
                11.5:1
              </span>
              <div 
                className="px-2 py-1 rounded"
                style={{ backgroundColor: 'rgba(47, 243, 255, 0.1)', fontSize: '11px', color: '#2FF3FF' }}
              >
                AAA
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
