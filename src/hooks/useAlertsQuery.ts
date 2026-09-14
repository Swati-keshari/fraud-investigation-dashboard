import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAlertById, fetchAlerts, postAlertAction, postBulkAction } from "@/lib/mockApi";
import type { Alert, AlertAction } from "@/types/alert";

export const alertsQueryKey = ["alerts"] as const;
const PAGE_SIZE = 20;

export function useAlertsQuery() {
  const query = useInfiniteQuery({
    queryKey: alertsQueryKey,
    queryFn: ({ pageParam = 0 }) => fetchAlerts(PAGE_SIZE, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) return undefined;
      return lastPage.alerts.length; // offset = total loaded so far
    },
    staleTime: 30_000,
  });

  // Flatten pages into a single alerts array for consumers
  const alerts = query.data?.pages.flatMap((p) => p.alerts) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  const hasMore = query.hasNextPage ?? false;

  return { ...query, alerts, total, hasMore };
}

export function useAlertQuery(alertId: string | null) {
  return useQuery({
    queryKey: ["alerts", alertId],
    queryFn: async () => {
      const result = await fetchAlertById(alertId as string);
      return result ?? null;
    },
    enabled: !!alertId,
    // Predictive prefetch (hover/focus on a queue row) means this often
    // resolves instantly from cache by the time the drawer opens.
    staleTime: 15_000,
  });
}

/**
 * Approve / Decline / Escalate / Create Case, all optimistic: the row
 * updates the instant the analyst presses the key or clicks the action,
 * then rolls back with a toast if the mock API rejects it. Analysts triaging
 * hundreds of alerts a day should never feel a network round-trip.
 */
export function useAlertActionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ alertId, action, note }: { alertId: string; action: AlertAction; note?: string }) =>
      postAlertAction(alertId, action, note),

    onMutate: async ({ alertId, action }) => {
      await queryClient.cancelQueries({ queryKey: alertsQueryKey });
      const previous = queryClient.getQueryData(alertsQueryKey);

      const statusMap: Record<AlertAction, Alert["status"]> = {
        approve: "approved",
        decline: "declined",
        escalate: "escalated",
        create_case: "case_created",
      };

      // Optimistic update on infinite query cache
      queryClient.setQueryData(alertsQueryKey, (old: any) => {
        if (!old) return old;
        const pages = old.pages.map((page: any) => ({
          ...page,
          alerts: page.alerts.map((a: Alert) =>
            a.alertId === alertId ? { ...a, status: statusMap[action] } : a
          ),
        }));
        return { ...old, pages };
      });

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(alertsQueryKey, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: alertsQueryKey });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["auditLog"] });
    },
  });
}

export function useBulkActionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ alertIds, action }: { alertIds: string[]; action: AlertAction }) =>
      postBulkAction(alertIds, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertsQueryKey });
      queryClient.invalidateQueries({ queryKey: ["auditLog"] });
    },
  });
}
