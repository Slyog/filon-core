import fs from "fs";
import path from "path";

const file = path.resolve("src/app/globals.css");
let css = fs.readFileSync(file, "utf8");

if (!css.includes("--sidebar-w")) {
  console.log("🧩 Adding sidebar width variable");
  css =
    ":root{--sidebar-w:15rem;}\n" +
    css.replace(/body\s*\{/, "body{margin-left:var(--sidebar-w);");
}

fs.writeFileSync(file, css);
console.log("✅ Applied auto-fix to globals.css");

