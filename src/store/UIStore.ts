"use client";

import { create } from "zustand";

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

interface UIStoreState {
  viewport: ViewportState | null;
  subscribers: Set<(viewport: ViewportState | null) => void>;
  setViewportState: (viewport: ViewportState) => void;
  subscribeMiniMap: (callback: (viewport: ViewportState | null) => void) => () => void;
}

export const useUIStore = create<UIStoreState>((set, get) => ({
  viewport: null,
  subscribers: new Set(),

  setViewportState: (viewport: ViewportState) => {
    set({ viewport });
    // Notify all subscribers
    get().subscribers.forEach((callback) => {
      callback(viewport);
    });
  },

  subscribeMiniMap: (callback: (viewport: ViewportState | null) => void) => {
    const state = get();
    state.subscribers.add(callback);
    
    // Immediately call with current viewport if available
    if (state.viewport) {
      callback(state.viewport);
    }

    // Return unsubscribe function
    return () => {
      const currentState = get();
      currentState.subscribers.delete(callback);
    };
  },
}));

