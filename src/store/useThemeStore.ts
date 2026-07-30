import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Deliberately its own tiny store, separate from useAppStore: theme is a
// device/display preference, not app progress, so it must survive both
// "Reset progress" and any STORAGE_VERSION wipe of the main store.

interface ThemeState {
  dark: boolean;
  toggleDark: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      dark: false,
      toggleDark: () => set((s) => ({ dark: !s.dark })),
    }),
    {
      name: "iinvest.theme",
      storage: createJSONStorage(() => {
        try {
          if (typeof window === "undefined" || !window.localStorage)
            throw new Error();
          return window.localStorage;
        } catch {
          const map = new Map<string, string>();
          return {
            getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
            setItem: (k: string, v: string) => void map.set(k, v),
            removeItem: (k: string) => void map.delete(k),
          };
        }
      }),
    },
  ),
);
