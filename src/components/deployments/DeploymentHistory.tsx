import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeploymentStatusBadge } from "./DeploymentStatusBadge";
import { RollbackButton } from "./RollbackButton";
import type { Deployment } from "@/src/types";

interface DeploymentHistoryProps {
  projectId: string;
  branch?: string;
  deployments: Deployment[];
  isLoading: boolean;
  onDeploymentChange: () => void;
}

type FilterStatus = "ALL" | "DEPLOYED" | "BUILDING" | "FAILED";

export function DeploymentHistory({
  projectId,
  branch = "main",
  deployments,
  isLoading,
  onDeploymentChange,
}: DeploymentHistoryProps) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

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

  const formatDescription = (deployment: Deployment) => {
    const sha = deployment.commitHash ? deployment.commitHash.slice(0, 7) : "HEAD";
    switch (deployment.triggerType) {
      case "WEBHOOK":
        return `Git Push: commit ${sha}`;
      case "ROLLBACK":
        return `Rollback to ${sha}`;
      case "MANUAL":
      default:
        return `Manual deploy (${sha})`;
    }
  };

  const formatRelativeAge = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Find index of most recent DEPLOYED build to mark as currently active
  const latestDeployedIndex = deployments.findIndex((d) => d.status === "DEPLOYED");

  const filteredDeployments = useMemo(() => {
    return deployments.filter((d) => {
      // Status filter
      if (filter === "DEPLOYED" && d.status !== "DEPLOYED") return false;
      if (
        filter === "BUILDING" &&
        !["BUILDING", "DOWNLOADING", "UPLOADING_BUILD", "QUEUED"].includes(d.status)
      )
        return false;
      if (filter === "FAILED" && d.status !== "FAILED") return false;

      // Text search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const hash = (d.commitHash || "").toLowerCase();
        const trigger = (d.triggerType || "").toLowerCase();
        const status = d.status.toLowerCase();
        return hash.includes(query) || trigger.includes(query) || status.includes(query);
      }

      return true;
    });
  }, [deployments, filter, searchQuery]);

  if (isLoading && deployments.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-xs text-muted-foreground font-mono">
          Loading deployment history...
        </span>
      </div>
    );
  }

  if (deployments.length === 0) {
    return (
      <div className="border border-dashed border-border/60 py-12 text-center text-xs text-muted-foreground rounded-xl">
        No deployments found for this project. Trigger a deploy above to start.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              { key: "ALL", label: "All" },
              { key: "DEPLOYED", label: "Ready" },
              { key: "BUILDING", label: "Building" },
              { key: "FAILED", label: "Failed" },
            ] as const
          ).map((item) => {
            const isActive = filter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "bg-card text-foreground hover:bg-muted"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Commit / Trigger Search */}
        <div className="w-full sm:w-64">
          <Input
            type="text"
            placeholder="Search commits, status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs font-mono bg-background text-foreground"
          />
        </div>
      </div>

      {/* Dense Deployments Table */}
      <div className="rounded-xl overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted/40 text-foreground font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-medium">Deployment</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium hidden md:table-cell">Environment</th>
                <th className="py-3 px-4 font-medium hidden sm:table-cell">Branch</th>
                <th className="py-3 px-4 font-medium hidden lg:table-cell">Age</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeployments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No deployments match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredDeployments.map((deployment) => {
                  const isCurrentActive =
                    deployments.findIndex((d) => d.id === deployment.id) ===
                    latestDeployedIndex;
                  const duration = calculateDuration(
                    deployment.createdAt,
                    deployment.updatedAt
                  );
                  const formattedDate = new Date(deployment.createdAt).toLocaleDateString(
                    undefined,
                    {
                      month: "short",
                      day: "numeric",
                    }
                  );
                  const relativeAge = formatRelativeAge(deployment.createdAt);

                  return (
                    <tr
                      key={deployment.id}
                      onClick={() =>
                        navigate(`/projects/${projectId}/deployments/${deployment.id}`)
                      }
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                      {/* Column 1: Deployment & Trigger */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="font-medium text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                            <span>{formatDescription(deployment)}</span>
                            {isCurrentActive && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-primary/20 text-foreground rounded">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-foreground">
                            {deployment.commitHash
                              ? deployment.commitHash.slice(0, 7)
                              : "HEAD"}
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Status & Duration */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <DeploymentStatusBadge status={deployment.status} />
                          {duration && (
                            <span className="text-[11px] font-mono text-foreground hidden sm:inline">
                              {duration}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 3: Environment */}
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-mono rounded-md bg-muted text-foreground">
                          Production
                        </span>
                      </td>

                      {/* Column 4: Branch */}
                      <td className="py-3 px-4 hidden sm:table-cell font-mono text-foreground text-[11px]">
                        {branch}
                      </td>

                      {/* Column 5: Age */}
                      <td className="py-3 px-4 hidden lg:table-cell text-foreground">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span>{formattedDate}</span>
                          <span className="text-foreground/70">({relativeAge})</span>
                        </div>
                      </td>

                      {/* Column 6: Actions */}
                      <td
                        className="py-3 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() =>
                              navigate(`/projects/${projectId}/deployments/${deployment.id}`)
                            }
                            className="font-mono text-xs"
                          >
                            Logs
                          </Button>

                          {deployment.status === "DEPLOYED" && (
                            <RollbackButton
                              projectId={projectId}
                              deploymentId={deployment.id}
                              isLatest={isCurrentActive}
                              onRollbackSuccess={onDeploymentChange}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DeploymentHistory;
