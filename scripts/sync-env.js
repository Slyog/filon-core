/**
 * FILON Environment Sync Script
 * Mirrors GitHub secrets to Vercel environment vars for consistency.
 */
import { execSync } from "child_process";

const envMap = {
  VERCEL_TOKEN: process.env.VERCEL_TOKEN,
  VERCEL_ORG_ID: process.env.VERCEL_ORG_ID,
  VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID,
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "https://api.filon.cloud",
};

console.log("🔁 Syncing environment variables to Vercel...");

for (const [key, value] of Object.entries(envMap)) {
  if (!value) {
    console.warn(`⚠️ Missing value for ${key}, skipping.`);
    continue;
  }
  execSync(
    `npx vercel env add ${key} production --yes <<< "${value}" || true`,
    { stdio: "inherit" }
  );
  execSync(
    `npx vercel env add ${key} preview --yes <<< "${value}" || true`,
    { stdio: "inherit" }
  );
}

console.log("✅ Environment variables synced to Vercel.");
