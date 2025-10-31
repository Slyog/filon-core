/**
 * Silverbullet-Core: zentrale Steuerung kommender Merge-Strategien.
 * Später: Realtime WebSocket-Bridge, User-Prioritäten, Undo-Stacks.
 */
export interface MergeEvent {
  type: "merge" | "conflict" | "commit";
  payload?: any;
  timestamp: number;
}

export const SilverbulletCore = {
  events: [] as MergeEvent[],
  log(event: MergeEvent) {
    this.events.push(event);
    console.info("[Silverbullet]", event);
  },
};
