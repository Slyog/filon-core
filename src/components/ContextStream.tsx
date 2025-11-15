import * as React from "react";
import ContextStream from "@/components/layout/ContextStream";
import type { ContextStreamItem } from "@/components/layout/ContextStream";

// Real ContextStream props (matching the interface in layout/ContextStream.tsx)
type RealContextStreamProps = {
  items?: ContextStreamItem[];
  onSelect?: (id: string) => void;
  className?: string;
};

// Legacy Position-Typ aus den alten Tests
export type ContextPosition = "card" | "bottom" | "side";

// Neuer, erweiterter Prop-Typ für Tests:
// - baut auf dem echten ContextStreamProps auf
// - erlaubt zusätzlich legacy props (nodes, position)
// - erlaubt auch legacy items-Format (mit ts statt timestamp, etc.)
export type ContextStreamProps = Omit<RealContextStreamProps, "items"> & {
  items?: ContextStreamItem[] | any[]; // Allow legacy item formats
  nodes?: any[];
  position?: ContextPosition;
  // und falls die Legacy-Tests noch mehr Kram durchreichen:
  [key: string]: any;
};

/**
 * Shim component:
 * - akzeptiert legacy props (nodes, position)
 * - ignoriert sie und leitet nur gültige Props an das echte ContextStream weiter
 */
const ContextStreamShim: React.FC<ContextStreamProps> = (props) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  const { nodes: _nodes, position: _position, ...rest } = props;

  // wir casten hier bewusst auf den echten Prop-Typ
  return <ContextStream {...(rest as RealContextStreamProps)} />;
};

export default ContextStreamShim;
