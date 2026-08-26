import { useState, useEffect, useRef } from "react";
import axios from "axios";

export type StepStatus = "pending" | "active" | "complete" | "failed";

export type PipelineStep = {
  key: string;
  label: string;
  description: string;
  status: StepStatus;
};

export type DeploymentError = {
  step: string;
  message: string;
  stack?: string;
  details?: string;
};

export type DeploymentState = {
  steps: PipelineStep[];
  currentStepIndex: number;
  status: "idle" | "uploading" | "deploying" | "deployed" | "failed";
  error: DeploymentError | null;
  logs: string[];
  isComplete: boolean;
  isFailed: boolean;
  deployedUrl: string | null;
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
};

// Exact 7 execution steps matching the actual backend pipeline
export const PIPELINE_STEPS: Omit<PipelineStep, "status">[] = [
  { key: "CLONING", label: "Cloning", description: "Cloning the Git repository" },
  { key: "UPLOADING_SOURCE", label: "Uploading Source", description: "Uploading source files to S3" },
  { key: "QUEUED", label: "Queued", description: "Deployment queued" },
  { key: "DOWNLOADING", label: "Downloading", description: "Downloading source from S3" },
  { key: "BUILDING", label: "Building", description: "Building project (npm install & build)" },
  { key: "UPLOADING_BUILD", label: "Uploading Build", description: "Uploading build artifacts" },
  { key: "DEPLOYED", label: "Deployed", description: "Site is live" },
];

const STATUS_TO_STEP_INDEX: Record<string, number> = {
  QUEUED: 3,
  DOWNLOADING: 3,
  BUILDING: 4,
  UPLOADING_BUILD: 5,
  DEPLOYED: 6,
  FAILED: -1,
};

function buildSteps(activeIndex: number, failed: boolean): PipelineStep[] {
  return PIPELINE_STEPS.map((step, i) => {
    let status: StepStatus = "pending";
    if (failed && i === activeIndex) {
      status = "failed";
    } else if (i < activeIndex) {
      status = "complete";
    } else if (i === activeIndex) {
      status = "active";
    }
    return { ...step, status };
  });
}

function getInitialDeploymentState(
  id: string | undefined,
  uploadComplete: boolean,
  uploadError: DeploymentError | null
): DeploymentState {
  if (uploadError) {
    const failedIndex = PIPELINE_STEPS.findIndex(s => s.key === uploadError.step);
    const idx = failedIndex >= 0 ? failedIndex : 0;
    return {
      steps: buildSteps(idx, true),
      currentStepIndex: idx,
      status: "failed",
      error: uploadError,
      logs: [],
      isComplete: false,
      isFailed: true,
      deployedUrl: null,
      connectionStatus: "disconnected",
    };
  }

  if (id && uploadComplete) {
    return {
      steps: buildSteps(3, false),
      currentStepIndex: 3,
      status: "deploying",
      error: null,
      logs: [],
      isComplete: false,
      isFailed: false,
      deployedUrl: null,
      connectionStatus: "connecting",
    };
  }

  if (id) {
    return {
      steps: buildSteps(0, false),
      currentStepIndex: 0,
      status: "uploading",
      error: null,
      logs: [],
      isComplete: false,
      isFailed: false,
      deployedUrl: null,
      connectionStatus: "connecting",
    };
  }

  return {
    steps: buildSteps(0, false),
    currentStepIndex: 0,
    status: "idle",
    error: null,
    logs: [],
    isComplete: false,
    isFailed: false,
    deployedUrl: null,
    connectionStatus: "connecting",
  };
}

