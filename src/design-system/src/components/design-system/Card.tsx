import { useState } from "react";
import { motion } from "motion/react";
import { Brain, Lightbulb, BookOpen } from "lucide-react";

interface CardProps {
  variant?: 'default' | 'hover' | 'active';
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function FilonCard({ variant = 'default', title, description, icon }: CardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(variant === 'active');

  const getStyles = () => {
    if (isActive) {
      return {
        border: '1px solid rgba(47, 243, 255, 0.6)',
        boxShadow: '0 4px 32px rgba(47, 243, 255, 0.25)',
        transform: 'translateY(-4px)',
      };
    }

    if (isHovered || variant === 'hover') {
      return {
        border: '1px solid rgba(47, 243, 255, 0.3)',
        boxShadow: '0 4px 24px rgba(47, 243, 255, 0.15)',
        transform: 'translateY(-2px)',
      };
    }

    return {
      border: '1px solid rgba(47, 243, 255, 0.1)',
      boxShadow: '0 0 24px rgba(47, 243, 255, 0.05)',
      transform: 'translateY(0)',
    };
  };

  const styles = getStyles();

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsActive(!isActive)}
      style={{
        ...styles,
        backgroundColor: '#141414',
        padding: '20px',
        borderRadius: '12px',
        transition: 'all 0.25s cubic-bezier(0.3, 0.7, 0.3, 1)',
        cursor: 'pointer',
      }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div 
            className="p-3 rounded-lg"
            style={{
              backgroundColor: 'rgba(47, 243, 255, 0.1)',
              color: '#2FF3FF',
            }}
          >
            {icon}
          </div>
        )}
        <div className="flex-1">
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF', marginBottom: '8px' }}>
            {title}
          </h3>
          <p style={{ fontSize: '14px', color: '#8C8C8C', lineHeight: '1.6' }}>
            {description}
          </p>
        </div>
      </div>
      {isActive && (
        <motion.div
          className="mt-4 pt-4 border-t border-[#2FF3FF20]"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.2 }}
        >
          <span style={{ fontSize: '12px', color: '#2FF3FF', fontFamily: 'JetBrains Mono, monospace' }}>
            ✓ Active · shadow.glow applied
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

export function CardShowcase() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#2FF3FF', marginBottom: '16px' }}>
          Card States
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <FilonCard
              title="Default State"
              description="Base card with minimal glow effect"
              icon={<Brain size={24} />}
            />
            <span style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
              Card/Default
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <FilonCard
              variant="hover"
              title="Hover State"
              description="Elevated with soft outer glow"
              icon={<Lightbulb size={24} />}
            />
            <span style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
              Card/Hover
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <FilonCard
              variant="active"
              title="Active State"
              description="Cyan border with enhanced glow"
              icon={<BookOpen size={24} />}
            />
            <span style={{ fontSize: '12px', color: '#8C8C8C', fontFamily: 'JetBrains Mono, monospace' }}>
              Card/Active
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 bg-[#0A0A0A] rounded-lg border border-[#2FF3FF20]">
        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', marginBottom: '12px' }}>
          Interactive Demo · Click to activate
        </h4>
        <FilonCard
          title="Interactive Thought Card"
          description="Hover to elevate, click to activate. Uses shadow.glow token and motion.soft easing."
          icon={<Brain size={24} />}
        />
      </div>
    </div>
  );
}
