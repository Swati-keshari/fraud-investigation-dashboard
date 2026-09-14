import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addInvestigationLogEntry,
  advanceCaseStatus,
  fetchAuditLog,
  fetchCaseById,
  fetchCases,
  fetchInvestigationLog,
  NEXT_STATUS,
} from "@/lib/mockApi";
import type { CaseStatus } from "@/types/case";

export function useCasesQuery() {
  return useQuery({ queryKey: ["cases"], queryFn: fetchCases, staleTime: 15_000 });
}

export function useCaseQuery(caseId: string | null) {
  return useQuery({
    queryKey: ["cases", caseId],
    queryFn: () => fetchCaseById(caseId as string),
    enabled: !!caseId,
  });
}

export function useInvestigationLogQuery(caseId: string | null) {
  return useQuery({
    queryKey: ["investigationLog", caseId],
    queryFn: () => fetchInvestigationLog(caseId as string),
    enabled: !!caseId,
  });
}

export function useAdvanceCaseStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ caseId, to }: { caseId: string; to: CaseStatus }) => advanceCaseStatus(caseId, to),
    onSuccess: (_data, { caseId }) => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["cases", caseId] });
      queryClient.invalidateQueries({ queryKey: ["auditLog"] });
    },
  });
}

export function useAddInvestigationLogMutation(caseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ body, step }: { body: string; step: string | null }) =>
      addInvestigationLogEntry(caseId, body, step),
    // Inline, autosaving notes: the caller debounces on keystroke, this
    // mutation just needs to feel instant once it actually fires.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investigationLog", caseId] });
      queryClient.invalidateQueries({ queryKey: ["auditLog"] });
    },
  });
}

export function useAuditLogQuery() {
  return useQuery({ queryKey: ["auditLog"], queryFn: fetchAuditLog, staleTime: 5_000 });
}

export function nextCaseStatus(current: CaseStatus): CaseStatus | null {
  return NEXT_STATUS[current];
}
