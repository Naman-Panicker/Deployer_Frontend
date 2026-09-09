import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import api from "@/src/lib/api";
import { type LogEntry, type DeploymentStatus, isTerminalStatus } from "@/src/types";

interface LogsApiResponse {
  logs?: LogEntry[];
  nextCursor?: string | null;
}

export function useDeploymentLogs(
  projectId: string | undefined,
  deploymentId: string | undefined,
  status?: DeploymentStatus
) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const cursorRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFetchingRef = useRef<boolean>(false);

  const fetchLogs = useCallback(
    async (isInitial = false) => {
      if (!projectId || !deploymentId || isFetchingRef.current) return;

      isFetchingRef.current = true;

      if (isInitial) setIsLoading(true);
      setError(null);

      try {
        const query = cursorRef.current ? `?after=${encodeURIComponent(cursorRef.current)}` : "";
        const res = await api.get<LogsApiResponse>(
          `/api/projects/${projectId}/deployments/${deploymentId}/logs${query}`
        );

        const newLogs = res.data.logs || [];
        const nextCursor = res.data.nextCursor ?? null;

        if (newLogs.length > 0) {
          setLogs((prev) => [...prev, ...newLogs]);
        }

        if (nextCursor) {
          cursorRef.current = nextCursor;
        }
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(
            err.response?.data?.message ||
            err.response?.data?.error ||
            "Failed to fetch deployment logs."
          );
        } else {
          setError("An unexpected error occurred while fetching logs.");
        }
      } finally {
        if (isInitial) setIsLoading(false);
        isFetchingRef.current = false;
      }
    },
    [projectId, deploymentId]
  );

  // Initial fetch on mount or when deploymentId changes
  useEffect(() => {
    cursorRef.current = null;
    setLogs([]);
    fetchLogs(true);
  }, [projectId, deploymentId, fetchLogs]);

  // Polling management based on deployment status
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const isFinished = status ? isTerminalStatus(status) : false;

    if (!isFinished && projectId && deploymentId) {
      setIsPolling(true);
      timerRef.current = setInterval(() => {
        fetchLogs(false);
      }, 2000);
    } else {
      setIsPolling(false);
      // Terminal: perform one last sync
      fetchLogs(false);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status, projectId, deploymentId, fetchLogs]);

  return { logs, isLoading, isPolling, error, refetch: () => fetchLogs(false) };
}
