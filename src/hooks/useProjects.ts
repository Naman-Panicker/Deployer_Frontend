import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import api from "@/src/lib/api";
import type { Project } from "@/src/types";

interface ProjectsResponse {
  projects?: Project[];
}

interface ProjectResponse {
  project?: Project;
}

export interface CreateProjectInput {
  name: string;
  repoUrl: string;
  subdomain: string;
  branch?: string;
}

export interface UpdateProjectInput {
  name?: string;
  repoUrl?: string;
  subdomain?: string;
  branch?: string;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<ProjectsResponse | Project[]>("/api/projects");
      const list = Array.isArray(res.data)
        ? res.data
        : (res.data as ProjectsResponse).projects || [];
      setProjects(list);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || err.response?.data?.error || "Failed to load projects.");
      } else {
        setError("An unexpected error occurred while loading projects.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return { projects, isLoading, error, refetch: fetchProjects };
}

export function useProject(id: string | undefined) {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<ProjectResponse | Project>(`/api/projects/${id}`);
      const data = "project" in (res.data as ProjectResponse) && (res.data as ProjectResponse).project
        ? (res.data as ProjectResponse).project!
        : (res.data as Project);
      setProject(data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || err.response?.data?.error || "Failed to load project details.");
      } else {
        setError("An unexpected error occurred while loading project details.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return { project, isLoading, error, refetch: fetchProject };
}

export function useCreateProject() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const createProject = async (data: CreateProjectInput): Promise<Project | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post<ProjectResponse | Project>("/api/projects", data);
      const created = "project" in (res.data as ProjectResponse) && (res.data as ProjectResponse).project
        ? (res.data as ProjectResponse).project!
        : (res.data as Project);
      return created;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || err.response?.data?.error || "Failed to create project.");
      } else {
        setError("An unexpected error occurred while creating project.");
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { createProject, isLoading, error };
}

export function useUpdateProject() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const updateProject = async (id: string, data: UpdateProjectInput): Promise<Project | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.put<ProjectResponse | Project>(`/api/projects/${id}`, data);
      const updated = "project" in (res.data as ProjectResponse) && (res.data as ProjectResponse).project
        ? (res.data as ProjectResponse).project!
        : (res.data as Project);
      return updated;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || err.response?.data?.error || "Failed to update project.");
      } else {
        setError("An unexpected error occurred while updating project.");
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateProject, isLoading, error };
}

export function useDeleteProject() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const deleteProject = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      await api.delete(`/api/projects/${id}`);
      return true;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || err.response?.data?.error || "Failed to delete project.");
      } else {
        setError("An unexpected error occurred while deleting project.");
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteProject, isLoading, error };
}
