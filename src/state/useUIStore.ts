import { create } from "zustand";

interface FilterState {
  riskTier: "all" | "critical" | "high" | "medium" | "low";
  search: string;
}

interface UIState {
  // Drawer
  openAlertId: string | null;
  openDrawer: (alertId: string) => void;
  closeDrawer: () => void;

  // Bulk selection
  selectedAlertIds: Set<string>;
  toggleSelected: (alertId: string) => void;
  selectMany: (alertIds: string[]) => void;
  clearSelection: () => void;

  // Filters (pre-applied working values — not server state)
  filters: FilterState;
  setFilters: (patch: Partial<FilterState>) => void;

  // Command palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  // a11y: id of the alert last announced via aria-live, so we don't repeat
  lastAnnouncedAlertId: string | null;
  setLastAnnouncedAlertId: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  openAlertId: null,
  openDrawer: (alertId) => set({ openAlertId: alertId }),
  closeDrawer: () => set({ openAlertId: null }),

  selectedAlertIds: new Set(),
  toggleSelected: (alertId) =>
    set((state) => {
      const next = new Set(state.selectedAlertIds);
      if (next.has(alertId)) next.delete(alertId);
      else next.add(alertId);
      return { selectedAlertIds: next };
    }),
  selectMany: (alertIds) => set({ selectedAlertIds: new Set(alertIds) }),
  clearSelection: () => set({ selectedAlertIds: new Set() }),

  filters: { riskTier: "all", search: "" },
  setFilters: (patch) => set((state) => ({ filters: { ...state.filters, ...patch } })),

  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  lastAnnouncedAlertId: null,
  setLastAnnouncedAlertId: (id) => set({ lastAnnouncedAlertId: id }),
}));
