import { useParams, Link } from "react-router-dom";
import { AppShell } from "@/src/components/layout/AppShell";
import { LogViewer } from "@/src/components/deployments/LogViewer";
import { DeploymentStatusBadge } from "@/src/components/deployments/DeploymentStatusBadge";
import { useProject } from "@/src/hooks/useProjects";
import { useDeployments } from "@/src/hooks/useDeployments";
import { useDeploymentLogs } from "@/src/hooks/useDeploymentLogs";

export function DeploymentLogsPage() {
  const { id, dId } = useParams<{ id: string; dId: string }>();
  const { project } = useProject(id);
  const { deployments } = useDeployments(id);

  const deployment = deployments.find((d) => d.id === dId);
  const { logs, isLoading, isPolling, error } = useDeploymentLogs(
    id,
    dId,
    deployment?.status
  );

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Link to="/dashboard" className="hover:text-foreground">
              Projects
            </Link>
            <span>/</span>
            {project ? (
              <Link to={`/projects/${id}`} className="hover:text-foreground">
                {project.name}
              </Link>
            ) : (
              <span>Project</span>
            )}
            <span>/</span>
            <span className="text-foreground font-mono">
              Deployment {dId ? dId.slice(0, 8) : ""}
            </span>
          </div>

          <Link
            to={`/projects/${id}`}
            className="hover:text-foreground inline-flex items-center gap-1"
          >
            &larr; Back to Project
          </Link>
        </div>

        {/* Deployment Header Overview */}
        <div className="border border-border/60 bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl">
          <div className="flex items-center gap-3">
            {deployment && <DeploymentStatusBadge status={deployment.status} />}
            <span className="font-mono text-xs font-semibold">
              Commit: {deployment?.commitHash ? deployment.commitHash.slice(0, 7) : "HEAD"}
            </span>
            <span className="text-muted-foreground text-xs">•</span>
            <span className="text-xs uppercase text-muted-foreground">
              {deployment?.triggerType || "MANUAL"}
            </span>
          </div>

          <div className="text-xs text-muted-foreground font-mono">
            {deployment?.createdAt
              ? new Date(deployment.createdAt).toLocaleString()
              : ""}
          </div>
        </div>

        {/* Real-time Log Viewer */}
        <LogViewer
          logs={logs}
          isLoading={isLoading}
          isPolling={isPolling}
          error={error}
        />
      </div>
    </AppShell>
  );
}

export default DeploymentLogsPage;
