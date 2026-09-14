"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useQueryClient } from "@tanstack/react-query";
import { Radio } from "lucide-react";
import { FilterBar } from "./FilterBar";
import { AlertRowCard } from "./AlertRowCard";
import { TransactionDetailDrawer } from "./TransactionDetailDrawer";
import { BulkActionsBar } from "@/components/common/BulkActionsBar";
import { useAlertsQuery, useAlertActionMutation, useBulkActionMutation } from "@/hooks/useAlertsQuery";
import { useRealtimeAlerts } from "@/hooks/useRealtimeAlerts";
import { useUIStore } from "@/state/useUIStore";
import { fetchAlertById } from "@/lib/mockApi";
import type { AlertAction } from "@/types/alert";

// Code-split: AG Grid is heavy and not needed for first paint. On narrow
// viewports we skip it entirely in favor of AlertRowCard.
const AlertQueueTable = dynamic(
  () => import("./AlertQueueTable").then((m) => m.AlertQueueTable),
  {
    ssr: false,
    loading: () => <QueueSkeleton />,
  }
);

function QueueSkeleton() {
  return (
    <div className="space-y-2 p-4" aria-hidden="true">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-9 animate-pulse rounded bg-surface-raised" style={{ opacity: 1 - i * 0.06 }} />
      ))}
    </div>
  );
}

export function AlertQueuePage() {
  const { alerts, total, hasMore, fetchNextPage, isFetchingNextPage, isLoading } = useAlertsQuery();
  const { liveCount, latestAlertId, resetLiveCount } = useRealtimeAlerts();
  const queryClient = useQueryClient();

  const openAlertId = useUIStore((s) => s.openAlertId);
  const openDrawer = useUIStore((s) => s.openDrawer);
  const closeDrawer = useUIStore((s) => s.closeDrawer);
  const selectedAlertIds = useUIStore((s) => s.selectedAlertIds);
  const selectMany = useUIStore((s) => s.selectMany);
  const clearSelection = useUIStore((s) => s.clearSelection);
  const filters = useUIStore((s) => s.filters);

  const actionMutation = useAlertActionMutation();
  const bulkMutation = useBulkActionMutation();

  const [toast, setToast] = useState<string | null>(null);
  const [focusedAlertId, setFocusedAlertId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];
    const q = filters.search.trim().toLowerCase();
    return alerts.filter((a) => {
      const matchesTier = filters.riskTier === "all" || a.riskTier === filters.riskTier;
      const matchesSearch =
        !q || a.alertId.toLowerCase().includes(q) || a.customer.name.toLowerCase().includes(q);
      return matchesTier && matchesSearch;
    });
  }, [alerts, filters]);

  const openAlert = alerts?.find((a) => a.alertId === openAlertId) ?? null;

  // aria-live announcer for new real-time alerts — announces without
  // stealing focus from whatever the analyst is doing.
  useEffect(() => {
    if (latestAlertId) {
      const a = alerts?.find((x) => x.alertId === latestAlertId);
      if (a) setAnnouncement(`New alert: ${a.customer.name}, ${a.riskTier} risk, ${a.alertId}`);
    }
  }, [latestAlertId, alerts]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  function runAction(alertId: string, action: AlertAction) {
    actionMutation.mutate(
      { alertId, action },
      { onError: (err) => setToast(err instanceof Error ? err.message : "Action failed") }
    );
  }

  // Keyboard-first triage: A approve, D decline, E escalate, J/K next/prev.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const activeId = openAlertId ?? focusedAlertId;
      const key = e.key.toLowerCase();

      if (["a", "d", "e"].includes(key) && activeId) {
        e.preventDefault();
        const action: AlertAction = key === "a" ? "approve" : key === "d" ? "decline" : "escalate";
        runAction(activeId, action);
        return;
      }

      if (key === "j" || key === "k") {
        e.preventDefault();
        if (filteredAlerts.length === 0) return;
        const currentIndex = filteredAlerts.findIndex((a) => a.alertId === activeId);
        const nextIndex =
          currentIndex === -1
            ? 0
            : key === "j"
              ? Math.min(currentIndex + 1, filteredAlerts.length - 1)
              : Math.max(currentIndex - 1, 0);
        const next = filteredAlerts[nextIndex];
        setFocusedAlertId(next.alertId);
        if (openAlertId) openDrawer(next.alertId); // keep triage flowing if the drawer's already open
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAlertId, focusedAlertId, filteredAlerts]);

  function handlePrefetch(alertId: string) {
    queryClient.prefetchQuery({
      queryKey: ["alerts", alertId],
      queryFn: () => fetchAlertById(alertId),
      staleTime: 15_000,
    });
  }

  return (
    <div className="relative flex h-full flex-col">
      <FilterBar />

      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-1.5 text-xs text-ink-faint">
        <span>{filteredAlerts.length}{total > filteredAlerts.length ? ` of ${total}` : ''} alerts</span>
        {liveCount > 0 && (
          <button
            onClick={resetLiveCount}
            className="flex items-center gap-1.5 rounded-full bg-risk-info/15 px-2 py-0.5 text-risk-info"
          >
            <Radio size={11} className="animate-pulse" aria-hidden="true" />
            {liveCount} new
          </button>
        )}
      </div>

      {/* aria-live region: announces new alerts without stealing focus */}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <div className="min-h-0 flex-1 @container">
        {isLoading ? (
          <QueueSkeleton />
        ) : (
          <>
            {/* Desktop/tablet: AG Grid */}
            <div className="hidden h-full sm:block">
              <AlertQueueTable
                alerts={filteredAlerts}
                onOpenAlert={openDrawer}
                onPrefetchAlert={handlePrefetch}
                selectedIds={selectedAlertIds}
                onSelectionChange={selectMany}
                focusedAlertId={focusedAlertId}
              />
            </div>
            {hasMore && (
              <div className="flex justify-center py-3">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="rounded border border-border bg-surface-raised px-4 py-1.5 text-xs text-ink transition hover:bg-surface hover:text-ink-faint disabled:opacity-50"
                >
                  {isFetchingNextPage ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
            {/* Mobile: stacked cards */}
            <div className="h-full overflow-y-auto sm:hidden">
              {filteredAlerts.map((alert) => (
                <AlertRowCard
                  key={alert.alertId}
                  alert={alert}
                  onOpen={() => openDrawer(alert.alertId)}
                  selected={selectedAlertIds.has(alert.alertId)}
                  onToggleSelected={() => {
                    const next = new Set(selectedAlertIds);
                    next.has(alert.alertId) ? next.delete(alert.alertId) : next.add(alert.alertId);
                    selectMany(Array.from(next));
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <BulkActionsBar
        count={selectedAlertIds.size}
        isPending={bulkMutation.isPending}
        onClear={clearSelection}
        onAction={(action) => {
          bulkMutation.mutate(
            { alertIds: Array.from(selectedAlertIds), action },
            { onSuccess: () => clearSelection() }
          );
        }}
      />

      <TransactionDetailDrawer
        alert={openAlert}
        isOpen={!!openAlert}
        onClose={closeDrawer}
        onAction={(action) => openAlertId && runAction(openAlertId, action)}
        isActionPending={actionMutation.isPending}
      />

      {toast && (
        <div
          role="alert"
          className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded border border-risk-critical/40 bg-surface-raised px-4 py-2 text-sm text-risk-critical shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
