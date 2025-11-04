export function simulateDecay(start: number, seconds: number) {
  return Math.max(0.5, start - 0.002 * (seconds / 10));
}
