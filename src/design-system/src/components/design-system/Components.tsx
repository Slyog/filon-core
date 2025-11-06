import { ButtonShowcase } from "./Button";
import { InputShowcase } from "./Input";
import { CardShowcase } from "./Card";

export function Components() {
  return (
    <div className="flex flex-col gap-12">
      <div className="flex items-center justify-between">
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#FFFFFF' }}>Interactive Components</h2>
        <span style={{ fontSize: '14px', color: '#8C8C8C' }}>Micro-interactions & motion polish</span>
      </div>
      
      <div className="flex flex-col gap-12">
        <ButtonShowcase />
        <div className="h-px bg-gradient-to-r from-transparent via-[#2FF3FF20] to-transparent" />
        <InputShowcase />
        <div className="h-px bg-gradient-to-r from-transparent via-[#2FF3FF20] to-transparent" />
        <CardShowcase />
      </div>
    </div>
  );
}
