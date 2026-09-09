import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DeploymentStatusBadge } from "./DeploymentStatusBadge";
import { DeployButton } from "./DeployButton";
import { useRollback } from "@/src/hooks/useDeployments";
import type { Project, Deployment } from "@/src/types";

interface ProductionDeploymentCardProps {
  project: Project;
  latestDeployment?: Deployment;
  allDeployments: Deployment[];
  onDeploymentChange: () => void;
}

export function ProductionDeploymentCard({
  project,
  latestDeployment,
  allDeployments,
  onDeploymentChange,
}: ProductionDeploymentCardProps) {
  const { rollback, isRollingBack, error: rollbackError } = useRollback();
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const liveUrl = `http://${project.subdomain}.localhost:8080`;

  // Find previous deployed build for instant rollback
  const previousDeployment = allDeployments.find(
    (d) => d.status === "DEPLOYED" && d.id !== latestDeployment?.id
  );

  const handleInstantRollback = async () => {
    if (!previousDeployment) return;
    const newId = await rollback(project.id, previousDeployment.id);
    if (newId) {
      setShowRollbackConfirm(false);
      onDeploymentChange();
    }
  };

  const calculateDuration = (createdAt: string, updatedAt?: string) => {
    if (!updatedAt) return "";
    const start = new Date(createdAt).getTime();
    const end = new Date(updatedAt).getTime();
    const diffSec = Math.max(0, Math.round((end - start) / 1000));
    if (diffSec < 1) return "<1s";
    if (diffSec < 60) return `${diffSec}s`;
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const formatTrigger = (trigger?: string) => {
    switch (trigger) {
      case "WEBHOOK":
        return "Git Webhook Push";
      case "ROLLBACK":
        return "Instant Rollback";
      case "MANUAL":
        return "Manual Trigger";
      default:
        return "Manual";
    }
  };

  const isDeployed = latestDeployment?.status === "DEPLOYED";
  const isBuilding =
    latestDeployment?.status === "BUILDING" ||
    latestDeployment?.status === "DOWNLOADING" ||
    latestDeployment?.status === "UPLOADING_BUILD" ||
    latestDeployment?.status === "QUEUED";
  const isFailed = latestDeployment?.status === "FAILED";

  const duration = latestDeployment
    ? calculateDuration(latestDeployment.createdAt, latestDeployment.updatedAt)
    : "";

  return (
    <div className="bg-card rounded-xl overflow-hidden">
      {/* Merged Header: Project Identity, Badges & Action Bar */}
      <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/40">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-foreground">{project.name}</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-mono rounded-md bg-muted text-foreground">
              {project.branch || "main"}
            </span>
            {latestDeployment && (
              <DeploymentStatusBadge status={latestDeployment.status} />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-foreground">
            {project.repoUrl && (
              <span>
                Repo:{" "}
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-foreground hover:text-primary hover:underline transition-colors"
                >
                  {project.repoUrl}
                </a>
              </span>
            )}
            <span className="hidden sm:inline text-foreground/40">•</span>
            <span className="font-mono text-[11px] text-foreground">
              Live reverse proxy (port 8080)
            </span>
          </div>
        </div>

        {/* Action Toolbar: Deploy, Instant Rollback, Visit */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <DeployButton
            projectId={project.id}
            defaultBranch={project.branch}
            onDeployTriggered={onDeploymentChange}
          />

          {/* Instant Rollback Button */}
          {previousDeployment && (
            <div className="relative inline-block">
              {!showRollbackConfirm ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRollbackConfirm(true)}
                  disabled={isRollingBack}
                  className="font-mono text-xs bg-muted text-foreground hover:bg-muted/80"
                >
                  Instant Rollback
                </Button>
              ) : (
                <div className="inline-flex items-center gap-1.5 bg-background px-2 py-1 rounded-md">
                  <span className="text-[11px] text-foreground">
                    Restore {previousDeployment.commitHash?.slice(0, 7) || "previous"}?
                  </span>
                  <Button
                    variant="destructive"
                    size="xs"
                    onClick={handleInstantRollback}
                    disabled={isRollingBack}
                    className="h-6 px-2 text-[10px]"
                  >
                    {isRollingBack ? "..." : "Confirm"}
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setShowRollbackConfirm(false)}
                    disabled={isRollingBack}
                    className="h-6 px-1.5 text-[10px]"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Visit Live Website Button */}
          {isDeployed && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-8 px-3.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <span>Visit</span>
              <span className="text-xs">↗</span>
            </a>
          )}
        </div>
      </div>

      {rollbackError && (
        <div className="px-6 py-2.5 border-b border-destructive/40 bg-destructive/10 text-xs text-destructive">
          {rollbackError}
        </div>
      )}

      {/* Main Split Grid: Live Preview on Left, Metadata on Right */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Website Preview Frame (5 cols) */}
        <div className="lg:col-span-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-foreground px-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-foreground">
              LIVE PREVIEW
            </span>
            {isDeployed && (
              <button
                onClick={() => setIframeKey((k) => k + 1)}
                className="text-[11px] text-foreground hover:text-primary transition-colors font-mono"
                title="Reload preview"
              >
                Reload ↻
              </button>
            )}
          </div>

          <div className="relative w-full aspect-[4/3] rounded-xl bg-background overflow-hidden flex items-center justify-center">
            {isDeployed ? (
              <iframe
                key={iframeKey}
                src={liveUrl}
                title="Website Preview"
                className="w-full h-full border-none bg-background"
                sandbox="allow-scripts allow-same-origin"
                loading="lazy"
              />
            ) : isBuilding ? (
              <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <div className="text-xs text-foreground font-mono">
                  Building deployment...
                </div>
              </div>
            ) : isFailed ? (
              <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
                <span className="text-xs text-destructive font-mono font-medium">
                  Build Failed
                </span>
                <span className="text-[11px] text-foreground">
                  Check logs for diagnostic output
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
                <span className="text-xs text-foreground font-mono">
                  No active deployment
                </span>
                <span className="text-[11px] text-foreground/80">
                  Trigger a build to generate live preview
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Deployment Metadata (7 cols) */}
        <div className="lg:col-span-7 space-y-4 pt-1">
          {latestDeployment ? (
            <div className="space-y-2 text-xs">
              {/* Row 1: Deployment Live Link */}
              <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-foreground">Deployment</span>
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-foreground hover:text-primary transition-colors inline-flex items-center gap-1 font-medium"
                >
                  <span>{project.subdomain}.localhost:8080</span>
                  <span className="text-foreground text-[10px]">↗</span>
                </a>
              </div>

              {/* Row 2: Domains */}
              <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-foreground">Domains</span>
                <span className="font-mono text-foreground font-medium">
                  {project.subdomain}.localhost:8080
                </span>
              </div>

              {/* Row 3: Status & Duration */}
              <div className="py-2 flex items-center justify-between gap-2">
                <span className="text-foreground">Status</span>
                <div className="flex items-center gap-2">
                  <DeploymentStatusBadge status={latestDeployment.status} />
                  {duration && (
                    <span className="text-[11px] font-mono text-foreground">
                      ({duration})
                    </span>
                  )}
                </div>
              </div>

              {/* Row 4: Created Timestamp & Trigger */}
              <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-foreground">Created</span>
                <div className="text-right">
                  <span className="text-foreground">
                    {new Date(latestDeployment.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-foreground ml-1.5">
                    via {formatTrigger(latestDeployment.triggerType)}
                  </span>
                </div>
              </div>

              {/* Row 5: Source Branch & Commit */}
              <div className="py-2 flex items-center justify-between gap-2">
                <span className="text-foreground">Source</span>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="px-2.5 py-0.5 rounded-md bg-muted text-foreground">
                    {project.branch || "main"}
                  </span>
                  <span className="text-foreground">
                    {latestDeployment.commitHash
                      ? latestDeployment.commitHash.slice(0, 7)
                      : "HEAD"}
                  </span>
                </div>
              </div>

              {/* Row 6: Log link */}
              <div className="py-2 flex items-center justify-between gap-2">
                <span className="text-foreground">Logs</span>
                <Link
                  to={`/projects/${project.id}/deployments/${latestDeployment.id}`}
                  className="text-foreground hover:text-primary transition-colors underline underline-offset-2 font-mono text-[11px]"
                >
                  View build logs →
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-foreground">
              No deployments created yet for this project.
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Instruction Note */}
      <div className="px-6 py-3 bg-muted/40 text-xs text-foreground flex items-center justify-between">
        <span>
          To update your Production Deployment, push to the{" "}
          <code className="font-mono text-foreground font-semibold px-1 py-0.5 rounded bg-muted">
            {project.branch || "main"}
          </code>{" "}
          branch.
        </span>
      </div>
    </div>
  );
}

export default ProductionDeploymentCard;
