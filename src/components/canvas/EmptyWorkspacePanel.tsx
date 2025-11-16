"use client";

type EmptyWorkspacePanelProps = {
  onCreateGoalClick?: () => void;
  onAddTrackClick?: () => void;
};

export function EmptyWorkspacePanel({
  onCreateGoalClick,
  onAddTrackClick,
}: EmptyWorkspacePanelProps) {
  return (
    <div className="pointer-events-auto flex w-full max-w-lg flex-col gap-5 rounded-2xl border border-white/10 bg-[#0b0f18]/90 p-8 text-left shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      <div>
        <h2 className="text-2xl font-semibold text-white">Start this workspace</h2>
        <p className="mt-2 text-sm text-white/70">
          Decide what you’re working towards, then add tracks to drive it forward.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onCreateGoalClick}
          className="flex-1 rounded-full bg-white/90 px-4 py-3 text-sm font-semibold text-black transition hover:bg-white"
        >
          Create your first goal
        </button>
        <button
          type="button"
          onClick={onAddTrackClick}
          className="flex-1 rounded-full border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
        >
          Add a track
        </button>
      </div>
    </div>
  );
}

