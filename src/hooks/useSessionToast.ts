export function useSessionToast() {
  return {
    success: (message: string) =>
      console.info("[toast:success]", message),
    error: (message: string) =>
      console.error("[toast:error]", message),
    info: (message: string) =>
      console.log("[toast:info]", message),
  };
}

