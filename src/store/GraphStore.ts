import { create } from "zustand";

type GraphState = {
  graphLoadedOnce: boolean;
  setGraphLoadedOnce: (loaded: boolean) => void;
};

export const useGraphStore = create<GraphState>((set) => ({
  graphLoadedOnce: false,
  setGraphLoadedOnce: (loaded: boolean) => {
    console.log("🔄 Graph loaded state:", loaded);
    set({ graphLoadedOnce: loaded });
  },
}));
