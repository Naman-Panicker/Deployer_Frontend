import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDeploymentStatus } from "@/src/hooks/useDeploymentStatus";
import ErrorDisplay from "@/components/ErrorDisplay";
import { useEffect, useRef, useState, useCallback } from "react";
import type { DeploymentError } from "@/src/hooks/useDeploymentStatus";

export default function DeploymentStatus() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const repoUrl = (location.state as { repoUrl?: string })?.repoUrl;
  const initialError: DeploymentError | null = (location.state as { uploadError?: DeploymentError })?.uploadError || null;

  const handleIdAssigned = useCallback((newId: string) => {
    // Replace URL in browser to /deploy/:newId without reloading
    navigate(`/deploy/${newId}`, { replace: true, state: { repoUrl } });
  }, [navigate, repoUrl]);

  const {
    deploymentId,
    steps,
    currentStepIndex,
    status,
    error,
    logs,
    isComplete,
    isFailed,
    deployedUrl,
    connectionStatus,
  } = useDeploymentStatus(id, repoUrl, initialError, handleIdAssigned);

  const displayId = deploymentId || (id && id !== "init" && id !== "pending" ? id : "INITIALIZING");

  const [copied, setCopied] = useState(false);
  const [showLogs, setShowLogs] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs when open and new logs arrive
  useEffect(() => {
    if (showLogs && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, showLogs]);

  const completedCount = steps.filter((s) => s.status === "complete").length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  const handleCopyUrl = async () => {
    if (!deployedUrl) return;
    try {
      await navigator.clipboard.writeText(deployedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy URL");
    }
  };

  const getStatusText = () => {
    if (status === "deployed") return "Deployment Complete";
    if (status === "failed") return "Deployment Failed";
    if (status === "uploading") return "Uploading & Queuing...";
    return "Deploying Instance...";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:p-8 font-mono text-foreground">
      <div className="w-full max-w-5xl space-y-4">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold uppercase tracking-tight">Deployer</h1>
              <span className="text-xs px-2 py-0.5 border border-border bg-card/60 text-muted-foreground font-semibold">
                PIPELINE
              </span>
            </div>
            <p className="text-[11px] uppercase tracking-[0.2em] font-medium text-muted-foreground mt-0.5">
              {getStatusText()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 border border-border bg-card px-3 py-1.5 shadow-[2px_2px_0px_0px_var(--primary)]/10">
              <div
                className={`h-2.5 w-2.5 ${
                  connectionStatus === "connected"
                    ? "bg-green-500 animate-pulse"
                    : connectionStatus === "error"
                      ? "bg-destructive"
                      : "bg-amber-500 animate-pulse"
                }`}
              />
              <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">
                ID: {displayId}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
              className="text-[10px] uppercase tracking-widest font-bold"
            >
              ← New Deploy
            </Button>
          </div>
        </div>

        {/* Overall Progress bar */}
        <div className="w-full h-2 bg-border/60 overflow-hidden">
          <div
            className={`h-full transition-all duration-700 ease-out ${
              isFailed
                ? "bg-destructive"
                : isComplete
                  ? "bg-green-600"
                  : "bg-primary"
            }`}
            style={{ width: `${isComplete ? 100 : progressPercent}%` }}
          />
        </div>

        {/* Horizontal Pipeline Card */}
        <Card className="w-full border-border bg-card shadow-[6px_6px_0px_0px_var(--primary)]/10">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-xs font-bold uppercase tracking-widest">
                  Deployment Pipeline
                </CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-[0.15em] mt-0.5">
                  {progressPercent}% complete · Step {Math.min(currentStepIndex + 1, steps.length)} of {steps.length}
                </CardDescription>
              </div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                {repoUrl && (
                  <span className="truncate max-w-xs block opacity-70">
                    Repo: {repoUrl.replace("https://github.com/", "")}
                  </span>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 pb-6">
            {/* Horizontal Stepper Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-y-6 gap-x-2 relative">
              {steps.map((step, i) => {
                const isLast = i === steps.length - 1;

                return (
                  <div key={step.key} className="flex flex-col items-center text-center relative group px-1">
                    
                    {/* Horizontal Connector Line (Desktop/Tablet) */}
                    {!isLast && (
                      <div
                        className={`hidden md:block absolute top-4 left-[50%] w-full h-0.5 transition-colors duration-500 z-0 ${
                          step.status === "complete"
                            ? "bg-green-600/60"
                            : step.status === "failed"
                              ? "bg-destructive/40"
                              : "bg-border"
                        }`}
                      />
                    )}

                    {/* Step Icon Node */}
                    <div
                      className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center border transition-all duration-500 bg-background ${
                        step.status === "complete"
                          ? "border-green-600 bg-green-600/10 text-green-600"
                          : step.status === "active"
                            ? "border-primary bg-primary/20 text-primary step-active-glow"
                            : step.status === "failed"
                              ? "border-destructive bg-destructive/15 text-destructive"
                              : "border-border text-muted-foreground/50"
                      }`}
                    >
                      {step.status === "complete" && (
                        <div className="h-2.5 w-2.5 rounded-full bg-green-600" />
                      )}
                      {step.status === "active" && (
                        <div className="h-2.5 w-2.5 bg-primary animate-pulse" />
                      )}
                      {step.status === "failed" && (
                        <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                          <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
                        </svg>
                      )}
                      {step.status === "pending" && (
                        <span className="text-[10px] font-bold">{i + 1}</span>
                      )}
                    </div>

                    {/* Step Labels */}
                    <div className="mt-2.5 space-y-0.5 max-w-full">
                      <p
                        className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 truncate ${
                          step.status === "complete"
                            ? "text-green-600"
                            : step.status === "active"
                              ? "text-foreground font-black"
                              : step.status === "failed"
                                ? "text-destructive"
                                : "text-muted-foreground/50"
                        }`}
                        title={step.label}
                      >
                        {step.label}
                      </p>
                      <p className="text-[8px] uppercase tracking-wider text-muted-foreground/60 hidden sm:block">
                        {step.status === "complete"
                          ? "Done"
                          : step.status === "active"
                            ? "Active..."
                            : step.status === "failed"
                              ? "Failed"
                              : `Step ${i + 1}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Embedded Live Website Link (Shown inside Pipeline Card when complete) */}
            {isComplete && deployedUrl && (
              <div className="mt-8 pt-5 border-t border-green-600/30 bg-green-600/5 -mx-4 -mb-6 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-green-600/50 bg-green-600/20 text-green-600">
                      <div className="h-3 w-3 rounded-full bg-green-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-black uppercase tracking-wider text-green-600">
                          Site Is Live & Deployed
                        </p>
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-ping" />
                      </div>
                      <p className="text-[10px] font-mono text-foreground/80 mt-0.5 truncate max-w-sm sm:max-w-md">
                        {deployedUrl}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyUrl}
                      className="text-[10px] uppercase tracking-widest font-bold border-green-600/40 text-foreground hover:bg-green-600/10"
                    >
                      {copied ? "Copied!" : "Copy Link"}
                    </Button>
                    <a
                      href={deployedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      <Button
                        size="sm"
                        className="text-[10px] uppercase tracking-[0.2em] font-black bg-green-600 text-white hover:bg-green-700"
                      >
                        Open Website ↗
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Details Component (Underneath the Horizontal Pipeline) */}
        {isFailed && error && (
          <div className="w-full">
            <ErrorDisplay error={error} logs={logs} repoUrl={repoUrl} />
          </div>
        )}

        {/* Live Build Output Logs Component (Underneath the Horizontal Pipeline) */}
        {logs.length > 0 && !isFailed && (
          <Card className="w-full border-border bg-card shadow-[6px_6px_0px_0px_var(--primary)]/10">
            <CardHeader className="pb-2 border-b border-border/40">
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="flex w-full items-center justify-between hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-primary" />
                  <CardTitle className="text-xs font-bold uppercase tracking-widest">
                    Build Output Logs
                  </CardTitle>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    ({logs.length} lines)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span>{showLogs ? "Hide" : "Show"}</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    className={`transition-transform duration-200 ${showLogs ? "rotate-180" : ""}`}
                  >
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="square" />
                  </svg>
                </div>
              </button>
            </CardHeader>
            {showLogs && (
              <CardContent className="pt-3">
                <div className="border border-border bg-[#14120e] p-3.5 max-h-80 overflow-y-auto custom-scrollbar font-mono">
                  <pre className="text-[10px] leading-relaxed text-[#d4b996] whitespace-pre-wrap break-all">
                    {logs.join("")}
                    <div ref={logEndRef} />
                  </pre>
                </div>
              </CardContent>
            )}
          </Card>
        )}

      </div>
    </div>
  );
}
