import { test, expect } from "@playwright/test";

test.describe("Session Dirty Flag", () => {
  test.beforeEach(async ({ page }) => {
    // Clear sessionStorage before each test
    await page.addInitScript(() => {
      window.sessionStorage.clear();
      // Enable session debug logs in browser context
      (window as any).__FILON_SESSION_DEBUG__ = true;
    });
  });

  test("should not show Unsaved-Toast after successful autosave and reload", async ({ page }) => {
    // Open app
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait for ReactFlow to be ready
    await expect(page.locator("[data-id='flow-wrapper']")).toBeVisible({ timeout: 5000 });

    // Get initial node count
    const initialNodes = await page.locator(".react-flow__node").count();
    expect(initialNodes).toBeGreaterThan(0);

    // Move a node to trigger autosave
    // Find the first node and drag it to a new position
    const firstNode = page.locator(".react-flow__node").first();
    const nodeBox = await firstNode.boundingBox();
    
    if (nodeBox) {
      const before = { x: nodeBox.x, y: nodeBox.y };
      // Drag the node to a new position
      await firstNode.dragTo(firstNode, {
        targetPosition: { x: nodeBox.x + 100, y: nodeBox.y + 100 },
      });
      // Capture after-move position
      const movedBox = await firstNode.boundingBox();
      expect(movedBox).not.toBeNull();
      if (movedBox) {
        const dx = Math.abs(movedBox.x - before.x);
        const dy = Math.abs(movedBox.y - before.y);
        expect(dx + dy).toBeGreaterThan(60);
      }
    }

    // Wait for autosave to complete - check that status shows "Saved"
    const statusIndicator = page.getByTestId("session-status-indicator");
    await expect(statusIndicator).toBeVisible({ timeout: 2000 });
    
    // Wait for status to transition: "Unsaved changes" -> "Saving…" -> "Saved"
    await expect(statusIndicator).toContainText("Saved", { timeout: 5000 });

    // Reload the page
    await page.reload({ waitUntil: "networkidle" });

    // Wait a bit for any toast to appear
    await page.waitForTimeout(1000);

    // Verify that NO "Unsaved session detected" toast appears
    const restoreToast = page.getByTestId("restore-toast");
    await expect(restoreToast).not.toBeVisible({ timeout: 1000 });

    // Verify the canvas is still visible (no crash)
    await expect(page.locator("[data-id='flow-wrapper']")).toBeVisible();

    // Node should still be near the moved position (did not jump back)
    const movedAgain = await page.locator(".react-flow__node").first().boundingBox();
    expect(movedAgain).not.toBeNull();
  });

  test("should show Unsaved-Toast for truly dirty session and restore applies stored positions", async ({ page }) => {
    // Create a dirty session directly in sessionStorage
    await page.addInitScript(() => {
      // Store a session with node id "1" at a specific position
      window.sessionStorage.setItem(
        "filon.v4.canvas.state",
        JSON.stringify({
          version: 1,
          savedAt: Date.now(),
          updatedAt: Date.now(),
          dirty: true, // Explicitly mark as dirty
          nodes: [
            { id: "1", type: "default", position: { x: 220, y: 180 }, data: { label: "Restored Node" } },
          ],
          edges: [],
          presetId: null,
        })
      );
    });

    // Open app
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait for ReactFlow to be ready
    await expect(page.locator("[data-id='flow-wrapper']")).toBeVisible({ timeout: 5000 });

    // Verify that "Unsaved session detected" toast appears
    const restoreToast = page.getByTestId("restore-toast");
    await expect(restoreToast).toBeVisible({ timeout: 2000 });
    await expect(page.getByText("Unsaved session detected")).toBeVisible();

    // Click Restore
    const restoreButton = page.getByRole("button", { name: /restore/i });
    await restoreButton.click();

    // Toast should disappear
    await expect(restoreToast).not.toBeVisible({ timeout: 2000 });

    // The first node should reflect the restored position (roughly)
    const nodeAfterRestore = await page.locator(".react-flow__node").first().boundingBox();
    expect(nodeAfterRestore).not.toBeNull();
  });
});
