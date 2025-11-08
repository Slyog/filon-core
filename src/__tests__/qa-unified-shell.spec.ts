import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

test.describe("FILON Unified Shell – Step 16 QA", () => {
  test("Home route exposes Workspace peek via UI and hotkey", async ({
    page,
  }) => {
    await page.goto(BASE_URL);

    const workspaceTab = page
      .getByRole("button", { name: /workspace/i })
      .first();
    await expect(workspaceTab).toBeVisible();

    // Open via click
    await workspaceTab.click();
    const peekDialog = page.getByRole("dialog", {
      name: /workspace sidebar peek/i,
    });
    await expect(
      peekDialog.locator("text=New workspace")
    ).toBeVisible();

    // Close with Escape
    await page.keyboard.press("Escape");
    await expect(peekDialog).toBeHidden();

    // Toggle with hotkey (Ctrl/⌘ + K)
    const openShortcut = process.platform === "darwin" ? "Meta+K" : "Control+K";
    await page.keyboard.press(openShortcut);
    await expect(peekDialog).toBeVisible();

    // Verify persistent actions rendered
    await expect(
      peekDialog.getByRole("button", { name: /open last workspace/i })
    ).toBeVisible();
  });

  test("Creating a workspace sets graph defaults and storage flags", async ({
    page,
  }) => {
    await page.goto(BASE_URL);

    const input = page.getByPlaceholder("Write a thought...");
    await input.fill("QA thought seed");
    await page.getByRole("button", { name: /confirm/i }).click();

    await page.waitForURL("**/f/**", { timeout: 15000 });
    await expect(page).toHaveURL(/\/f\//);

    // Skip tour to trigger storage flag
    const tourSkip = page.getByRole("button", { name: /skip tour/i });
    if (await tourSkip.isVisible()) {
      await tourSkip.click();
    }

    const storageSnapshot = await page.evaluate(() => ({
      aha: window.localStorage.getItem("filon:ahaTourDone"),
      lastWorkspace: window.localStorage.getItem("lastWorkspaceId"),
    }));
    expect(storageSnapshot.aha).toBe("true");
    expect(storageSnapshot.lastWorkspace).toBeTruthy();

    const nodeCount = await page.locator(".react-flow__node").count();
    expect(nodeCount).toBeGreaterThanOrEqual(1);

    const glowOpacity = await page
      .locator(".react-flow__node")
      .first()
      .evaluate((node) =>
        window.getComputedStyle(node).boxShadow.includes("0 0")
      );
    expect(glowOpacity).toBeTruthy();

    const navigationEntry = await page.evaluate(() => {
      const [nav] = performance.getEntriesByType(
        "navigation"
      ) as PerformanceNavigationTiming[];
      return nav?.domContentLoadedEventEnd ?? 0;
    });
    expect(navigationEntry).toBeLessThanOrEqual(3000);
  });

  test("Unified shell must render without axe violations", async ({ page }) => {
    await page.goto(BASE_URL);

    const axe = new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast"]); // brand palette already approved manually
    const results = await axe.analyze();

    expect(results.violations).toEqual([]);
  });
});
/**
 * FILON QA Suite – Unified Shell, Sidebar Peek, Aha Tour, Graph Defaults
 *
 * This spec executes end-to-end smoke checks using Playwright (browser API)
 * while remaining runnable through Jest via `qa:axe`.
 *
 * Ensure the FILON dev server is running locally on http://localhost:3000
 * before executing these tests, or set FILON_BASE_URL accordingly.
 */

import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { source as axeSource } from "axe-core";
import { toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

const BASE_URL = process.env.FILON_BASE_URL ?? "http://localhost:3000";
const AHA_TOUR_FLAG = "filon:ahaTourDone";
const LAST_WORKSPACE_FLAG = "lastWorkspaceId";

type PageRunner = (options: { page: Page; context: BrowserContext }) => Promise<void>;

describe("FILON – Unified Shell QA", () => {
  let browser: Browser;

  beforeAll(async () => {
    browser = await chromium.launch({
      headless: process.env.PLAYWRIGHT_HEADLESS !== "false",
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  const runWithPage = async (handler: PageRunner) => {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    const page = await context.newPage();
    try {
      await handler({ page, context });
    } finally {
      await context.close();
    }
  };

  test("Home shell renders workspace peek and meets first paint target", async () => {
    await runWithPage(async ({ page }) => {
      await page.goto(BASE_URL, { waitUntil: "networkidle" });

      const fcp = await page.evaluate(() => {
        const entry = performance.getEntriesByName("first-contentful-paint")[0] as PerformanceEntry | undefined;
        return entry?.startTime ?? performance.now();
      });
      expect(fcp).toBeLessThan(3000);

      const workspaceTab = page.getByRole("button", { name: /workspace/i });
      await workspaceTab.waitFor();
      expect(await workspaceTab.isVisible()).toBe(true);

      await workspaceTab.click();
      await page.waitForSelector('[aria-label="Workspace sidebar peek"]', { state: "visible" });
      expect(await page.getByText("New workspace").isVisible()).toBe(true);

      // Sidebar should trap focus and close via Escape
      await page.keyboard.press("Escape");
      await page.waitForSelector('[aria-label="Workspace sidebar peek"]', { state: "detached" });
    });
  });

  test("Workspace creation persists shell state and localStorage", async () => {
    await runWithPage(async ({ page }) => {
      await page.goto(BASE_URL, { waitUntil: "networkidle" });
      await page.getByRole("button", { name: /workspace/i }).click();
      await page.waitForSelector('[aria-label="Workspace sidebar peek"]', { state: "visible" });

      const [navigation] = await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle" }),
        page.getByRole("button", { name: /new workspace/i }).click(),
      ]);
      expect(navigation?.url() ?? page.url()).toMatch(/\/f\//);

      const lastWorkspaceId = await page.evaluate((key) => window.localStorage.getItem(key), LAST_WORKSPACE_FLAG);
      expect(lastWorkspaceId).toBeTruthy();
      expect(page.url()).toContain(lastWorkspaceId as string);

      await page.waitForSelector("#graph-container .react-flow-subtle-cyan", { timeout: 5000 });
      const graphPaneVisible = await page.locator("#graph-container .react-flow__pane").isVisible();
      expect(graphPaneVisible).toBe(true);
    });
  });

  test("Aha Tour completes once, saves flag, and passes axe audit", async () => {
    await runWithPage(async ({ page }) => {
      await page.goto(BASE_URL, { waitUntil: "networkidle" });
      await page.getByRole("button", { name: /workspace/i }).click();
      await page.waitForSelector('[aria-label="Workspace sidebar peek"]', { state: "visible" });

      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle" }),
        page.getByRole("button", { name: /new workspace/i }).click(),
      ]);

      const skipButton = page.getByRole("button", { name: /skip tour/i });
      await skipButton.waitFor();
      expect(await skipButton.isVisible()).toBe(true);

      const stepTitles = ["Brainbar", "Mini-Graph", "Context Stream"];
      for (const [index, title] of stepTitles.entries()) {
        await page.waitForSelector(`text=${title}`, { timeout: 5000 });
        const controlLabel = index === stepTitles.length - 1 ? /finish/i : /next/i;
        await page.getByRole("button", { name: controlLabel }).click();
      }

      await page.waitForSelector('[role="dialog"]', { state: "detached", timeout: 5000 });
      const ahaFlag = await page.evaluate((key) => window.localStorage.getItem(key), AHA_TOUR_FLAG);
      expect(ahaFlag).toBe("true");

      // Accessibility check with axe-core
      await page.evaluate((axeScript) => {
        if (!(window as any).axe) {
          const script = document.createElement("script");
          script.innerHTML = axeScript;
          document.head.appendChild(script);
        }
      }, axeSource);
      const axeResults = await page.evaluate(async () => {
        return await (window as any).axe.run();
      });
      expect(axeResults).toHaveNoViolations();

      // Reload and confirm tour does not reappear
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(1200);
      const tourStillVisible = await page.$('button:has-text("Skip tour")');
      expect(tourStillVisible).toBeNull();
    });
  });
});

