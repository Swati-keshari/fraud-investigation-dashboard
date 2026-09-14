"use client";

import { useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type GetRowIdParams,
  type ICellRendererParams,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import clsx from "clsx";
import type { Alert, RiskTier } from "@/types/alert";
import { RISK_TIER_LABEL, formatCurrency } from "@/lib/riskScoring";

// AG Grid v33+ requires explicit module registration for tree-shaking.
// We use the full community bundle for simplicity in a demo of this size;
// a production build would register only the specific modules in use
// (ClientSideRowModelModule, sorting, filtering, etc.) to trim bundle size.
ModuleRegistry.registerModules([AllCommunityModule]);

const TIER_ORDER: Record<RiskTier, number> = { critical: 3, high: 2, medium: 1, low: 0 };

function RiskCell({ value, data }: ICellRendererParams<Alert, number>) {
  const tier: RiskTier = data?.riskTier ?? "low";
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className={clsx("h-2 w-2 shrink-0 rounded-full", {
          "bg-risk-critical": tier === "critical" || tier === "high",
          "bg-risk-medium": tier === "medium",
          "bg-risk-low": tier === "low",
        })}
      />
      <span className="font-mono tabular-nums">{value?.toFixed(0)}</span>
      <span className="text-xs text-ink-faint">{RISK_TIER_LABEL[tier]}</span>
    </div>
  );
}

function StatusCell({ value }: ICellRendererParams<Alert, Alert["status"]>) {
  if (!value || value === "new") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
        <AlertTriangle size={12} aria-hidden="true" /> New
      </span>
    );
  }
  const labels: Partial<Record<Alert["status"], string>> = {
    approved: "Approved",
    declined: "Declined",
    escalated: "Escalated",
    case_created: "Case opened",
  };
  const label = labels[value] ?? value;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-risk-low">
      <ShieldCheck size={12} aria-hidden="true" /> {label}
    </span>
  );
}

interface AlertQueueTableProps {
  alerts: Alert[];
  onOpenAlert: (alertId: string) => void;
  onPrefetchAlert: (alertId: string) => void;
  selectedIds: Set<string>;
  onSelectionChange: (ids: string[]) => void;
  focusedAlertId: string | null;
}

export function AlertQueueTable({
  alerts,
  onOpenAlert,
  onPrefetchAlert,
  onSelectionChange,
  focusedAlertId,
}: AlertQueueTableProps) {
  const gridRef = useRef<AgGridReact<Alert>>(null);

  const columnDefs = useMemo<ColDef<Alert>[]>(
    () => [
      {
        headerCheckboxSelection: true,
        checkboxSelection: true,
        width: 44,
        pinned: "left",
        sortable: false,
        filter: false,
        resizable: false,
      },
      {
        field: "alertId",
        headerName: "Alert",
        width: 130,
        cellClass: "font-mono text-ink-muted",
      },
      {
        field: "riskScore",
        headerName: "Risk",
        width: 190,
        sort: "desc",
        comparator: (a, b, nodeA, nodeB) => {
          // primary: tier, secondary: raw score — keeps criticals pinned
          // above highs even if a "high" happens to score marginally higher.
          const tierDiff = TIER_ORDER[nodeB.data!.riskTier] - TIER_ORDER[nodeA.data!.riskTier];
          return tierDiff !== 0 ? tierDiff : b - a;
        },
        cellRenderer: RiskCell,
      },
      {
        field: "customer.name" as any,
        headerName: "Customer",
        flex: 1,
        minWidth: 140,
        valueGetter: (p) => p.data?.customer.name,
      },
      {
        field: "transaction.amount" as any,
        headerName: "Amount",
        width: 120,
        cellClass: "font-mono tabular-nums",
        valueGetter: (p) => p.data?.transaction.amount,
        valueFormatter: (p) => formatCurrency(p.value, p.data?.transaction.currency),
        comparator: (a, b) => a - b,
      },
      {
        field: "transaction.merchantCategory" as any,
        headerName: "Category",
        width: 140,
        valueGetter: (p) => p.data?.transaction.merchantCategory.replace("_", " "),
      },
      {
        field: "transaction.country" as any,
        headerName: "Country",
        width: 100,
        valueGetter: (p) => p.data?.transaction.country,
      },
      {
        field: "status",
        headerName: "Status",
        width: 130,
        cellRenderer: StatusCell,
      },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({ sortable: true, filter: true, resizable: true }),
    []
  );

  const getRowId = (params: GetRowIdParams<Alert>) => params.data.alertId;

  return (
    <div
      className="ag-theme-quartz ag-theme-fraud h-full"
      role="region"
      aria-label="Alert queue table"
    >
      <AgGridReact<Alert>
        ref={gridRef}
        theme="legacy"
        rowData={alerts}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowId={getRowId}
        rowSelection={{ mode: "multiRow", checkboxes: true, headerCheckbox: true }}
        animateRows
        rowBuffer={20}
        // Virtualization: DOM node count stays flat whether there are 50 or
        // 50,000 rows — AG Grid only renders what's in (or near) the viewport.
        suppressCellFocus={false}
        onRowClicked={(e) => e.data && onOpenAlert(e.data.alertId)}
        onCellMouseOver={(e) => e.data && onPrefetchAlert(e.data.alertId)}
        onSelectionChanged={(e) => onSelectionChange(e.api.getSelectedRows().map((r) => r.alertId))}
        getRowClass={(p) =>
          p.data?.alertId === focusedAlertId ? "outline outline-1 outline-risk-info" : undefined
        }
        overlayNoRowsTemplate="<span class='text-sm text-ink-faint'>No alerts match the current filters.</span>"
      />
    </div>
  );
}
