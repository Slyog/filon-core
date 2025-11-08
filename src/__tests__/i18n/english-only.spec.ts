/**
 * @jest-environment jsdom
 */

import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../../..", "src");
const TARGET_DIRECTORIES = ["components", "layouts", "config", "app"];
const GERMAN_REGEX =
  /\b(gehe|ziel|neuer|verknüpfen|erklären|markieren|einträge|letzte|bereit|gedanken|gedanke|hinzufügen|archivieren|löschen|bearbeiten|vorschau|speichern|änderung|wartet)\b/i;

function collectFiles(dirPath: string, files: string[] = []): string[] {
  const entries = readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, files);
    } else if (entry.isFile() && /\.(tsx?|jsx?)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

const stripComments = (input: string) =>
  input.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

describe("English-only UI", () => {
  it.each(TARGET_DIRECTORIES)("%s contains no German words", (dir) => {
    const targetPath = path.join(ROOT, dir);
    if (!existsSync(targetPath)) {
      expect(true).toBe(true);
      return;
    }

    const stats = statSync(targetPath);
    expect(stats.isDirectory()).toBe(true);

    const files = collectFiles(targetPath);
    const combined = files.map((file) => readFileSync(file, "utf8")).join("\n");

    expect(GERMAN_REGEX.test(stripComments(combined))).toBe(false);
  });
});
