import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import api from "@/src/lib/api";
import type { EnvVarPreview, EnvVarInput } from "@/src/types";

interface EnvVarsResponse {
  envVars?: EnvVarPreview[];
}

export function useEnvVars(projectId: string | undefined) {
  const [envVars, setEnvVars] = useState<EnvVarPreview[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnvVars = useCallback(async () => {
    if (!projectId) return;

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
