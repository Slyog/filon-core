import { Colors } from "./components/design-system/Colors";
import { Typography } from "./components/design-system/Typography";
import { Spacing } from "./components/design-system/Spacing";
import { Motion } from "./components/design-system/Motion";
import { GlowTokens } from "./components/design-system/GlowTokens";
import { Components } from "./components/design-system/Components";
import { InteractiveShowcase } from "./components/design-system/InteractiveShowcase";
import { AccessibilityDemo } from "./components/design-system/AccessibilityDemo";
import { Layout } from "./components/design-system/Layout";
import { BookOpen } from "lucide-react";

export default function App() {
  return (
    <div 
      className="min-h-screen p-8"
      style={{
        backgroundColor: '#0A0A0A',
      }}
    >
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 
              style={{ 
                fontSize: '48px', 
                fontWeight: 700, 
                color: '#2FF3FF',
                textShadow: '0 0 32px rgba(47, 243, 255, 0.4)',
                letterSpacing: '-0.02em',
              }}
            >
              FILON
            </h1>
            <p style={{ fontSize: '16px', color: '#8C8C8C', marginTop: '8px' }}>
              Dark minimal design system with cyan accent & subtle glow
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/guidelines/Guidelines.md"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(47, 243, 255, 0.2)',
                backgroundColor: 'rgba(47, 243, 255, 0.05)',
                color: '#2FF3FF',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(47, 243, 255, 0.1)';
                e.currentTarget.style.boxShadow = '0 0 16px rgba(47, 243, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(47, 243, 255, 0.05)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <BookOpen size={16} />
              Guidelines
            </a>
            <div 
              className="px-4 py-2 rounded-lg"
              style={{
                backgroundColor: 'rgba(47, 243, 255, 0.05)',
                border: '1px solid rgba(47, 243, 255, 0.2)',
              }}
            >
              <span style={{ fontSize: '12px', color: '#2FF3FF', fontFamily: 'JetBrains Mono, monospace' }}>
                v1.0 · Design Tokens
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Design System Frames */}
      <div className="max-w-7xl mx-auto flex flex-col gap-12">
        {/* Frame: Colors */}
        <section 
          className="p-8 rounded-2xl"
          style={{
            backgroundColor: '#141414',
            border: '1px solid rgba(47, 243, 255, 0.1)',
            boxShadow: '0 0 24px rgba(47, 243, 255, 0.05)',
          }}
        >
          <Colors />
        </section>

        {/* Frame: Typography */}
        <section 
          className="p-8 rounded-2xl"
          style={{
            backgroundColor: '#141414',
            border: '1px solid rgba(47, 243, 255, 0.1)',
            boxShadow: '0 0 24px rgba(47, 243, 255, 0.05)',
          }}
        >
          <Typography />
        </section>

        {/* Frame: Spacing & Radius */}
        <section 
          className="p-8 rounded-2xl"
          style={{
            backgroundColor: '#141414',
            border: '1px solid rgba(47, 243, 255, 0.1)',
            boxShadow: '0 0 24px rgba(47, 243, 255, 0.05)',
          }}
        >
          <Spacing />
        </section>

        {/* Frame: Shadows & Motion */}
        <section 
          className="p-8 rounded-2xl"
          style={{
            backgroundColor: '#141414',
            border: '1px solid rgba(47, 243, 255, 0.1)',
            boxShadow: '0 0 24px rgba(47, 243, 255, 0.05)',
          }}
        >
          <Motion />
        </section>

        {/* Frame: Glow System */}
        <section 
          className="p-8 rounded-2xl"
          style={{
            backgroundColor: '#141414',
            border: '1px solid rgba(47, 243, 255, 0.1)',
            boxShadow: '0 0 24px rgba(47, 243, 255, 0.05)',
          }}
        >
          <GlowTokens />
        </section>

        {/* Frame: Interactive Components */}
        <section 
          className="p-8 rounded-2xl"
          style={{
            backgroundColor: '#141414',
            border: '1px solid rgba(47, 243, 255, 0.1)',
            boxShadow: '0 0 24px rgba(47, 243, 255, 0.05)',
          }}
        >
          <Components />
        </section>

        {/* Frame: Navigation & Overlays */}
        <section 
          className="p-8 rounded-2xl"
          style={{
            backgroundColor: '#141414',
            border: '1px solid rgba(47, 243, 255, 0.1)',
            boxShadow: '0 0 24px rgba(47, 243, 255, 0.05)',
          }}
        >
          <InteractiveShowcase />
        </section>

        {/* Frame: Accessibility */}
        <section 
          className="p-8 rounded-2xl"
          style={{
            backgroundColor: '#141414',
            border: '1px solid rgba(47, 243, 255, 0.1)',
            boxShadow: '0 0 24px rgba(47, 243, 255, 0.05)',
          }}
        >
          <AccessibilityDemo />
        </section>

        {/* Frame: Layout Preview */}
        <section 
          className="p-8 rounded-2xl"
          style={{
            backgroundColor: '#141414',
            border: '1px solid rgba(47, 243, 255, 0.1)',
            boxShadow: '0 0 24px rgba(47, 243, 255, 0.05)',
          }}
        >
          <Layout />
        </section>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-[#2FF3FF10]">
        <div className="flex items-center justify-between">
          <span style={{ fontSize: '14px', color: '#8C8C8C' }}>
            Design system foundation for FILON workspace
          </span>
          <span style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
            Built with React + Tailwind CSS + Motion
          </span>
        </div>
      </div>
    </div>
  );
}
