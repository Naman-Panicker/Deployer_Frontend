import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTriggerDeploy } from "@/src/hooks/useDeployments";

interface DeployButtonProps {
  projectId: string;
  defaultBranch: string;
  onDeployTriggered?: (deploymentId: string) => void;
}

export function DeployButton({
  projectId,
  defaultBranch,
  onDeployTriggered,
}: DeployButtonProps) {
  const { triggerDeploy, isDeploying, error } = useTriggerDeploy();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeploy = async () => {
    const deploymentId = await triggerDeploy(projectId, defaultBranch);
    if (deploymentId) {
      setShowConfirm(false);
      onDeployTriggered?.(deploymentId);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      {error && (
        <span className="text-[11px] text-destructive max-w-xs text-right">
          {error}
        </span>
      )}

      {!showConfirm ? (
        <Button
          size="sm"
          onClick={() => setShowConfirm(true)}
          disabled={isDeploying}
        >
          Deploy
        </Button>
      ) : (
        <div className="flex items-center gap-1.5 border border-border bg-card p-1 rounded-md">
          <span className="text-[11px] text-muted-foreground px-1">
            Deploy from <span className="font-mono text-foreground font-semibold">{defaultBranch || "main"}</span>?
          </span>
          <Button
            size="xs"
            onClick={handleDeploy}
            disabled={isDeploying}
          >
            {isDeploying ? "Queuing..." : "Confirm"}
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => setShowConfirm(false)}
            disabled={isDeploying}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

export default DeployButton;
