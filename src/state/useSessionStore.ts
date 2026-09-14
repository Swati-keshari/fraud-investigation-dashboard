import { create } from "zustand";

export interface SavedFilter {
  id: string;
  name: string;
  riskTier: "all" | "critical" | "high" | "medium" | "low";
  search: string;
}

interface SessionState {
  analystName: string;
  savedFilters: SavedFilter[];
  saveFilter: (filter: Omit<SavedFilter, "id">) => void;
  removeSavedFilter: (id: string) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  analystName: "A. Reyes",
  savedFilters: [
    { id: "sf-1", name: "Critical only", riskTier: "critical", search: "" },
    { id: "sf-2", name: "New payee + high risk", riskTier: "high", search: "" },
  ],
  saveFilter: (filter) =>
    set((state) => ({
      savedFilters: [...state.savedFilters, { ...filter, id: `sf-${Date.now()}` }],
    })),
  removeSavedFilter: (id) =>
    set((state) => ({ savedFilters: state.savedFilters.filter((f) => f.id !== id) })),
}));
