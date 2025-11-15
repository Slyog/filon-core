/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SessionStatusIndicator } from "../SessionStatusIndicator";
import { useSessionStatus } from "@/hooks/useSessionStatus";

// Mock useSessionStatus hook
jest.mock("@/hooks/useSessionStatus");

const mockUseSessionStatus = useSessionStatus as jest.MockedFunction<typeof useSessionStatus>;

describe("SessionStatusIndicator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display "Saving…" when status is "saving"', () => {
    mockUseSessionStatus.mockReturnValue({
      status: "saving",
      hasPendingChanges: false,
      lastSavedAt: null,
      saveNow: jest.fn(),
      error: null,
    });

    render(<SessionStatusIndicator />);

    expect(screen.getByText("Saving…")).toBeInTheDocument();
    expect(screen.getByTestId("session-status-indicator")).toBeInTheDocument();
  });

  it('should display "Unsaved changes" when hasPendingChanges is true and status is not "saving"', () => {
    mockUseSessionStatus.mockReturnValue({
      status: "idle",
      hasPendingChanges: true,
      lastSavedAt: null,
      saveNow: jest.fn(),
      error: null,
    });

    render(<SessionStatusIndicator />);

    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    const indicator = screen.getByTestId("session-status-indicator");
    expect(indicator).not.toHaveAttribute("disabled");
  });

  it('should display "Saved" when status is "saved" and hasPendingChanges is false', () => {
    mockUseSessionStatus.mockReturnValue({
      status: "saved",
      hasPendingChanges: false,
      lastSavedAt: Date.now(),
      saveNow: jest.fn(),
      error: null,
    });

    render(<SessionStatusIndicator />);

    expect(screen.getByText("Saved")).toBeInTheDocument();
    const indicator = screen.getByTestId("session-status-indicator");
    expect(indicator).toHaveAttribute("disabled");
  });

  it('should display "Save failed" when status is "error"', () => {
    const mockSaveNow = jest.fn();
    mockUseSessionStatus.mockReturnValue({
      status: "error",
      hasPendingChanges: false,
      lastSavedAt: null,
      saveNow: mockSaveNow,
      error: "Network error",
    });

    render(<SessionStatusIndicator />);

    expect(screen.getByText("Save failed")).toBeInTheDocument();
    const indicator = screen.getByTestId("session-status-indicator");
    expect(indicator).toHaveAttribute("title", "Network error");
    expect(indicator).not.toHaveAttribute("disabled");
  });

  it("should call saveNow when clicked and status is error", async () => {
    const mockSaveNow = jest.fn();
    mockUseSessionStatus.mockReturnValue({
      status: "error",
      hasPendingChanges: false,
      lastSavedAt: null,
      saveNow: mockSaveNow,
      error: "Network error",
    });

    render(<SessionStatusIndicator />);

    const indicator = screen.getByTestId("session-status-indicator");
    await act(async () => {
      indicator.click();
    });

    expect(mockSaveNow).toHaveBeenCalledTimes(1);
  });

  it("should call saveNow when clicked and hasPendingChanges is true", async () => {
    const mockSaveNow = jest.fn();
    mockUseSessionStatus.mockReturnValue({
      status: "idle",
      hasPendingChanges: true,
      lastSavedAt: null,
      saveNow: mockSaveNow,
      error: null,
    });

    render(<SessionStatusIndicator />);

    const indicator = screen.getByTestId("session-status-indicator");
    await act(async () => {
      indicator.click();
    });

    expect(mockSaveNow).toHaveBeenCalledTimes(1);
  });

  it("should not call saveNow when clicked and status is saved", async () => {
    const mockSaveNow = jest.fn();
    mockUseSessionStatus.mockReturnValue({
      status: "saved",
      hasPendingChanges: false,
      lastSavedAt: Date.now(),
      saveNow: mockSaveNow,
      error: null,
    });

    render(<SessionStatusIndicator />);

    const indicator = screen.getByTestId("session-status-indicator");
    expect(indicator).toHaveAttribute("disabled");
    
    // Click should not work when disabled
    await act(async () => {
      indicator.click();
    });

    expect(mockSaveNow).not.toHaveBeenCalled();
  });
});

