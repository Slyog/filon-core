import { test, expect } from "@playwright/test";

test.describe("Session Dirty Flag", () => {
  test.beforeEach(async ({ page }) => {
    // Clear sessionStorage before each test
    await page.addInitScript(() => {
      window.sessionStorage.clear();
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
      // Drag the node to a new position
      await firstNode.dragTo(firstNode, {
        targetPosition: { x: nodeBox.x + 100, y: nodeBox.y + 100 },
      });
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
  });

  test("should show Unsaved-Toast for truly dirty session", async ({ page }) => {
    // Create a dirty session directly in sessionStorage
    await page.addInitScript(() => {
      window.sessionStorage.setItem(
        "filon.v4.canvas.state",
        JSON.stringify({
          version: 1,
          savedAt: Date.now(),
          updatedAt: Date.now(),
          dirty: true, // Explicitly mark as dirty
          nodes: [
            { id: "test-1", type: "default", position: { x: 100, y: 100 }, data: { label: "Test" } },
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
  });
});
