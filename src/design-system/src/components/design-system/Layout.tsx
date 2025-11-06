export function Layout() {
  const tabs = ["Idea", "Knowledge", "Guide", "Reflection"];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#FFFFFF' }}>Layout Preview</h2>
        <span style={{ fontSize: '14px', color: '#8C8C8C' }}>FILON workspace</span>
      </div>
      
      <div 
        className="w-full rounded-xl overflow-hidden border border-[#2FF3FF20]"
        style={{
          backgroundColor: '#0A0A0A',
          boxShadow: '0 0 32px rgba(47, 243, 255, 0.1)',
        }}
      >
        {/* Brainbar - Top Navigation */}
        <div 
          className="flex items-center justify-between px-6 py-4 border-b border-[#2FF3FF20]"
          style={{
            backgroundColor: '#141414',
          }}
        >
          <div className="flex items-center gap-6">
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#2FF3FF' }}>
              FILON
            </div>
            <div className="flex gap-2">
              {tabs.map((tab, index) => (
                <button
                  key={tab}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: index === 0 ? 'rgba(47, 243, 255, 0.1)' : 'transparent',
                    color: index === 0 ? '#2FF3FF' : '#8C8C8C',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div style={{ fontSize: '14px', color: '#8C8C8C' }}>Brainbar</div>
        </div>

        {/* Main Area */}
        <div 
          className="flex items-center justify-center p-12"
          style={{
            minHeight: '320px',
          }}
        >
          {/* Centered Thought Node */}
          <div
            style={{
              backgroundColor: '#141414',
              padding: '24px 32px',
              borderRadius: '16px',
              boxShadow: '0 0 32px rgba(47, 243, 255, 0.2)',
              border: '1px solid rgba(47, 243, 255, 0.15)',
              minWidth: '240px',
            }}
          >
            <div className="flex flex-col items-center gap-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: 'rgba(47, 243, 255, 0.1)',
                  boxShadow: '0 0 16px rgba(47, 243, 255, 0.3)',
                }}
              >
                <div 
                  className="w-6 h-6 rounded-full"
                  style={{
                    backgroundColor: '#2FF3FF',
                    boxShadow: '0 0 12px rgba(47, 243, 255, 0.6)',
                  }}
                />
              </div>
              <div className="text-center">
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#FFFFFF' }}>
                  thought
                </div>
                <div style={{ fontSize: '14px', color: '#8C8C8C', marginTop: '4px' }}>
                  Central node
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Info Bar */}
        <div 
          className="flex items-center justify-center px-6 py-3 border-t border-[#2FF3FF10]"
          style={{
            backgroundColor: 'rgba(20, 20, 20, 0.5)',
          }}
        >
          <div style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
            Main workspace with centered thought node and navigation
          </div>
        </div>
      </div>
    </div>
  );
}
