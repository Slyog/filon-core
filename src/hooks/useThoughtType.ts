/**
 * Thought Type Selector Hook
 * Displays a modal for selecting or defining a custom thought type
 */

export const THOUGHT_TYPES = [
  "Idea",
  "Knowledge",
  "Guide",
  "Inspiration",
  "Reflection",
  "Custom",
] as const;

export type ThoughtType = (typeof THOUGHT_TYPES)[number];

export function useThoughtType() {
  const getType = async (): Promise<ThoughtType | string> => {
    return new Promise((resolve) => {
      const modal = document.createElement("div");
      modal.className =
        "fixed inset-0 flex items-center justify-center bg-black/60 z-[9999]";
      modal.innerHTML = `
        <div class="bg-[var(--muted)] text-[var(--foreground)] p-6 rounded-2xl shadow-lg max-w-sm w-full text-center space-y-4">
          <h3 class="text-lg font-semibold text-[var(--accent)]">Select thought type</h3>
          <div class="flex flex-wrap justify-center gap-2">
            ${THOUGHT_TYPES.map(
              (t) =>
                `<button data-type="${t}" class="px-3 py-1.5 rounded-lg border border-[var(--accent)] hover:bg-[rgba(47,243,255,0.1)]">${t}</button>`
            ).join("")}
          </div>
          <input id="customTypeInput" class="hidden w-full mt-2 p-2 rounded-md bg-[var(--background)] border border-[var(--accent)]" placeholder="Custom type..." />
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelectorAll("button").forEach((btn) =>
        btn.addEventListener("click", (e) => {
          const type = (e.target as HTMLButtonElement).dataset.type!;
          if (type === "Custom") {
            const input = modal.querySelector("#customTypeInput") as HTMLInputElement;
            input.classList.remove("hidden");
            input.focus();
            input.addEventListener("keydown", (ev) => {
              if (ev.key === "Enter" && input.value.trim()) {
                modal.remove();
                resolve(input.value.trim());
              }
            });
          } else {
            modal.remove();
            resolve(type);
          }
        })
      );
    });
  };
  return { getType };
}
