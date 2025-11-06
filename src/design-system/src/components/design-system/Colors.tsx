export function Colors() {
  const colors = [
    { label: "brand.cyan", value: "#2FF3FF", glow: true },
    { label: "surface.base", value: "#0A0A0A" },
    { label: "surface.card", value: "#141414" },
    { label: "text.primary", value: "#FFFFFF" },
    { label: "text.muted", value: "#8C8C8C" },
    { label: "glow.outer", value: "#2FF3FF33" },
    { label: "alert.warning", value: "#FFB800" },
    { label: "alert.error", value: "#FF4757" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#FFFFFF' }}>Colors</h2>
        <span style={{ fontSize: '14px', color: '#8C8C8C' }}>Brand palette</span>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        {colors.map((color) => (
          <div key={color.label} className="flex flex-col gap-3">
            <div
              className="w-full h-24 rounded-lg transition-all duration-150"
              style={{
                backgroundColor: color.value,
                boxShadow: color.glow ? '0 0 24px rgba(47, 243, 255, 0.4)' : 'none',
              }}
            />
            <div className="flex flex-col gap-1">
              <span style={{ fontSize: '14px', color: '#FFFFFF', fontFamily: 'JetBrains Mono, monospace' }}>
                {color.label}
              </span>
              <span style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
                {color.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
