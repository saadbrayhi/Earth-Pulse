"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { Check, ChevronDown, Palette } from "lucide-react";
import {
  getServerThemeSnapshot,
  getThemeSnapshot,
  restoreTheme,
  setTheme,
  subscribeToTheme,
  themes,
  type ThemeId,
} from "@/lib/themes";

export function ThemeSwitcher() {
  const themeId = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);
  const details = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  const picker = useRef<HTMLDivElement>(null);

  const fitPicker = useCallback(() => {
    if (!details.current?.open || !trigger.current || !picker.current) return;
    const bounds = trigger.current.getBoundingClientRect();
    const below = window.innerHeight - bounds.bottom - 24;
    const above = bounds.top - 24;
    const openAbove = below < 240 && above > below;
    picker.current.style.maxHeight = `${Math.max(80, Math.min(620, openAbove ? above : below))}px`;
    picker.current.style.top = openAbove ? "auto" : "calc(100% + 12px)";
    picker.current.style.bottom = openAbove ? "calc(100% + 12px)" : "auto";
  }, []);

  useLayoutEffect(restoreTheme, []);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (event.target instanceof Node && !details.current?.contains(event.target)) {
        if (details.current) details.current.open = false;
      }
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    window.addEventListener("resize", fitPicker);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      window.removeEventListener("resize", fitPicker);
    };
  }, [fitPicker]);

  function selectTheme(id: ThemeId) {
    setTheme(id);
    if (details.current) details.current.open = false;
    trigger.current?.focus();
  }

  return (
    <details
      ref={details}
      className="theme-switcher"
      onToggle={fitPicker}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.currentTarget.open = false;
          trigger.current?.focus();
        }
      }}
    >
      <summary ref={trigger} className="theme-trigger" aria-label="Choose color theme">
        <Palette size={15} />
        <span>Theme</span>
        <span className="theme-current-colors" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <ChevronDown size={13} className="theme-chevron" />
      </summary>
      <div ref={picker} className="theme-picker">
        <p className="eyebrow">MAKE IT YOURS</p>
        <h2 className="theme-picker-title">A different atmosphere.</h2>
        <p className="theme-picker-description">Choose a palette for your workspace.</p>
        <div className="theme-options" role="group" aria-label="Color themes">
          {themes.map((theme) => (
            <button
              key={theme.id}
              type="button"
              className="theme-option"
              aria-pressed={themeId === theme.id}
              onClick={() => selectTheme(theme.id)}
            >
              <span className="theme-preview" data-theme-preview={theme.id} aria-hidden="true">
                <span className="theme-preview-sidebar" />
                <span className="theme-preview-card">
                  <i />
                  <i />
                </span>
                <span className="theme-preview-detail" />
              </span>
              <span className="theme-option-heading">
                <span>{theme.name}</span>
                {themeId === theme.id && <Check size={14} aria-label="Selected" />}
              </span>
              <span className="theme-option-description">{theme.description}</span>
              <span className="theme-mode">{theme.mode}</span>
            </button>
          ))}
        </div>
        <p className="theme-picker-footnote">Radar colors keep the same meaning in every theme.</p>
      </div>
    </details>
  );
}
