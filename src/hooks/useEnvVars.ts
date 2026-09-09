import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import api from "@/src/lib/api";
import { getToken } from "@/src/lib/utils";
import { DEMO_TOKEN, MOCK_ENV_VARS } from "@/src/lib/mockData";
import type { EnvVarPreview, EnvVarInput } from "@/src/types";

interface EnvVarsResponse {
  envVars?: EnvVarPreview[];
}

export function useEnvVars(projectId: string | undefined) {
  const [envVars, setEnvVars] = useState<EnvVarPreview[]>(() => {
    if (getToken() === DEMO_TOKEN && projectId) {
      return (
        MOCK_ENV_VARS[projectId] ||
        MOCK_ENV_VARS["proj_nextjs_portfolio"] ||
        []
      );
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => getToken() !== DEMO_TOKEN);
  const [error, setError] = useState<string | null>(null);

  const fetchEnvVars = useCallback(async () => {
    if (!projectId) return;

    if (getToken() === DEMO_TOKEN) {
      const mockList =
        MOCK_ENV_VARS[projectId] ||
        MOCK_ENV_VARS["proj_nextjs_portfolio"] ||
        [];
      setEnvVars([...mockList]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<EnvVarsResponse | EnvVarPreview[]>(
        `/api/projects/${projectId}/env`
      );
      const list = Array.isArray(res.data)
        ? res.data
        : (res.data as EnvVarsResponse).envVars || [];
      setEnvVars(list);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Failed to load environment variables."
        );
      } else {
        setError("An unexpected error occurred while loading environment variables.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchEnvVars();
  }, [fetchEnvVars]);

  return { envVars, isLoading, error, refetch: fetchEnvVars };
}

export function useSaveEnvVars() {
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const saveEnvVars = async (
    projectId: string,
    envVars: EnvVarInput[]
  ): Promise<boolean> => {
    setIsSaving(true);
    setError(null);

    if (getToken() === DEMO_TOKEN) {
      MOCK_ENV_VARS[projectId] = envVars.map((v) => ({
        key: v.key,
        preview: "••••" + (v.value ? v.value.slice(-4) : "••••"),
      }));
      setIsSaving(false);
      return true;
    }

    try {
      await api.post(`/api/projects/${projectId}/env`, { envVars });
      return true;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Failed to save environment variables."
        );
      } else {
        setError("An unexpected error occurred while saving environment variables.");
      }
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return { saveEnvVars, isSaving, error };
}
