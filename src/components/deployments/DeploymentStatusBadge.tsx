import { type DeploymentStatus } from "@/src/types";

interface DeploymentStatusBadgeProps {
  status: DeploymentStatus;
}

export function DeploymentStatusBadge({ status }: DeploymentStatusBadgeProps) {
  const getBadgeStyle = () => {
    switch (status) {
      case "DEPLOYED":
        return "text-[#7dff95] bg-[#7dff95]/15";
      case "FAILED":
        return "text-[#ff8080] bg-[#ff8080]/15";
      case "BUILDING":
        return "text-[#ffbc5e] bg-[#ffbc5e]/15";
      case "DOWNLOADING":
      case "UPLOADING_BUILD":
        return "text-[#87d1ff] bg-[#87d1ff]/15";
      case "QUEUED":
      default:
        return "text-[#bed334] bg-[#bed334]/15";
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

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-medium rounded-md ${getBadgeStyle()}`}
    >
      {formatLabel()}
    </span>
  );
}

export default DeploymentStatusBadge;
