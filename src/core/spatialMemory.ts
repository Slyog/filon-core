import localforage from "localforage";

export interface SpatialState {
  x: number;
  y: number;
  zoom: number;
  focusedNodeId?: string;
  lastVisitedNodes: string[];
  timestamp: number;
}

export const saveSpatialState = async (sessionId: string, state: SpatialState) => {
  await localforage.setItem(`spatial:${sessionId}`, state);
};

export const loadSpatialState = async (sessionId: string): Promise<SpatialState | null> => {
  return await localforage.getItem(`spatial:${sessionId}`);
};

export const clearSpatialState = async (sessionId: string) => {
  await localforage.removeItem(`spatial:${sessionId}`);
};

