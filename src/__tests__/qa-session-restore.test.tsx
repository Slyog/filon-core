/**
 * @jest-environment jsdom
 */

import { saveCanvasSession, clearCanvasSession, hasDirtySession, markSessionClean, loadCanvasSession } from "@/lib/session";
import { logTelemetry } from "@/utils/telemetryLogger";

// Mock telemetry logger
jest.mock("@/utils/telemetryLogger", () => ({
  logTelemetry: jest.fn(() => Promise.resolve()),
}));

describe("Session Restore Logic", () => {
  beforeEach(() => {
    clearCanvasSession();
    jest.clearAllMocks();
  });

  afterEach(() => {
    clearCanvasSession();
  });

  describe("Toast visibility logic", () => {
    it("should NOT show toast when no session exists", () => {
      expect(hasDirtySession()).toBe(false);
    });

    it("should NOT show toast when session has dirty = false", () => {
      // Save a session
      saveCanvasSession({
        nodes: [{ id: "test-1", type: "default", position: { x: 0, y: 0 }, data: { label: "Test" } }],
        edges: [],
        presetId: null,
      });

      // Mark as clean
      markSessionClean();

      // Should not be dirty
      expect(hasDirtySession()).toBe(false);
    });

    it("should show toast when session has dirty = true", () => {
      // Save a session (automatically marked as dirty)
      saveCanvasSession({
        nodes: [{ id: "test-1", type: "default", position: { x: 0, y: 0 }, data: { label: "Test" } }],
        edges: [],
        presetId: null,
      });

      // Should be dirty
      expect(hasDirtySession()).toBe(true);
    });
  });

  describe("Save flow", () => {
    it("should mark session as dirty when autosaving", () => {
      // Save a session (autosave)
      saveCanvasSession({
        nodes: [{ id: "test-1", type: "default", position: { x: 0, y: 0 }, data: { label: "Test" } }],
        edges: [],
        presetId: null,
      });

      const session = loadCanvasSession();
      expect(session).not.toBeNull();
      expect(session?.dirty).toBe(true);
      expect(session?.updatedAt).toBeGreaterThan(0);
    });

    it("should mark session as clean after manual save", () => {
      // Save a session (autosave)
      saveCanvasSession({
        nodes: [{ id: "test-1", type: "default", position: { x: 0, y: 0 }, data: { label: "Test" } }],
        edges: [],
        presetId: null,
      });

      expect(hasDirtySession()).toBe(true);

      // Simulate manual save
      markSessionClean();

      // Should not be dirty anymore
      expect(hasDirtySession()).toBe(false);

      const session = loadCanvasSession();
      expect(session?.dirty).toBe(false);

      // Verify logging was called
      expect(logTelemetry).toHaveBeenCalledWith(
        "session:mark-clean",
        "Session marked as clean after manual save",
        expect.objectContaining({
          source: "manual-save",
          updatedAt: expect.any(Number),
        }),
        undefined
      );
    });
  });

  describe("Restore flow", () => {
    it("should clear session after restore", () => {
      // Save a dirty session
      saveCanvasSession({
        nodes: [{ id: "test-1", type: "default", position: { x: 0, y: 0 }, data: { label: "Test" } }],
        edges: [],
        presetId: null,
      });

      expect(hasDirtySession()).toBe(true);

      // Simulate restore (which clears the session)
      clearCanvasSession();

      // Session should be gone
      expect(hasDirtySession()).toBe(false);
    });
  });

  describe("Discard flow", () => {
    it("should clear session after discard", () => {
      // Save a dirty session
      saveCanvasSession({
        nodes: [{ id: "test-1", type: "default", position: { x: 0, y: 0 }, data: { label: "Test" } }],
        edges: [],
        presetId: null,
      });

      expect(hasDirtySession()).toBe(true);

      // Simulate discard (which clears the session)
      clearCanvasSession();

      // Session should be gone
      expect(hasDirtySession()).toBe(false);
    });
  });

  describe("Session state structure", () => {
    it("should include dirty and updatedAt fields", () => {
      saveCanvasSession({
        nodes: [{ id: "test-1", type: "default", position: { x: 0, y: 0 }, data: { label: "Test" } }],
        edges: [],
        presetId: null,
      });

      const session = loadCanvasSession();
      expect(session).not.toBeNull();
      expect(typeof session?.dirty).toBe("boolean");
      expect(typeof session?.updatedAt).toBe("number");
      expect(session?.dirty).toBe(true);
      expect(session?.updatedAt).toBeGreaterThan(0);
    });

    it("should migrate old sessions without dirty/updatedAt fields", () => {
      // Simulate old session format (manually set in storage)
      if (typeof window !== "undefined") {
        const oldSession = {
          version: 1,
          savedAt: Date.now(),
          nodes: [{ id: "test-1", type: "default", position: { x: 0, y: 0 }, data: { label: "Test" } }],
          edges: [],
          presetId: null,
        };
        window.sessionStorage.setItem("filon.v4.canvas.state", JSON.stringify(oldSession));

        // Load should migrate it
        const session = loadCanvasSession();
        expect(session).not.toBeNull();
        expect(typeof session?.dirty).toBe("boolean");
        expect(typeof session?.updatedAt).toBe("number");
        // Old sessions should be marked as dirty
        expect(session?.dirty).toBe(true);
      }
    });
  });
});


