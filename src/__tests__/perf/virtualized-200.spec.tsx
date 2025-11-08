/**
 * @jest-environment jsdom
 */

import React, { Profiler } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import ContextStream from "@/components/ContextStream";
import { act } from "react-dom/test-utils";

const makeItems = (count: number) =>
  Array.from({ length: count }).map((_, index) => ({
    id: `item-${index}`,
    title: `Gedanke ${index}`,
    summary: "Zusammenfassung " + index,
    confidence: 80 + (index % 5),
    ts: Date.now() - index * 1000,
  }));

describe("ContextStream virtualization performance", () => {
  test("renders limited DOM nodes and keeps commits fast", async () => {
    const durations: number[] = [];
    const items = makeItems(220);

    render(
      <Profiler
        id="ContextStream"
        onRender={(_id, _phase, actualDuration) => {
          durations.push(actualDuration);
        }}
      >
        <ContextStream items={items} onSelect={() => {}} />
      </Profiler>
    );

    await waitFor(() =>
      expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0)
    );

    let rows = screen.getAllByRole("listitem");
    expect(rows.length).toBeLessThanOrEqual(60);

    const scroller = document.querySelector(
      "[data-virtuoso-scroller]"
    ) as HTMLElement | null;
    if (scroller) {
      act(() => {
        scroller.scrollTop = 10_000;
        scroller.dispatchEvent(new Event("scroll"));
      });
      await waitFor(() =>
        expect(screen.getAllByRole("listitem").length).toBeLessThanOrEqual(60)
      );
    }

    rows = screen.getAllByRole("listitem");
    expect(rows.length).toBeGreaterThan(0);

    const avgDuration =
      durations.reduce((sum, value) => sum + value, 0) /
      (durations.length || 1);
    expect(avgDuration).toBeLessThan(16);
  });
});

