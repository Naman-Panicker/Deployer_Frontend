import { useState, useEffect, useRef } from "react";
import axios from "axios";

export type StepStatus = "pending" | "active" | "complete" | "failed";

export type PipelineStep = {
  key: string;
  label: string;
  shortLabel: string;
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
  deploymentId: string | null;
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
  { key: "CLONING", label: "Cloning", shortLabel: "Clone", description: "Cloning git repository" },
  { key: "UPLOADING_SOURCE", label: "Uploading Source", shortLabel: "Upload", description: "Uploading source to S3" },
  { key: "QUEUED", label: "Queued", shortLabel: "Queue", description: "Queued in SQS" },
  { key: "DOWNLOADING", label: "Downloading", shortLabel: "Download", description: "Downloading source from S3" },
  { key: "BUILDING", label: "Building", shortLabel: "Build", description: "Building project (install & build)" },
  { key: "UPLOADING_BUILD", label: "Uploading Build", shortLabel: "Deploy", description: "Uploading build artifacts" },
  { key: "DEPLOYED", label: "Deployed", shortLabel: "Live", description: "Site is live" },
];

const STATUS_TO_STEP_INDEX: Record<string, number> = {
  QUEUED: 2,
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

function getInitialState(
  initialId: string | undefined,
  repoUrl: string | undefined,
  initialError: DeploymentError | null
): DeploymentState {
  if (initialError) {
    const failedIndex = PIPELINE_STEPS.findIndex(s => s.key === initialError.step);
    const idx = failedIndex >= 0 ? failedIndex : 0;
    return {
      deploymentId: initialId && initialId !== "init" ? initialId : null,
      steps: buildSteps(idx, true),
      currentStepIndex: idx,
      status: "failed",
      error: initialError,
      logs: [],
      isComplete: false,
      isFailed: true,
      deployedUrl: null,
      connectionStatus: "disconnected",
    };
  }

  const isKnownId = initialId && initialId !== "init" && initialId !== "pending";

  if (isKnownId) {
    return {
      deploymentId: initialId,
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

  if (repoUrl) {
    return {
      deploymentId: null,
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
    deploymentId: null,
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
  initialId: string | undefined,
  repoUrl: string | undefined,
  initialError: DeploymentError | null,
  onIdAssigned?: (newId: string) => void
): DeploymentState {
  const [state, setState] = useState<DeploymentState>(() =>
    getInitialState(initialId, repoUrl, initialError)
  );

  const [activeId, setActiveId] = useState<string | null>(() => {
    return initialId && initialId !== "init" && initialId !== "pending" ? initialId : null;
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const logsRef = useRef<string[]>([]);
  const isTerminalRef = useRef<boolean>(false);
  const uploadInitiatedRef = useRef<boolean>(false);

  // Phase 1: Upload Trigger (if starting fresh from repoUrl)
  useEffect(() => {
    if (activeId || !repoUrl || uploadInitiatedRef.current || initialError) return;

    uploadInitiatedRef.current = true;

    // Simulate stepping during upload phase
    const t1 = setTimeout(() => {
      setState(prev => (prev.status === "uploading" ? { ...prev, steps: buildSteps(1, false), currentStepIndex: 1 } : prev));
    }, 2000);

    const t2 = setTimeout(() => {
      setState(prev => (prev.status === "uploading" ? { ...prev, steps: buildSteps(2, false), currentStepIndex: 2 } : prev));
    }, 5000);

    axios.post("http://localhost:3000/api/v1/upload", { url: repoUrl })
      .then((res) => {
        const newId = res.data?.id;
        if (newId) {
          setActiveId(newId);
          onIdAssigned?.(newId);
          setState(prev => ({
            ...prev,
            deploymentId: newId,
            steps: buildSteps(3, false),
            currentStepIndex: 3,
            status: "deploying",
            connectionStatus: "connecting",
          }));
        }
      })
      .catch((err: unknown) => {
        clearTimeout(t1);
        clearTimeout(t2);
        let errorObj: DeploymentError = {
          step: "CLONING",
          message: "Failed to upload and queue deployment repository",
        };

        if (axios.isAxiosError(err)) {
          const errData = err.response?.data?.error;
          if (errData) {
            errorObj = errData;
          } else {
            errorObj.message = err.message || "Failed to connect to upload service on port 3000";
          }
        } else if (err instanceof Error) {
          errorObj.message = err.message;
        }

        const failedIdx = PIPELINE_STEPS.findIndex(s => s.key === errorObj.step);
        const idx = failedIdx >= 0 ? failedIdx : 0;

        setState(prev => ({
          ...prev,
          steps: buildSteps(idx, true),
          currentStepIndex: idx,
          status: "failed",
          error: errorObj,
          isFailed: true,
          connectionStatus: "disconnected",
        }));
      });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [activeId, repoUrl, initialError, onIdAssigned]);

  // Phase 2: Deploy Tracking (SSE + interval polling fallback once activeId is known)
  useEffect(() => {
    if (!activeId) return;

    isTerminalRef.current = false;
    const deployStatusUrl = `http://localhost:3002/api/v1/status/${activeId}`;

    const handleStatusPayload = (data: {
      status: string;
      message?: string;
      logs?: string | string[];
      error?: DeploymentError;
    }) => {
      const { status, message, logs: logData, error } = data;

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
          deploymentId: activeId,
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
          deploymentId: activeId,
          steps: buildSteps(7, false),
          currentStepIndex: 6,
          status: "deployed",
          logs: [...logsRef.current],
          isComplete: true,
          deployedUrl: `http://${activeId}.localhost:3001`,
          connectionStatus: "connected",
        }));
        return;
      }

      const stepIndex = STATUS_TO_STEP_INDEX[status];
      if (stepIndex !== undefined && stepIndex >= 0) {
        setState(prev => ({
          ...prev,
          deploymentId: activeId,
          steps: buildSteps(stepIndex, false),
          currentStepIndex: stepIndex,
          status: "deploying",
          logs: [...logsRef.current],
          connectionStatus: "connected",
        }));
      }
    };

    // EventSource
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

    // Polling fallback every 1.5s
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
  }, [activeId]);

  return state;
}
