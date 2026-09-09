import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRollback } from "@/src/hooks/useDeployments";

interface RollbackButtonProps {
  projectId: string;
  deploymentId: string;
  isLatest: boolean;
  onRollbackSuccess?: (newDeploymentId: string) => void;
}

export function RollbackButton({
  projectId,
  deploymentId,
  isLatest,
  onRollbackSuccess,
}: RollbackButtonProps) {
  const { rollback, isRollingBack, error } = useRollback();
  const [showConfirm, setShowConfirm] = useState(false);

  if (isLatest) {
    return (
      <span className="text-[11px] text-muted-foreground font-mono">
        Active Build
      </span>
    );
  }

  const handleRollback = async () => {
    const newId = await rollback(projectId, deploymentId);
    if (newId) {
      setShowConfirm(false);
      onRollbackSuccess?.(newId);
    }
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      {error && (
        <span className="text-[10px] text-destructive mr-1">{error}</span>
      )}

      {!showConfirm ? (
        <Button
          variant="outline"
          size="xs"
          onClick={() => setShowConfirm(true)}
          disabled={isRollingBack}
        >
          Rollback
        </Button>
      ) : (
        <div className="inline-flex items-center gap-1 border border-border bg-card px-1 py-0.5">
          <span className="text-[10px] text-muted-foreground">Restore this build?</span>
          <Button
            variant="destructive"
            size="xs"
            onClick={handleRollback}
            disabled={isRollingBack}
            className="h-5 px-1.5 text-[10px]"
          >
            {isRollingBack ? "..." : "Yes"}
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => setShowConfirm(false)}
            disabled={isRollingBack}
            className="h-5 px-1.5 text-[10px]"
          >
            No
          </Button>
        </div>
      )}
    </div>
  );
}

export default RollbackButton;
