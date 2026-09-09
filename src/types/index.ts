// ─── Types ────────────────────────────────────────────────────────────────────

export type User = {
  id: string;
  email: string;
  createdAt: string;
};

export type DeploymentStatus =
  | "QUEUED"
  | "DOWNLOADING"
  | "BUILDING"
  | "UPLOADING_BUILD"
  | "DEPLOYED"
  | "FAILED";

export type TriggerType = "MANUAL" | "WEBHOOK" | "ROLLBACK";

export type Project = {
  id: string;
  name: string;
  repoUrl: string;
  subdomain: string;
  branch: string;
  createdAt: string;
};

export type Deployment = {
  id: string;
  status: DeploymentStatus;
  commitHash: string | null;
  triggerType: TriggerType;
  createdAt: string;
  updatedAt: string;
};

export type LogEntry = {
  stream: "stdout" | "stderr";
  line: string;
  timestamp: string;
};

/** Shape returned by GET /api/projects/:id/env */
export type EnvVarPreview = {
  key: string;
  preview: string; // e.g. "••••abcd"
};

/** Shape for POST /api/projects/:id/env body */
export type EnvVarInput = {
  key: string;
  value: string;
};

export type ApiError = {
  message: string;
  status?: number;
};

// ─── Terminal deployment states ───────────────────────────────────────────────
export const TERMINAL_STATUSES: DeploymentStatus[] = ["DEPLOYED", "FAILED"];

export function isTerminalStatus(status: DeploymentStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}
