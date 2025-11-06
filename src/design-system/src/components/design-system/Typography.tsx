export function Typography() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#FFFFFF' }}>Typography</h2>
        <span style={{ fontSize: '14px', color: '#8C8C8C' }}>Inter & JetBrains Mono</span>
      </div>
      
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#FFFFFF' }}>
            Heading XL
          </div>
          <span style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
            32px · Bold · Inter
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#FFFFFF' }}>
            Heading Large
          </div>
          <span style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
            24px · Semibold · Inter
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <div style={{ fontSize: '16px', fontWeight: 400, color: '#FFFFFF' }}>
            Text Base — The quick brown fox jumps over the lazy dog.
          </div>
          <span style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
            16px · Regular · Inter
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <div style={{ fontSize: '14px', fontWeight: 400, color: '#8C8C8C' }}>
            Text Muted — Supporting information and metadata
          </div>
          <span style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
            14px · Regular · Inter · #8C8C8C
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <div style={{ fontSize: '14px', fontWeight: 400, color: '#2FF3FF', fontFamily: 'JetBrains Mono, monospace' }}>
            const thought = "Code & monospace text";
          </div>
          <span style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
            14px · Regular · JetBrains Mono
          </span>
        </div>
      </div>
    </div>
  );
}
