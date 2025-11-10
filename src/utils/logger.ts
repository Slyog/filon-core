export const log = {
  info: (...msg: unknown[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[FILON]", ...msg);
    }
  },
  warn: (...msg: unknown[]) => {
    console.warn("[WARN]", ...msg);
  },
  error: (...msg: unknown[]) => {
    console.error("[ERROR]", ...msg);
  },
};

