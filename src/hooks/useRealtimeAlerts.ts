import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { subscribeToNewAlerts } from "@/lib/mockApi";
import type { Alert } from "@/types/alert";
import { alertsQueryKey } from "./useAlertsQuery";

/**
 * No polling, no manual refresh: new alerts are pushed in and merged
 * directly into the TanStack Query cache so the queue and the badge
 * counter update from the same source of truth. See lib/mockApi.ts for
 * why this is a plain pub/sub bus rather than a live socket connection.
 */
export function useRealtimeAlerts() {
  const queryClient = useQueryClient();
  const [liveCount, setLiveCount] = useState(0);
  const [latestAlertId, setLatestAlertId] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    // subscribeToNewAlerts is now async because it loads from the database
    subscribeToNewAlerts((incoming: Alert) => {
      if (!mountedRef.current) return;
      // Merge into infinite query cache: prepend to first page
      queryClient.setQueryData(alertsQueryKey, (old: any) => {
        if (!old) return old;
        const pages = [...old.pages];
        if (pages.length > 0) {
          pages[0] = { ...pages[0], alerts: [incoming, ...pages[0].alerts] };
        }
        return { ...old, pages };
      });
      setLiveCount((c) => c + 1);
      setLatestAlertId(incoming.alertId);
    }).then((unsubscribe) => {
      unsubscribeRef.current = unsubscribe;
    });

    return () => {
      mountedRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [queryClient]);

  const resetLiveCount = () => setLiveCount(0);

  return { liveCount, latestAlertId, resetLiveCount };
}