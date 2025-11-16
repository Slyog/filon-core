/**
 * @jest-environment jsdom
 */

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import {
  loadSimpleCanvasSnapshot,
  saveSimpleCanvasSnapshot,
  clearSimpleCanvasSnapshot,
  type SimpleCanvasSnapshot,
} from "../simpleCanvasSession";

describe("simpleCanvasSession", () => {
  beforeEach(() => {
    // Clean sessionStorage before each test
    if (typeof window !== "undefined") {
      window.sessionStorage.clear();
    }
    clearSimpleCanvasSnapshot();
  });

  it("returns null when there is no stored snapshot", () => {
    const snapshot = loadSimpleCanvasSnapshot();
    expect(snapshot).toBeNull();
  });

  it("saves and loads a snapshot roundtrip", () => {
    const snapshot: SimpleCanvasSnapshot = {
      version: 1,
      nodes: [],
      edges: [],
      presetId: null,
    };

    saveSimpleCanvasSnapshot(snapshot);
    const loaded = loadSimpleCanvasSnapshot();

    expect(loaded).not.toBeNull();
    expect(loaded).toEqual(snapshot);
  });

  it("ignores invalid JSON or wrong shape gracefully", () => {
    if (typeof window === "undefined") {
      return;
    }

    // invalid JSON
    window.sessionStorage.setItem("filon.v4.canvas.state", "{not: valid}");
    expect(loadSimpleCanvasSnapshot()).toBeNull();

    // wrong shape
    window.sessionStorage.setItem(
      "filon.v4.canvas.state",
      JSON.stringify({ version: 1, nodes: "nope", edges: [] }),
    );
    expect(loadSimpleCanvasSnapshot()).toBeNull();
  });
});

