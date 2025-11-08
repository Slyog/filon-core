import "@testing-library/jest-dom";

// Silence noisy warnings (ReactFlow, FramerMotion)
jest.spyOn(console, "warn").mockImplementation((msg) => {
  if (typeof msg === "string" && msg.includes("useLayoutEffect")) return;
  if (typeof msg === "string" && msg.includes("deprecated")) return;
  console.log("[jest:warn]", msg);
});

jest.spyOn(console, "error").mockImplementation(() => {});

// Polyfill ResizeObserver (for ReactFlow + FramerMotion)
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(global as any).ResizeObserver = ResizeObserver;

class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
(global as any).IntersectionObserver = IntersectionObserver;

// Mock requestAnimationFrame
(global as any).requestAnimationFrame = (cb: FrameRequestCallback) =>
  setTimeout(cb, 0);

// Ensure window.matchMedia exists for prefers-reduced-motion checks
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }),
});

// Mock Canvas getContext for MiniMap
HTMLCanvasElement.prototype.getContext = jest.fn((contextType: string) => {
  if (contextType === "2d") {
    return {
      clearRect: jest.fn(),
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      createRadialGradient: jest.fn(() => ({
        addColorStop: jest.fn(),
      })),
      getImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(4 * 200 * 150),
      })),
    } as any;
  }
  return null;
});

// Polyfill for TextEncoder/TextDecoder
import { TextEncoder, TextDecoder } from "util";
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

// Mock scroll / layout APIs
Object.defineProperty(window, "scrollTo", { value: () => {}, writable: true });

// Polyfill for localStorage
Object.defineProperty(window, "localStorage", {
  value: (function () {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => (key in store ? store[key] : null),
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })(),
});
