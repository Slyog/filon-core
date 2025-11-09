import { expect, test, type Page } from "@playwright/test";

type AutosaveMeta = Record<string, unknown> | undefined;

async function setAutosaveStatus(
  page: Page,
  status: string,
  meta?: AutosaveMeta
) {
  await page.evaluate(
    ({ next, meta: extra }) => {
      const helper = (window as any).__filonAutosaveTest;
      helper?.setStatus(next, extra ?? { source: "qa-playwright" });
    },
    { next: status, meta }
  );
}

function assertDurationAttr(
  attr: string | null,
  predicate: (ms: number) => boolean
) {
  if (!attr) {
    throw new Error("Missing duration attribute");
  }
  const parsed = Number.parseInt(attr, 10);
  if (!predicate(parsed)) {
    throw new Error(`Duration constraint violated: ${parsed}`);
  }
}

test.describe("Autosave feedback toast", () => {
  test("shows saving → saved lifecycle with accessible feedback", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/");
    await setAutosaveStatus(page, "saving", { source: "qa-playwright" });

    const savingToast = page
      .locator('[data-testid="autosave-toast"][data-status="saving"]')
      .first();

    await expect(savingToast).toBeVisible({
      timeout: 2000,
    });
    await expect(savingToast).toHaveText(/Saving…/);

    const savingRole = await savingToast.getAttribute("role");
    const savingLive = await savingToast.getAttribute("aria-live");
    expect(savingRole).toBe("status");
    expect(savingLive).toBe("polite");

    const savingEnter = await savingToast.getAttribute("data-enter-ms");
    const savingExit = await savingToast.getAttribute("data-exit-ms");
    assertDurationAttr(savingEnter, (ms) => ms > 0 && ms < 1000);
    assertDurationAttr(savingExit, (ms) => ms > 0 && ms <= 2000);

    const savingClasses = await savingToast.evaluate((el) => el.className);
    expect(savingClasses).toContain("bg-sky-500/15");

    await page.waitForTimeout(300);
    await setAutosaveStatus(page, "saved", { source: "qa-playwright" });
    await page.waitForTimeout(50);

    const currentStatus = await page.evaluate(
      () => (window as any).__filonAutosaveTest?.getStatus() ?? "unknown"
    );
    expect(currentStatus).toBe("saved");

    const savedToast = page
      .locator('[data-testid="autosave-toast"][data-status="saved"]')
      .first();

    await expect(savedToast).toBeVisible({
      timeout: 2000,
    });
    await expect(savedToast).toHaveText(/Saved/);
    const savedEnter = await savedToast.getAttribute("data-enter-ms");
    const savedExit = await savedToast.getAttribute("data-exit-ms");
    assertDurationAttr(savedEnter, (ms) => ms > 0 && ms < 1000);
    assertDurationAttr(savedExit, (ms) => ms > 0 && ms <= 2000);

    await expect(savedToast).toHaveAttribute("role", "status");
    await expect(savedToast).toHaveAttribute("aria-live", "polite");

    const savedClasses = await savedToast.evaluate((el) => el.className);
    expect(savedClasses).toContain("bg-emerald-500/15");

    await page.waitForTimeout(2200);
    await page.waitForFunction(() => {
      const helper = (window as any).__filonAutosaveTest;
      return helper?.getStatus?.() === "idle";
    });
  });

  test("renders offline warning toast", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await setAutosaveStatus(page, "offline", { source: "qa-playwright" });

    const offlineToast = page.locator(
      '[data-testid="autosave-toast"][data-status="offline"]'
    );
    await expect(offlineToast).toBeVisible({ timeout: 2000 });
    await expect(offlineToast).toHaveText(/Offline/);

    const offlineClasses = await offlineToast.evaluate((el) => el.className);
    expect(offlineClasses).toContain("bg-orange-500/25");

    const enter = await offlineToast.getAttribute("data-enter-ms");
    assertDurationAttr(enter, (ms) => ms > 0 && ms < 1000);

    await setAutosaveStatus(page, "idle");
  });
});


