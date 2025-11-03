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
      let selectedType: ThoughtType | string | null = null;
      let customInputValue = "";
      let handleKeyDown: ((e: KeyboardEvent) => void) | null = null;

      const confirmSelection = () => {
        if (handleKeyDown) {
          document.removeEventListener("keydown", handleKeyDown);
        }
        if (selectedType) {
          if (selectedType === "Custom" && customInputValue.trim()) {
            modal.remove();
            resolve(customInputValue.trim());
          } else if (selectedType !== "Custom") {
            modal.remove();
            resolve(selectedType);
          }
        }
      };

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
          <button id="confirmButton" class="hidden w-full mt-2 px-4 py-2 bg-[var(--accent)] text-black rounded-lg font-semibold hover:opacity-90">✅ Confirm</button>
        </div>
      `;
      document.body.appendChild(modal);

      const confirmButton = modal.querySelector(
        "#confirmButton"
      ) as HTMLButtonElement;
      const customInput = modal.querySelector(
        "#customTypeInput"
      ) as HTMLInputElement;

      // Handle Enter key globally
      handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter" && selectedType) {
          e.preventDefault();
          confirmSelection();
        }
      };
      document.addEventListener("keydown", handleKeyDown);

      modal.querySelectorAll("button[data-type]").forEach((btn) =>
        btn.addEventListener("click", (e) => {
          const type = (e.target as HTMLButtonElement).dataset.type!;
          selectedType = type as ThoughtType;

          // Update button styles
          modal.querySelectorAll("button[data-type]").forEach((b) => {
            b.classList.remove("bg-[var(--accent)]", "text-black");
          });
          (e.target as HTMLButtonElement).classList.add(
            "bg-[var(--accent)]",
            "text-black"
          );

          if (type === "Custom") {
            customInput.classList.remove("hidden");
            confirmButton.classList.remove("hidden");
            customInput.focus();
            customInput.addEventListener("input", (ev) => {
              customInputValue = (ev.target as HTMLInputElement).value;
            });
            customInput.addEventListener("keydown", (ev) => {
              if (ev.key === "Enter" && customInputValue.trim()) {
                confirmSelection();
              }
            });
          } else {
            customInput.classList.add("hidden");
            confirmButton.classList.remove("hidden");
            // Auto-confirm for non-custom types after selection
            setTimeout(() => {
              if (selectedType === type) {
                confirmSelection();
              }
            }, 100);
          }
        })
      );

      confirmButton.addEventListener("click", confirmSelection);
    });
  };
  return { getType };
}
