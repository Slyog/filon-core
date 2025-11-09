import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAP_DIR = path.resolve(__dirname, "../tests/__snapshots__/layout");
const BASELINE = path.join(SNAP_DIR, "layout-baseline.png");
const CURRENT = path.join(SNAP_DIR, "layout-current.png");
const LOG = path.join(SNAP_DIR, "CHANGELOG.md");

if (!fs.existsSync(CURRENT)) {
  console.error(
    "❌ Kein aktueller Screenshot gefunden. Bitte zuerst `npm run qa:layout:lock` ausführen."
  );
  process.exit(1);
}

if (!fs.existsSync(BASELINE)) {
  fs.mkdirSync(SNAP_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().replace("T", " ").split(".")[0];
fs.copyFileSync(CURRENT, BASELINE);

const logEntry = `\n### ${timestamp}\n- ✅ Baseline aktualisiert (layout-baseline.png)\n`;

fs.appendFileSync(LOG, logEntry);

console.log("📸 Neue Baseline übernommen und im CHANGELOG dokumentiert.");
