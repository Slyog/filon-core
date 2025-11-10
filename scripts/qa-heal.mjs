#!/usr/bin/env node

process.env.PW_HEADLESS = "1";
if (!process.env.CI) {
  process.env.CI = "true";
}

console.log("[FILON QA] Heal placeholder – ensure environment is ready for headless Playwright runs.");


