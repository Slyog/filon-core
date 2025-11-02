"use client";
import { createContext, useContext, useState } from "react";
import type { MoodKey } from "@/lib/visual/GraphMoodEngine";

interface MindProgressContextType {
  currentMindState: MoodKey;
  setCurrentMindState: (state: MoodKey) => void;
}

const MindProgressContext = createContext<MindProgressContextType>({
  currentMindState: "focus",
  setCurrentMindState: () => {},
});

export const MindProgressProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [currentMindState, setCurrentMindState] = useState<MoodKey>("focus");
  return (
    <MindProgressContext.Provider
      value={{ currentMindState, setCurrentMindState }}
    >
      {children}
    </MindProgressContext.Provider>
  );
};

export const useMindProgress = () => useContext(MindProgressContext);
