import { motion } from "framer-motion";

export function GlowTokens() {
  const glowTokens = [
    {
      name: "glow.outer",
      value: "#2FF3FF33",
      opacity: "20%",
      usage: "Default glow on inactive elements"
    },
    {
      name: "glow.focus",
      value: "#2FF3FF80",
      opacity: "50%",
      usage: "Hover states and soft highlights"
    },
    {
      name: "glow.intense",
      value: "#2FF3FF99",
      opacity: "60%",
      usage: "Active/focused states with pulsing"
    }
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#FFFFFF' }}>Glow System</h2>
        <span style={{ fontSize: '14px', color: '#8C8C8C' }}>Universal accent glow</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {glowTokens.map((token, index) => (
          <div key={index} className="flex flex-col gap-4">
            <motion.div
              className="w-full h-32 bg-[#141414] rounded-xl"
              style={{
                boxShadow: `0 0 ${24 + index * 12}px ${token.value}`,
              }}
              whileHover={{
                boxShadow: `0 0 ${32 + index * 16}px ${token.value}`,
                scale: 1.02,
              }}
              transition={{
                duration: 0.25,
                ease: [0.3, 0.7, 0.3, 1]
              }}
            />
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span style={{ fontSize: '14px', color: '#FFFFFF', fontFamily: 'JetBrains Mono, monospace' }}>
                  {token.name}
                </span>
                <span style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
                  {token.opacity}
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
                {token.value}
              </span>
              <span style={{ fontSize: '11px', color: '#8C8C8C' }}>
                {token.usage}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-[#0A0A0A] rounded-lg border border-[#2FF3FF20]">
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF', marginBottom: '12px' }}>
          Usage Guidelines
        </h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <span style={{ fontSize: '12px', color: '#2FF3FF', fontFamily: 'JetBrains Mono, monospace' }}>
              •
            </span>
            <div style={{ fontSize: '14px', color: '#8C8C8C' }}>
              Apply <span style={{ color: '#2FF3FF', fontFamily: 'JetBrains Mono, monospace' }}>glow.outer</span> to all interactive elements at rest
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span style={{ fontSize: '12px', color: '#2FF3FF', fontFamily: 'JetBrains Mono, monospace' }}>
              •
            </span>
            <div style={{ fontSize: '14px', color: '#8C8C8C' }}>
              Use <span style={{ color: '#2FF3FF', fontFamily: 'JetBrains Mono, monospace' }}>glow.focus</span> for hover states and keyboard focus rings
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span style={{ fontSize: '12px', color: '#2FF3FF', fontFamily: 'JetBrains Mono, monospace' }}>
              •
            </span>
            <div style={{ fontSize: '14px', color: '#8C8C8C' }}>
              Reserve <span style={{ color: '#2FF3FF', fontFamily: 'JetBrains Mono, monospace' }}>glow.intense</span> for active/selected states with pulsing animation
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span style={{ fontSize: '12px', color: '#2FF3FF', fontFamily: 'JetBrains Mono, monospace' }}>
              •
            </span>
            <div style={{ fontSize: '14px', color: '#8C8C8C' }}>
              Glows should always transition smoothly using <span style={{ color: '#2FF3FF', fontFamily: 'JetBrains Mono, monospace' }}>motion.fast</span> or <span style={{ color: '#2FF3FF', fontFamily: 'JetBrains Mono, monospace' }}>motion.soft</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
