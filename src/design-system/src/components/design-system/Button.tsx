import { useState } from "react";
import { Sparkles, Plus, ArrowRight } from "lucide-react";

interface ButtonProps {
  variant?: 'default' | 'hover' | 'pressed' | 'disabled';
  icon?: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
}

export function FilonButton({ variant = 'default', icon, children, disabled = false }: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const getStyles = () => {
    if (disabled || variant === 'disabled') {
      return {
        backgroundColor: '#2FF3FF',
        color: '#0A0A0A',
        opacity: 0.4,
        boxShadow: 'none',
        transform: 'scale(1)',
        cursor: 'not-allowed',
      };
    }

    if (isPressed || variant === 'pressed') {
      return {
        backgroundColor: '#1A1A1A',
        color: '#2FF3FF',
        boxShadow: 'inset 0 0 20px rgba(47, 243, 255, 0.3)',
        transform: 'scale(0.98)',
      };
    }

    if (isHovered || variant === 'hover') {
      return {
        backgroundColor: '#2FF3FF',
        color: '#0A0A0A',
        boxShadow: '0 0 32px rgba(47, 243, 255, 0.5)',
        transform: 'scale(1.03)',
      };
    }

    return {
      backgroundColor: '#2FF3FF',
      color: '#0A0A0A',
      boxShadow: '0 0 12px rgba(47, 243, 255, 0.3)',
      transform: 'scale(1)',
    };
  };

  const styles = getStyles();

  return (
    <button
      disabled={disabled}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => !disabled && setIsPressed(true)}
      onMouseUp={() => !disabled && setIsPressed(false)}
      onFocus={(e) => {
        if (!disabled) {
          e.currentTarget.style.boxShadow = `${styles.boxShadow}, 0 0 0 3px rgba(47, 243, 255, 0.4)`;
        }
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = styles.boxShadow;
      }}
      style={{
        ...styles,
        padding: '12px 24px',
        borderRadius: '12px',
        border: 'none',
        fontSize: '16px',
        fontWeight: 600,
        transition: 'all 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        outline: 'none',
      }}
      aria-disabled={disabled}
    >
      {icon}
      {children}
    </button>
  );
}

export function ButtonShowcase() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#2FF3FF', marginBottom: '16px' }}>
          Button States
        </h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-2">
            <FilonButton icon={<Plus size={20} />}>
              Default
            </FilonButton>
            <span style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
              Button/Primary/Default
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <FilonButton variant="hover" icon={<Sparkles size={20} />}>
              Hover
            </FilonButton>
            <span style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
              Button/Primary/Hover
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <FilonButton variant="pressed" icon={<ArrowRight size={20} />}>
              Pressed
            </FilonButton>
            <span style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
              Button/Primary/Pressed
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <FilonButton variant="disabled" icon={<Plus size={20} />}>
              Disabled
            </FilonButton>
            <span style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
              Button/Primary/Disabled
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 bg-[#0A0A0A] rounded-lg border border-[#2FF3FF20]">
        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', marginBottom: '12px' }}>
          Interactive Demo
        </h4>
        <FilonButton icon={<Sparkles size={20} />}>
          Try Hover & Press
        </FilonButton>
      </div>
    </div>
  );
}
