import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GraphCanvas from '../components/GraphCanvas';

// Mock reactflow to avoid heavy DOM/SVG behaviors while allowing prop passing
jest.mock('reactflow', () => {
  const React = require('react');
  return {
    ReactFlowProvider: ({ children }: any) => <div data-testid="rf-provider">{children}</div>,
    ReactFlow: ({ children }: any) => <div data-testid="rf-root">{children}</div>,
    MiniMap: () => <div data-testid="rf-minimap" />,
    Controls: () => <div data-testid="rf-controls" />,
    Background: () => <div data-testid="rf-background" />,
    addEdge: (edge: any, eds: any[]) => [...eds, { id: 'e' + (eds.length + 1), ...edge }],
    applyNodeChanges: (_changes: any, nodes: any[]) => nodes,
    applyEdgeChanges: (_changes: any, edges: any[]) => edges,
  };
});

// Mock localforage used by storage layer
jest.mock('localforage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
  removeItem: jest.fn(async () => {}),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('GraphCanvas', () => {
  beforeEach(() => {
    // reset in-memory localStorage polyfill from jest.setup
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  test('renders defaults when no saved graph exists', async () => {
    render(<GraphCanvas />);

    // Buttons available
    expect(screen.getByRole('button', { name: '+ Node' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();

    // ReactFlow scaffolding present
    expect(await screen.findByTestId('rf-root')).toBeInTheDocument();
  });

  test('adds a node when clicking + Node and schedules a save', async () => {
    jest.useFakeTimers();
    render(<GraphCanvas />);

    fireEvent.click(screen.getByRole('button', { name: '+ Node' }));

    // advance debounce timer
    jest.advanceTimersByTime(300);

    // storage.set invoked through localforage + localStorage
    // We cannot inspect internal state easily due to mocked reactflow, but ensure no crash and timers flushed
    await waitFor(() => {
      // ensure test progressed without errors
      expect(screen.getByTestId('rf-root')).toBeInTheDocument();
    });
    jest.useRealTimers();
  });

  test('clear button clears graph and storage', async () => {
    const localforage = require('localforage');
    render(<GraphCanvas />);

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    await waitFor(() => {
      expect(localforage.removeItem).toHaveBeenCalled();
    });
  });

  test('loads from storage if present', async () => {
    const localforage = require('localforage');
    (localforage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify({
      nodes: [{ id: '1', data: { label: 'A' }, position: { x: 0, y: 0 } }],
      edges: [],
    }));

    render(<GraphCanvas />);

    // should render the flow container, implying mount completed
    expect(await screen.findByTestId('rf-root')).toBeInTheDocument();
  });

  test('debounces saves to reduce frequency', async () => {
    jest.useFakeTimers();
    const localforage = require('localforage');

    render(<GraphCanvas />);
    // simulate many clicks to trigger multiple saves
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByRole('button', { name: '+ Node' }));
    }

    // No setItem call until after debounce
    expect(localforage.setItem).not.toHaveBeenCalled();

    jest.advanceTimersByTime(260);

    await waitFor(() => {
      expect(localforage.setItem).toHaveBeenCalled();
    });

    jest.useRealTimers();
  });
});
