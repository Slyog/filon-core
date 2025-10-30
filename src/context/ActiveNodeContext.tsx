"use client";
import { createContext, useContext, useState } from "react";

interface ActiveNodeContextType {
  activeNodeId: string | null;
  setActiveNodeId: (id: string | null) => void;
}

const ActiveNodeContext = createContext<ActiveNodeContextType>({
  activeNodeId: null,
  setActiveNodeId: () => {},
});

export const ActiveNodeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  return (
    <ActiveNodeContext.Provider value={{ activeNodeId, setActiveNodeId }}>
      {children}
    </ActiveNodeContext.Provider>
  );
};

export const useActiveNode = () => useContext(ActiveNodeContext);
