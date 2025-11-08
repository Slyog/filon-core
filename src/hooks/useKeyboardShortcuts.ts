import { useEffect, useMemo } from "react";

export type ShortcutHandler = (event: KeyboardEvent) => void;

export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  allowInInputs?: boolean;
  preventDefault?: boolean;
  handler: ShortcutHandler;
}

const isEditableElement = (element: Element | null) => {
  if (!element) return false;
  const tag = element.tagName;
  const editable =
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    (element as HTMLElement).isContentEditable;
  return editable;
};

const matchesShortcut = (event: KeyboardEvent, config: ShortcutConfig) => {
  const keyMatches = event.key.toLowerCase() === config.key.toLowerCase();
  const ctrlMatches =
    config.ctrl === undefined || event.ctrlKey === Boolean(config.ctrl);
  const metaMatches =
    config.meta === undefined || event.metaKey === Boolean(config.meta);
  const shiftMatches =
    config.shift === undefined || event.shiftKey === Boolean(config.shift);
  const altMatches =
    config.alt === undefined || event.altKey === Boolean(config.alt);

  return keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches;
};

export const register = (config: ShortcutConfig): (() => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  const listener = (event: KeyboardEvent) => {
    const activeElement =
      typeof document !== "undefined" ? document.activeElement : null;

    if (!config.allowInInputs && isEditableElement(activeElement)) {
      return;
    }

    if (!matchesShortcut(event, config)) {
      return;
    }

    if (config.preventDefault !== false) {
      event.preventDefault();
    }

    config.handler(event);
  };

  window.addEventListener("keydown", listener);
  return () => window.removeEventListener("keydown", listener);
};

export const useKeyboardShortcuts = (
  shortcuts: ShortcutConfig | ShortcutConfig[]
) => {
  const list = useMemo(
    () => (Array.isArray(shortcuts) ? shortcuts : [shortcuts]),
    [shortcuts]
  );

  useEffect(() => {
    const cleanups = list.map((shortcut) => register(shortcut));
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [list]);
};
