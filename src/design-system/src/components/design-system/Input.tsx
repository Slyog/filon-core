import { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

interface InputProps {
  variant?: 'default' | 'focus' | 'error';
  placeholder?: string;
}

export function FilonInput({ variant = 'default', placeholder = "Enter your thought..." }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasError, setHasError] = useState(variant === 'error');

  const getStyles = () => {
    if (hasError) {
      return {
        border: '1px solid rgba(239, 68, 68, 0.5)',
        boxShadow: '0 0 16px rgba(239, 68, 68, 0.3)',
      };
    }

    if (isFocused || variant === 'focus') {
      return {
        border: '1px solid rgba(47, 243, 255, 0.6)',
        boxShadow: '0 0 20px rgba(47, 243, 255, 0.25)',
      };
    }

    return {
      border: '1px solid rgba(47, 243, 255, 0.125)',
      boxShadow: 'none',
    };
  };

  const styles = getStyles();

  return (
    <motion.div
      animate={hasError ? {
        x: [0, -4, 4, -4, 4, 0],
      } : {}}
      transition={{
        duration: 0.4,
        ease: "easeInOut"
      }}
      className="relative"
    >
      <input
        type="text"
        placeholder={placeholder}
        onFocus={() => {
          setIsFocused(true);
          setHasError(false);
        }}
        onBlur={() => setIsFocused(false)}
        style={{
          ...styles,
          backgroundColor: '#141414',
          color: '#FFFFFF',
          padding: '12px 16px',
          paddingRight: hasError ? '40px' : '16px',
          borderRadius: '12px',
          outline: 'none',
          fontSize: '16px',
          width: '100%',
          transition: 'all 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
        className="placeholder:text-[#8C8C8C]"
      />
      {hasError && (
        <div 
          className="absolute right-3 top-1/2 -translate-y-1/2"
          style={{ color: '#EF4444' }}
        >
          <AlertCircle size={20} />
        </div>
      )}
      {isFocused && !hasError && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            border: '2px solid rgba(47, 243, 255, 0.4)',
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
    </motion.div>
  );
}

export function InputShowcase() {
  const [showError, setShowError] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#2FF3FF', marginBottom: '16px' }}>
          Input States
        </h3>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <FilonInput />
            <span style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
              Input/Default
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <FilonInput variant="focus" />
            <span style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
              Input/Focus · glow pulse animation
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <FilonInput variant="error" placeholder="Invalid input" />
            <span style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
              Input/Error · shake motion + red glow
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 bg-[#0A0A0A] rounded-lg border border-[#2FF3FF20]">
        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', marginBottom: '12px' }}>
          Interactive Demo
        </h4>
        <div className="flex flex-col gap-4">
          <FilonInput placeholder="Click to focus and see glow pulse" />
          <button
            onClick={() => setShowError(!showError)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(47, 243, 255, 0.2)',
              backgroundColor: 'transparent',
              color: '#2FF3FF',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            {showError ? 'Hide' : 'Show'} Error State
          </button>
          {showError && <FilonInput variant="error" placeholder="This field is required" />}
        </div>
      </div>
    </div>
  );
}