export function useDeploymentStatus(
  id: string | undefined,
  uploadComplete: boolean,
  uploadError: DeploymentError | null
): DeploymentState {
  const [state, setState] = useState<DeploymentState>(() =>
    getInitialDeploymentState(id, uploadComplete, uploadError)
  );

  const eventSourceRef = useRef<EventSource | null>(null);
  const logsRef = useRef<string[]>([]);
  const isTerminalRef = useRef<boolean>(false);

  // Track upload phase progress (steps 0-2 handled by POST lifecycle)
  useEffect(() => {
    if (!id || uploadError || uploadComplete) return;

    const t1 = setTimeout(() => {
      setState(prev => {
        if (prev.status !== "uploading") return prev;
        return {
          ...prev,
          steps: buildSteps(1, false),
          currentStepIndex: 1,
        };
      });
    }, 2000);

    const t2 = setTimeout(() => {
      setState(prev => {
        if (prev.status !== "uploading") return prev;
        return {
          ...prev,
          steps: buildSteps(2, false),
          currentStepIndex: 2,
        };
      });
    }, 5000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [id, uploadComplete, uploadError]);

  // Connect SSE + polling fallback for deployment progress
  useEffect(() => {
    if (!id || !uploadComplete || uploadError) return;

    isTerminalRef.current = false;
    const deployStatusUrl = `http://localhost:3002/api/v1/status/${id}`;

    const handleStatusPayload = (data: {
      status: string;
      message?: string;
      logs?: string | string[];
      error?: DeploymentError;
    }) => {
      const { status, message, logs: logData, error } = data;

      // Accumulate logs
      if (typeof logData === "string") {
        logsRef.current = [...logsRef.current, logData];
      } else if (Array.isArray(logData) && logData.length > 0) {
        logsRef.current = logData;
      }

      if (status === "FAILED") {
        isTerminalRef.current = true;
        const failedStepIndex =
          STATUS_TO_STEP_INDEX[error?.step ?? ""] ??
          (PIPELINE_STEPS.findIndex(s => s.key === error?.step) >= 0
            ? PIPELINE_STEPS.findIndex(s => s.key === error?.step)
            : 3);

        setState(prev => ({
          ...prev,
          steps: buildSteps(failedStepIndex >= 0 ? failedStepIndex : prev.currentStepIndex, true),
          currentStepIndex: failedStepIndex >= 0 ? failedStepIndex : prev.currentStepIndex,
          status: "failed",
          error: error || { step: "UNKNOWN", message: message || "Deployment failed" },
          logs: [...logsRef.current],
          isFailed: true,
          connectionStatus: "connected",
        }));
        return;
      }

      if (status === "DEPLOYED") {
        isTerminalRef.current = true;
        setState(prev => ({
          ...prev,
          steps: buildSteps(7, false), // All steps completed
          currentStepIndex: 6,
          status: "deployed",
          logs: [...logsRef.current],
          isComplete: true,
          deployedUrl: `http://${id}.localhost:3001`,
          connectionStatus: "connected",
        }));
        return;
      }

      const stepIndex = STATUS_TO_STEP_INDEX[status];
      if (stepIndex !== undefined && stepIndex >= 0) {
        setState(prev => ({
          ...prev,
          steps: buildSteps(stepIndex, false),
          currentStepIndex: stepIndex,
          status: "deploying",
          logs: [...logsRef.current],
          connectionStatus: "connected",
        }));
      }
    };

    // 1. Setup EventSource
    let es: EventSource | null = null;
    try {
      es = new EventSource(deployStatusUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        setState(prev => ({ ...prev, connectionStatus: "connected" }));
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleStatusPayload(data);
          if (isTerminalRef.current && es) {
            es.close();
          }
        } catch (e) {
          console.error("Failed to parse SSE event:", e);
        }
      };

      es.onerror = () => {
        // Fallback polling will handle updates
      };
    } catch {
      // EventSource failed to initialize
    }

    // 2. Setup interval polling fallback
    const pollStatus = async () => {
      if (isTerminalRef.current) return;
      try {
        const res = await axios.get(deployStatusUrl, {
          headers: { Accept: "application/json" },
          timeout: 4000,
        });
        if (res.data && res.data.status) {
          handleStatusPayload(res.data);
          setState(prev => ({ ...prev, connectionStatus: "connected" }));
        }
      } catch {
        if (!isTerminalRef.current && (!es || es.readyState !== EventSource.OPEN)) {
          setState(prev => ({ ...prev, connectionStatus: "error" }));
        }
      }
    };

    // Run immediate check and then poll every 1.5s
    pollStatus();
    const pollInterval = setInterval(() => {
      if (isTerminalRef.current) {
        clearInterval(pollInterval);
        return;
      }
      pollStatus();
    }, 1500);

    return () => {
      clearInterval(pollInterval);
      if (es) {
        es.close();
      }
      eventSourceRef.current = null;
    };
  }, [id, uploadComplete, uploadError]);

  return state;
}
