import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DeploymentStatusBadge } from "./DeploymentStatusBadge";
import { RollbackButton } from "./RollbackButton";
import type { Deployment } from "@/src/types";

interface DeploymentHistoryProps {
  projectId: string;
  deployments: Deployment[];
  isLoading: boolean;
  onDeploymentChange: () => void;
}

export function DeploymentHistory({
  projectId,
  deployments,
  isLoading,
  onDeploymentChange,
}: DeploymentHistoryProps) {
  const navigate = useNavigate();

  if (isLoading && deployments.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground">
        Loading deployment history...
      </div>
    );
  }

  if (deployments.length === 0) {
    return (
      <div className="border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
        No deployments found for this project. Trigger a deploy above to start.
      </div>
    );
  }

  // Find index of the most recent DEPLOYED build to mark as active
  const latestDeployedIndex = deployments.findIndex((d) => d.status === "DEPLOYED");

  return (
    <div className="border border-border divide-y divide-border">
      {deployments.map((deployment, idx) => {
        const isCurrentActive = idx === latestDeployedIndex;
        const formattedDate = new Date(deployment.createdAt).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <div
            key={deployment.id}
            className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <DeploymentStatusBadge status={deployment.status} />

              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono text-muted-foreground text-[11px]">
                  {deployment.commitHash ? deployment.commitHash.slice(0, 7) : "HEAD"}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-[11px] text-muted-foreground uppercase">
                  {deployment.triggerType}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
              <span className="text-[11px] text-muted-foreground">
                {formattedDate}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() =>
                    navigate(`/projects/${projectId}/deployments/${deployment.id}`)
                  }
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
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default DeploymentHistory;
