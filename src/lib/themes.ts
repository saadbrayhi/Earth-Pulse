export const themes = [
  { id: "ivory", name: "Haor Ivory", description: "Ivory, forest & muted gold", mode: "light" },
  { id: "orbit", name: "Midnight Orbit", description: "Deep navy & luminous teal", mode: "dark" },
  { id: "aurora", name: "Aurora Grove", description: "Evergreen & soft lime", mode: "dark" },
  { id: "dusk", name: "Solar Dusk", description: "Warm sand, terracotta & plum", mode: "light" },
  { id: "glacier", name: "Glacier", description: "Ice white & alpine blue", mode: "light" },
  { id: "nebula", name: "Nebula", description: "Midnight plum & lavender", mode: "dark" },
] as const;

export type ThemeId = (typeof themes)[number]["id"];
export const defaultTheme: ThemeId = "ivory";
export const themeStorageKey = "earthpulse-theme";
const themeChangeEvent = "earthpulse:theme-change";

export function isThemeId(value: unknown): value is ThemeId {
  return themes.some((theme) => theme.id === value);
}

// Runs in <head> before paint. Only known IDs can reach the DOM; blocked storage
// leaves the statically rendered default intact.
export const themeBootstrapScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(themeStorageKey)});if(${JSON.stringify(themes.map((theme) => theme.id))}.indexOf(t)!==-1)document.documentElement.dataset.theme=t}catch(e){}})();`;

export function getThemeSnapshot(): ThemeId {
  if (typeof document === "undefined") return defaultTheme;
  const value = document.documentElement.dataset.theme;
  return isThemeId(value) ? value : defaultTheme;
}

function storedTheme(): ThemeId | null {
  try {
    const value = window.localStorage.getItem(themeStorageKey);
    return isThemeId(value) ? value : null;
  } catch {
    return null;
  }
}

function applyTheme(theme: ThemeId) {
  document.documentElement.dataset.theme = theme;
  window.dispatchEvent(new Event(themeChangeEvent));
}

export function setTheme(theme: ThemeId) {
  applyTheme(theme);
  try {
    window.localStorage.setItem(themeStorageKey, theme);
  } catch {
    // The selected theme still works for this session when storage is blocked.
  }
}

export function restoreTheme() {
  // React Strict Mode may restore the server's <html> attributes in development.
  applyTheme(storedTheme() ?? getThemeSnapshot());
}

export function subscribeToTheme(onChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === themeStorageKey || event.key === null) {
      applyTheme(storedTheme() ?? defaultTheme);
    }
  }

  window.addEventListener(themeChangeEvent, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(themeChangeEvent, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function getServerThemeSnapshot(): ThemeId {
  return defaultTheme;
}
