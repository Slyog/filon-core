import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Info } from "lucide-react";

interface ExplainOverlayProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function ExplainOverlay({ isOpen: controlledIsOpen, onClose }: ExplainOverlayProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <>
      {/* Trigger Button (for demo) */}
      {controlledIsOpen === undefined && (
        <button
          onClick={() => setInternalIsOpen(true)}
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: '1px solid rgba(47, 243, 255, 0.3)',
            backgroundColor: 'rgba(47, 243, 255, 0.1)',
            color: '#2FF3FF',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          <Info size={18} />
          Open Explain Overlay
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={handleClose}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(10, 10, 10, 0.8)',
                backdropFilter: 'blur(8px)',
                zIndex: 50,
              }}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 20 }}
              transition={{ 
                duration: 0.25,
                ease: [0.25, 0.8, 0.25, 1]
              }}
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '90%',
                maxWidth: '560px',
                backgroundColor: '#141414',
                borderRadius: '16px',
                border: '1px solid rgba(47, 243, 255, 0.3)',
                boxShadow: '0 0 48px rgba(47, 243, 255, 0.25)',
                zIndex: 51,
                padding: '32px',
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              {/* Close button with focus ring */}
              <button
                onClick={handleClose}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'rgba(47, 243, 255, 0.1)',
                  color: '#2FF3FF',
                  cursor: 'pointer',
                  transition: 'all 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(47, 243, 255, 0.4)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>

              {/* Content */}
              <div className="flex flex-col gap-6">
                <div>
                  <h2 
                    id="modal-title"
                    style={{ fontSize: '24px', fontWeight: 600, color: '#FFFFFF' }}
                  >
                    Explain Overlay
                  </h2>
                  <p style={{ fontSize: '14px', color: '#8C8C8C', marginTop: '8px' }}>
                    Modal dialog with smooth transitions
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="p-4 bg-[#0A0A0A] rounded-lg border border-[#2FF3FF20]">
                    <div style={{ fontSize: '14px', color: '#FFFFFF', marginBottom: '8px' }}>
                      Transition Details
                    </div>
                    <ul className="flex flex-col gap-2">
                      <li style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
                        • Scale: 0.98 → 1.0
                      </li>
                      <li style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
                        • Fade: opacity 0 → 1
                      </li>
                      <li style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
                        • Backdrop: blur(8px)
                      </li>
                      <li style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
                        • Duration: 0.25s ease [0.25, 0.8, 0.25, 1]
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 bg-[#0A0A0A] rounded-lg border border-[#2FF3FF20]">
                    <div style={{ fontSize: '14px', color: '#FFFFFF', marginBottom: '8px' }}>
                      Accessibility Features
                    </div>
                    <ul className="flex flex-col gap-2">
                      <li style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
                        • Press <span style={{ color: '#2FF3FF' }}>Esc</span> to close
                      </li>
                      <li style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
                        • Focus ring with glow effect
                      </li>
                      <li style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
                        • ARIA labels and roles
                      </li>
                      <li style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
                        • 4.5:1 contrast ratio maintained
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleClose}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '10px',
                      border: '1px solid rgba(47, 243, 255, 0.2)',
                      backgroundColor: 'transparent',
                      color: '#8C8C8C',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClose}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: '#2FF3FF',
                      color: '#0A0A0A',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
                      boxShadow: '0 0 16px rgba(47, 243, 255, 0.3)',
                    }}
                  >
                    Got it
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function ExplainOverlayShowcase() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#2FF3FF', marginBottom: '16px' }}>
          Explain Overlay (Modal)
        </h3>
        <ExplainOverlay />
      </div>
    </div>
  );
}
