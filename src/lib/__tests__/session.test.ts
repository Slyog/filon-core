/**
 * @jest-environment jsdom
 */

import {
  saveCanvasSession,
  loadCanvasSession,
  hasDirtySession,
  clearCanvasSession,
  markSessionClean,
} from "../session";

describe("Session Storage", () => {
  beforeEach(() => {
    clearCanvasSession();
  });

  describe("saveCanvasSession", () => {
    it("should save session with dirty = false by default (autosave)", () => {
      const testNodes = [
        { id: "test-1", type: "default", position: { x: 0, y: 0 }, data: { label: "Test" } },
      ];

      saveCanvasSession({
        nodes: testNodes,
        edges: [],
        presetId: null,
      });

      const session = loadCanvasSession();
      expect(session).not.toBeNull();
      expect(session?.dirty).toBe(false);
      expect(hasDirtySession()).toBe(false);
    });

    it("should save session with dirty = true when explicitly set", () => {
      const testNodes = [
        { id: "test-1", type: "default", position: { x: 0, y: 0 }, data: { label: "Test" } },
      ];

      saveCanvasSession(
        {
          nodes: testNodes,
          edges: [],
          presetId: null,
        },
        true
      );

      const session = loadCanvasSession();
      expect(session).not.toBeNull();
      expect(session?.dirty).toBe(true);
      expect(hasDirtySession()).toBe(true);
    });

    it("should save session with dirty = false when explicitly set", () => {
      const testNodes = [
        { id: "test-1", type: "default", position: { x: 0, y: 0 }, data: { label: "Test" } },
      ];

      saveCanvasSession(
        {
          nodes: testNodes,
          edges: [],
          presetId: null,
        },
        false
      );

      const session = loadCanvasSession();
      expect(session).not.toBeNull();
      expect(session?.dirty).toBe(false);
      expect(hasDirtySession()).toBe(false);
    });
  });

  describe("hasDirtySession", () => {
    it("should return false when no session exists", () => {
      expect(hasDirtySession()).toBe(false);
    });

    it("should return false when session has dirty = false", () => {
      saveCanvasSession(
        {
          nodes: [],
          edges: [],
          presetId: null,
        },
        false
      );

      expect(hasDirtySession()).toBe(false);
    });

    it("should return true when session has dirty = true", () => {
      saveCanvasSession(
        {
          nodes: [],
          edges: [],
          presetId: null,
        },
        true
      );

      expect(hasDirtySession()).toBe(true);
    });

    it("should return false after markSessionClean", () => {
      // Create a dirty session
      saveCanvasSession(
        {
          nodes: [],
          edges: [],
          presetId: null,
        },
        true
      );

      expect(hasDirtySession()).toBe(true);

      // Mark as clean
      markSessionClean();

      expect(hasDirtySession()).toBe(false);
    });
  });

  describe("markSessionClean", () => {
    it("should mark existing session as clean", () => {
      const testNodes = [
        { id: "test-1", type: "default", position: { x: 0, y: 0 }, data: { label: "Test" } },
      ];

      // Create a dirty session
      saveCanvasSession(
        {
          nodes: testNodes,
          edges: [],
          presetId: null,
        },
        true
      );

      expect(hasDirtySession()).toBe(true);

      // Mark as clean
      markSessionClean();

      const session = loadCanvasSession();
      expect(session?.dirty).toBe(false);
      expect(hasDirtySession()).toBe(false);
    });

    it("should not create a session if none exists", () => {
      expect(loadCanvasSession()).toBeNull();

      markSessionClean();

      expect(loadCanvasSession()).toBeNull();
    });
  });
});

