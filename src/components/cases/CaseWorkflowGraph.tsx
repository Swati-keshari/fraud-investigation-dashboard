"use client";

import { useMemo } from "react";
import { ReactFlow, Background, Controls, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { CaseStatus } from "@/types/case";
import { useAdvanceCaseStatusMutation, nextCaseStatus } from "@/hooks/useCaseMutations";

interface CaseWorkflowGraphProps {
  caseId: string;
  status: CaseStatus;
}

const STATUS_POSITIONS: Record<CaseStatus, { x: number; y: number; label: string }> = {
  opened: { x: 0, y: 80, label: "Opened\nCase created, unassigned" },
  in_progress: { x: 240, y: 80, label: "In progress\nInvestigator working case" },
  escalated: { x: 240, y: 200, label: "Escalated\nHigh priority, re-assigned" },
  resolved: { x: 480, y: 80, label: "Resolved\nConfirmed or cleared" },
  closed: { x: 720, y: 80, label: "Closed\nFinal state" },
};

const STATUS_COLOR: Record<CaseStatus, string> = {
  opened: "#4C9FE8",
  in_progress: "#4C9FE8",
  escalated: "#F5A623",
  resolved: "#3DDB8C",
  closed: "#5B6472",
};

export function CaseWorkflowGraph({ caseId, status }: CaseWorkflowGraphProps) {
  const advance = useAdvanceCaseStatusMutation();
  const next = nextCaseStatus(status);

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = (Object.keys(STATUS_POSITIONS) as CaseStatus[]).map((key) => {
      const isCurrent = key === status;
      const isNext = key === next;
      const pos = STATUS_POSITIONS[key];
      return {
        id: key,
        position: { x: pos.x, y: pos.y },
        data: { label: pos.label.split("\n").join("  ·  ") },
        style: {
          background: isCurrent ? STATUS_COLOR[key] : "#1D232C",
          color: isCurrent ? "#0F1319" : isNext ? STATUS_COLOR[key] : "#8B96A5",
          border: `1.5px solid ${isCurrent || isNext ? STATUS_COLOR[key] : "#262E39"}`,
          borderRadius: 6,
          padding: "8px 12px",
          fontSize: 12,
          width: 190,
          cursor: isNext ? "pointer" : "default",
          fontWeight: isCurrent ? 600 : 500,
        },
      };
    });

    const edgeDefs: [CaseStatus, CaseStatus, string?][] = [
      ["opened", "in_progress", "investigator assigned"],
      ["in_progress", "resolved", "final review"],
      ["resolved", "closed", undefined],
      ["in_progress", "escalated", "escalate"],
      ["escalated", "in_progress", "re-assigned"],
      ["escalated", "closed", "unresolved"],
    ];

    const edges: Edge[] = edgeDefs.map(([from, to, label]) => ({
      id: `${from}-${to}`,
      source: from,
      target: to,
      label,
      animated: from === status,
      style: { stroke: "#39424F" },
      labelStyle: { fill: "#8B96A5", fontSize: 10 },
    }));

    return { nodes, edges };
  }, [status, next]);

  return (
    <div className="h-64 rounded border border-border bg-surface">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable={false}
        nodesConnectable={false}
        panOnScroll
        zoomOnScroll={false}
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_, node) => {
          if (node.id === next) {
            advance.mutate({ caseId, to: node.id as CaseStatus });
          }
        }}
      >
        <Background color="#262E39" gap={16} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
