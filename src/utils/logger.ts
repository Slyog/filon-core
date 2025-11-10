export const log = {
  info: (...msg: unknown[]) => {
    console.info("[INFO]", ...msg);
  },
  warn: (...msg: unknown[]) => {
    console.warn("[WARN]", ...msg);
  },
  error: (...msg: unknown[]) => {
    const isTest = process.env.NODE_ENV === "test";
    const prefix = isTest ? "[WARN-TEST]" : "[ERROR]";
    const logFn = isTest ? console.warn : console.error;
    logFn(prefix, ...msg);
  },
};

