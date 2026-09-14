"use client";

import { Bookmark, X } from "lucide-react";
import { useSessionStore } from "@/state/useSessionStore";
import { useUIStore } from "@/state/useUIStore";

export function SavedFiltersMenu() {
  const savedFilters = useSessionStore((s) => s.savedFilters);
  const removeSavedFilter = useSessionStore((s) => s.removeSavedFilter);
  const setFilters = useUIStore((s) => s.setFilters);

  if (savedFilters.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto">
      {savedFilters.map((f) => (
        <span
          key={f.id}
          className="group flex shrink-0 items-center gap-1 rounded-full border border-border bg-surface-raised px-2.5 py-1 text-xs text-ink-muted"
        >
          <button
            onClick={() => setFilters({ riskTier: f.riskTier, search: f.search })}
            className="flex items-center gap-1 hover:text-ink"
          >
            <Bookmark size={11} aria-hidden="true" />
            {f.name}
          </button>
          <button
            onClick={() => removeSavedFilter(f.id)}
            aria-label={`Remove saved filter ${f.name}`}
            className="text-ink-faint opacity-0 group-hover:opacity-100 hover:text-risk-critical"
          >
            <X size={11} />
          </button>
        </span>
      ))}
    </div>
  );
}
