import fs from "fs";
import http from "http";
import path from "path";

const REPORT_PATH = path.resolve("tests/__reports__/qa-summary.json");

http
  .createServer((_, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    if (fs.existsSync(REPORT_PATH)) {
      res.end(fs.readFileSync(REPORT_PATH));
    } else {
      res.end(JSON.stringify({ error: "No report found" }));
    }
  })
  .listen(4000, () =>
    console.log("🧩 QA Viewer running on http://localhost:4000")
  );

