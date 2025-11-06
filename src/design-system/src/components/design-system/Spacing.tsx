export function Spacing() {
  const spacing = [
    { label: "space.xs", value: "4px" },
    { label: "space.sm", value: "8px" },
    { label: "space.md", value: "12px" },
  ];

  const radius = [
    { label: "radius.sm", value: "6px" },
    { label: "radius.md", value: "12px" },
    { label: "radius.lg", value: "20px" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#FFFFFF' }}>Spacing & Radius</h2>
        <span style={{ fontSize: '14px', color: '#8C8C8C' }}>Layout tokens</span>
      </div>
      
      <div className="grid grid-cols-2 gap-8">
        {/* Spacing */}
        <div className="flex flex-col gap-4">
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#2FF3FF' }}>Spacing</h3>
          {spacing.map((space) => (
            <div key={space.label} className="flex items-center gap-4">
              <div
                className="bg-[#2FF3FF]"
                style={{
                  width: space.value,
                  height: space.value,
                  boxShadow: '0 0 12px rgba(47, 243, 255, 0.3)',
                  borderRadius: '2px',
                }}
              />
              <div className="flex flex-col">
                <span style={{ fontSize: '14px', color: '#FFFFFF', fontFamily: 'JetBrains Mono, monospace' }}>
                  {space.label}
                </span>
                <span style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
                  {space.value}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Radius */}
        <div className="flex flex-col gap-4">
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#2FF3FF' }}>Radius</h3>
          {radius.map((rad) => (
            <div key={rad.label} className="flex items-center gap-4">
              <div
                className="bg-[#141414] border border-[#2FF3FF40]"
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: rad.value,
                }}
              />
              <div className="flex flex-col">
                <span style={{ fontSize: '14px', color: '#FFFFFF', fontFamily: 'JetBrains Mono, monospace' }}>
                  {rad.label}
                </span>
                <span style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
                  {rad.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
