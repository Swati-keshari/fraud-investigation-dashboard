"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useUIStore } from "@/state/useUIStore";
import { SavedFiltersMenu } from "@/components/common/SavedFiltersMenu";

const TIERS = [
  { value: "all", label: "All" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
] as const;

function Controls() {
  const filters = useUIStore((s) => s.filters);
  const setFilters = useUIStore((s) => s.setFilters);

  return (
    <>
      <div className="flex items-center gap-1 rounded border border-border bg-surface-raised p-0.5">
        {TIERS.map((t) => (
          <button
            key={t.value}
            onClick={() => setFilters({ riskTier: t.value })}
            className={`rounded px-2.5 py-1 text-xs transition-colors ${
              filters.riskTier === t.value ? "bg-risk-info/20 text-risk-info" : "text-ink-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <input
        value={filters.search}
        onChange={(e) => setFilters({ search: e.target.value })}
        placeholder="Search customer, alert ID…"
        className="w-full max-w-xs rounded border border-border bg-surface-raised px-3 py-1.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none sm:w-56"
      />
    </>
  );
}

export function FilterBar() {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-2">
      {/* Desktop / tablet: inline controls */}
      <div className="hidden flex-1 items-center gap-2 sm:flex">
        <Controls />
        <div className="ml-auto">
          <SavedFiltersMenu />
        </div>
      </div>

      {/* Mobile: single Filters button opening a sheet */}
      <button
        onClick={() => setSheetOpen(true)}
        className="flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-sm text-ink-muted sm:hidden"
      >
        <SlidersHorizontal size={14} /> Filters
      </button>

      {sheetOpen && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/60 sm:hidden" onClick={() => setSheetOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full space-y-3 rounded-t-md border-t border-border-strong bg-surface-raised p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-ink">Filters</p>
              <button onClick={() => setSheetOpen(false)} aria-label="Close filters">
                <X size={18} className="text-ink-faint" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <Controls />
            </div>
            <SavedFiltersMenu />
          </div>
        </div>
      )}
    </div>
  );
}
