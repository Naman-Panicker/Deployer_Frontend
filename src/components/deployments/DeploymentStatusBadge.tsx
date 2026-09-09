import { type DeploymentStatus, isTerminalStatus } from "@/src/types";

interface DeploymentStatusBadgeProps {
  status: DeploymentStatus;
}

export function DeploymentStatusBadge({ status }: DeploymentStatusBadgeProps) {
  const getBadgeStyle = () => {
    switch (status) {
      case "DEPLOYED":
        return "border-emerald-600/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10";
      case "FAILED":
        return "border-destructive/40 text-destructive bg-destructive/10";
      case "BUILDING":
        return "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10";
      case "DOWNLOADING":
      case "UPLOADING_BUILD":
        return "border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/10";
      case "QUEUED":
      default:
        return "border-border text-muted-foreground bg-muted/30";
    }
  };

  const formatLabel = () => {
    switch (status) {
      case "UPLOADING_BUILD":
        return "Uploading";
      case "DOWNLOADING":
        return "Downloading";
      case "BUILDING":
        return "Building";
      case "QUEUED":
        return "Queued";
      case "DEPLOYED":
        return "Deployed";
      case "FAILED":
        return "Failed";
      default:
        return status;
    }
  };

  const isInProgress = !isTerminalStatus(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono border rounded-none ${getBadgeStyle()}`}
    >
      {isInProgress ? (
        <span className="w-1.5 h-1.5 rounded-none bg-current opacity-80" />
      ) : (
        <span className="w-1.5 h-1.5 rounded-none bg-current" />
      )}
      {formatLabel()}
    </span>
  );
}

export default DeploymentStatusBadge;
