import fs from "fs";
import { getQASummary } from "@/lib/qa/summary";

describe("getQASummary", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns sanitized summary data when the report file exists", () => {
    jest.spyOn(fs, "existsSync").mockReturnValue(true);
    jest
      .spyOn(fs, "readFileSync")
      .mockReturnValue(
        JSON.stringify({
          timestamp: "2025-11-09T00:00:00.000Z",
          total: 5,
          passed: 4,
          failed: 1,
          specs: ["a.spec.ts", 123, null],
        })
      );

    const summary = getQASummary();

    expect(summary).toEqual({
      timestamp: "2025-11-09T00:00:00.000Z",
      total: 5,
      passed: 4,
      failed: 1,
      specs: ["a.spec.ts"],
    });
  });

  it("returns an empty summary when the report file is missing", () => {
    jest.spyOn(fs, "existsSync").mockReturnValue(false);
    const readSpy = jest.spyOn(fs, "readFileSync");

    const summary = getQASummary();

    expect(summary).toEqual({
      specs: [],
      total: 0,
      passed: 0,
      failed: 0,
    });
    expect(readSpy).not.toHaveBeenCalled();
  });

  it("returns an empty summary when reading the file fails", () => {
    jest.spyOn(fs, "existsSync").mockReturnValue(true);
    jest.spyOn(fs, "readFileSync").mockImplementation(() => {
      throw Object.assign(new Error("boom"), { code: "EACCES" });
    });
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const summary = getQASummary();

    expect(summary).toEqual({
      specs: [],
      total: 0,
      passed: 0,
      failed: 0,
    });
    expect(warnSpy).toHaveBeenCalled();
  });
});


