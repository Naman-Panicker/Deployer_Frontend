import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import api from "@/src/lib/api";
import { getToken } from "@/src/lib/utils";
import { DEMO_TOKEN, MOCK_DEPLOYMENTS } from "@/src/lib/mockData";
import { type Deployment, isTerminalStatus } from "@/src/types";

interface DeploymentsResponse {
  deployments?: Deployment[];
}

interface DeployTriggerResponse {
  deploymentId: string;
}

export function useDeployments(projectId: string | undefined) {
  const [deployments, setDeployments] = useState<Deployment[]>(() => {
    if (getToken() === DEMO_TOKEN && projectId) {
      return (
        MOCK_DEPLOYMENTS[projectId] ||
        MOCK_DEPLOYMENTS["proj_nextjs_portfolio"] ||
        []
      );
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => getToken() !== DEMO_TOKEN);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDeployments = useCallback(
    async (quiet = false) => {
      if (!projectId) return;

      if (getToken() === DEMO_TOKEN) {
        const mockList =
          MOCK_DEPLOYMENTS[projectId] ||
          MOCK_DEPLOYMENTS["proj_nextjs_portfolio"] ||
          [];
        setDeployments([...mockList]);
        setIsLoading(false);
        return mockList;
      }

      if (!quiet) setIsLoading(true);
      setError(null);
      try {
        const res = await api.get<DeploymentsResponse | Deployment[]>(
          `/api/projects/${projectId}/deployments`
        );
        const list = Array.isArray(res.data)
          ? res.data
          : (res.data as DeploymentsResponse).deployments || [];

        // Sort newest first
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setDeployments(list);
        return list;
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(
            err.response?.data?.message ||
              err.response?.data?.error ||
              "Failed to load deployments."
          );
        } else {
          setError("An unexpected error occurred while loading deployments.");
        }
        return [];
      } finally {
        if (!quiet) setIsLoading(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  // Polling mechanism when any deployment is active / non-terminal
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const hasActiveDeployment = deployments.some((d) => !isTerminalStatus(d.status));

    if (hasActiveDeployment && projectId) {
      timerRef.current = setInterval(() => {
        fetchDeployments(true);
      }, 3000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [deployments, projectId, fetchDeployments]);

  return { deployments, isLoading, error, refetch: fetchDeployments };
}

export function useTriggerDeploy() {
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const triggerDeploy = async (
    projectId: string,
    branch?: string
  ): Promise<string | null> => {
    setIsDeploying(true);
    setError(null);

    if (getToken() === DEMO_TOKEN) {
      const newId = `dep_demo_${Date.now()}`;
      const newDep: Deployment = {
        id: newId,
        status: "BUILDING",
        commitHash: "e5f6a7b",
        triggerType: "MANUAL",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (!MOCK_DEPLOYMENTS[projectId]) {
        MOCK_DEPLOYMENTS[projectId] = [];
      }
      MOCK_DEPLOYMENTS[projectId].unshift(newDep);
      setIsDeploying(false);
      return newId;
    }

    try {
      const payload = branch ? { branch } : {};
      const res = await api.post<DeployTriggerResponse>(
        `/api/projects/${projectId}/deploy`,
        payload
      );
      return res.data.deploymentId;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Failed to trigger deployment."
        );
      } else {
        setError("An unexpected error occurred while triggering deployment.");
      }
      return null;
    } finally {
      setIsDeploying(false);
    }
  };

  return { triggerDeploy, isDeploying, error };
}

export function useRollback() {
  const [isRollingBack, setIsRollingBack] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const rollback = async (
    projectId: string,
    deploymentId: string
  ): Promise<string | null> => {
    setIsRollingBack(true);
    setError(null);

    if (getToken() === DEMO_TOKEN) {
      const newId = `dep_rollback_${Date.now()}`;
      const newDep: Deployment = {
        id: newId,
        status: "DEPLOYED",
        commitHash: "a8f3c91",
        triggerType: "ROLLBACK",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (!MOCK_DEPLOYMENTS[projectId]) {
        MOCK_DEPLOYMENTS[projectId] = [];
      }
      MOCK_DEPLOYMENTS[projectId].unshift(newDep);
      setIsRollingBack(false);
      return newId;
    }

    try {
      const res = await api.post<DeployTriggerResponse>(
        `/api/projects/${projectId}/rollback`,
        { deploymentId }
      );
      return res.data.deploymentId;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Failed to rollback deployment."
        );
      } else {
        setError("An unexpected error occurred while rolling back.");
      }
      return null;
    } finally {
      setIsRollingBack(false);
    }
  };

  return { rollback, isRollingBack, error };
}
