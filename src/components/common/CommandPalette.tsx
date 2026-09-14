"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useUIStore } from "@/state/useUIStore";
import { useAlertsQuery } from "@/hooks/useAlertsQuery";
import { useCasesQuery } from "@/hooks/useCaseMutations";
import { ALL_PAGES } from "@/content/nav";

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const openDrawer = useUIStore((s) => s.openDrawer);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { alerts } = useAlertsQuery();
  const { data: cases } = useCasesQuery();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape" && open) setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { alerts: [], cases: [], pages: [] };
    return {
      pages: ALL_PAGES.filter(
        (p) => p.label.toLowerCase().includes(q) || p.plain.toLowerCase().includes(q)
      ).slice(0, 8),
      alerts: (alerts ?? []).filter((a) => a.alertId.toLowerCase().includes(q) || a.customer.name.toLowerCase().includes(q)).slice(0, 6),
      cases: (cases ?? []).filter((c) => c.caseId.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)).slice(0, 6),
    };
  }, [query, alerts, cases]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-md border border-border-strong bg-surface-raised shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
          <Search size={16} className="text-ink-faint" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to a page, alert, or case…"
            className="w-full bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-ink-faint">esc</kbd>
        </div>

        {query.trim() && (
          <div className="max-h-80 overflow-y-auto py-1">
            {results.pages.length === 0 && results.alerts.length === 0 && results.cases.length === 0 && (
              <p className="px-3 py-4 text-sm text-ink-faint">No matches for &quot;{query}&quot;.</p>
            )}
            {results.pages.length > 0 && (
              <div className="px-1.5 py-1">
                <p className="px-1.5 py-1 text-xs text-ink-faint">Pages</p>
                {results.pages.map((p) => (
                  <button
                    key={p.href}
                    onClick={() => {
                      router.push(p.href);
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-surface"
                  >
                    <span className="text-ink">{p.label}</span>
                    <span className="truncate pl-3 text-ink-faint">{p.plain}</span>
                  </button>
                ))}
              </div>
            )}
            {results.alerts.length > 0 && (
              <div className="px-1.5 py-1">
                <p className="px-1.5 py-1 text-xs text-ink-faint">Alerts</p>
                {results.alerts.map((a) => (
                  <button
                    key={a.alertId}
                    onClick={() => {
                      openDrawer(a.alertId);
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-surface"
                  >
                    <span className="font-mono text-ink-muted">{a.alertId}</span>
                    <span className="truncate pl-3 text-ink">{a.customer.name}</span>
                  </button>
                ))}
              </div>
            )}
            {results.cases.length > 0 && (
              <div className="px-1.5 py-1">
                <p className="px-1.5 py-1 text-xs text-ink-faint">Cases</p>
                {results.cases.map((c) => (
                  <button
                    key={c.caseId}
                    onClick={() => {
                      router.push(`/cases/${c.caseId}`);
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-surface"
                  >
                    <span className="font-mono text-ink-muted">{c.caseId}</span>
                    <span className="truncate pl-3 text-ink">{c.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
