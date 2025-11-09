import { useEffect } from "react";

export const useAutoFocusScroll = (
  ref: React.RefObject<HTMLElement | null>,
  isActive: boolean,
  duration = 800
) => {
  useEffect(() => {
    if (isActive && ref.current) {
      const el = ref.current;
      const rect = el.getBoundingClientRect();
      const scrollY =
        window.scrollY + rect.top - window.innerHeight / 2 + rect.height / 2;
      const scrollX =
        window.scrollX + rect.left - window.innerWidth / 2 + rect.width / 2;

      window.scrollTo({
        top: scrollY,
        left: scrollX,
        behavior: "smooth",
      });

      // kurzzeitiger Glow-Puls als visuelles Feedback
      el.animate(
        [
          { boxShadow: "0 0 0px hsl(var(--filon-accent)/0.0)" },
          { boxShadow: "0 0 20px hsl(var(--filon-accent)/0.6)" },
          { boxShadow: "0 0 0px hsl(var(--filon-accent)/0.0)" },
        ],
        { duration: duration, easing: "ease-in-out" }
      );
    }
  }, [isActive, ref, duration]);
};

