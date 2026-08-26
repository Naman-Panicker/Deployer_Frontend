import { useParams, useLocation } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDeploymentStatus } from "@/src/hooks/useDeploymentStatus";
import ErrorDisplay from "@/components/ErrorDisplay";
import { useEffect, useRef, useState } from "react";
import type { DeploymentError } from "@/src/hooks/useDeploymentStatus";

export default function DeploymentStatus() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const repoUrl = (location.state as { repoUrl?: string })?.repoUrl;

  // The upload is complete by the time we navigate here
  // (POST returned successfully before navigation)
  const uploadError: DeploymentError | null = (location.state as { uploadError?: DeploymentError })?.uploadError || null;

  const {
    steps,
    currentStepIndex,
    status,
    error,
    logs,
    isComplete,
    isFailed,
    deployedUrl,
    connectionStatus,
  } = useDeploymentStatus(id, true, uploadError);

  const [copied, setCopied] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (showLogs && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, showLogs]);

  const progressPercent = Math.round(
    (steps.filter((s) => s.status === "complete").length / steps.length) * 100
  );

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 font-mono text-foreground">
      <div className="w-full max-w-lg space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold uppercase tracking-tight">Deployer</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-muted-foreground">
              {status === "deployed"
                ? "Deployment Complete"
                : status === "failed"
                  ? "Deployment Failed"
                  : "Deploying..."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 ${
                connectionStatus === "connected"
                  ? "bg-green-500 animate-pulse"
                  : connectionStatus === "error"
                    ? "bg-destructive"
                    : "bg-muted-foreground animate-pulse"
              }`}
            />
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
              {id}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-border overflow-hidden">
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

        {/* Pipeline stepper */}
        <Card className="w-full border-border bg-card shadow-[6px_6px_0px_0px_var(--primary)]/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest">
              Pipeline
            </CardTitle>
            <CardDescription className="text-[10px] uppercase tracking-[0.15em]">
              {progressPercent}% complete · Step {Math.min(currentStepIndex + 1, steps.length)} of {steps.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {steps.map((step, i) => (
                <div key={step.key} className="flex items-start gap-3 group">
                  {/* Vertical line + icon column */}
                  <div className="flex flex-col items-center">
                    {/* Step icon */}
                    <div
                      className={`relative flex h-7 w-7 shrink-0 items-center justify-center border transition-all duration-500 ${
                        step.status === "complete"
                          ? "border-green-600/50 bg-green-600/10 text-green-600"
                          : step.status === "active"
                            ? "border-primary bg-primary/10 text-primary step-active-glow"
                            : step.status === "failed"
                              ? "border-destructive/50 bg-destructive/10 text-destructive"
                              : "border-border bg-background text-muted-foreground/40"
                      }`}
                    >
                      {step.status === "complete" && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                        </svg>
                      )}
                      {step.status === "active" && (
                        <div className="h-2 w-2 bg-primary animate-pulse" />
                      )}
                      {step.status === "failed" && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                        </svg>
                      )}
                      {step.status === "pending" && (
                        <span className="text-[8px] font-bold">{i + 1}</span>
                      )}
                    </div>
                    {/* Connector line */}
                    {i < steps.length - 1 && (
                      <div
                        className={`w-px h-5 transition-colors duration-500 ${
                          step.status === "complete"
                            ? "bg-green-600/30"
                            : step.status === "failed"
                              ? "bg-destructive/30"
                              : "bg-border"
                        }`}
                      />
                    )}
                  </div>

                  {/* Step content */}
                  <div className="pb-5 pt-1 min-w-0">
                    <p
                      className={`text-[11px] font-bold uppercase tracking-widest transition-colors duration-300 ${
                        step.status === "complete"
                          ? "text-green-600"
                          : step.status === "active"
                            ? "text-foreground"
                            : step.status === "failed"
                              ? "text-destructive"
                              : "text-muted-foreground/50"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p
                      className={`text-[10px] transition-colors duration-300 ${
                        step.status === "active"
                          ? "text-muted-foreground"
                          : "text-muted-foreground/40"
                      }`}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Build logs */}
        {logs.length > 0 && (
          <Card className="w-full border-border bg-card shadow-[6px_6px_0px_0px_var(--primary)]/10">
            <CardHeader className="pb-2">
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="flex w-full items-center justify-between"
              >
                <CardTitle className="text-xs font-bold uppercase tracking-widest">
                  Build Output
                </CardTitle>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  className={`text-muted-foreground transition-transform duration-200 ${showLogs ? "rotate-180" : ""}`}
                >
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="square" />
                </svg>
              </button>
            </CardHeader>
            {showLogs && (
              <CardContent>
                <div className="border border-border bg-[#1a1612] p-3 max-h-72 overflow-y-auto custom-scrollbar">
                  <pre className="text-[10px] leading-relaxed text-[#c4a882] whitespace-pre-wrap break-all">
                    {logs.join("")}
                    <div ref={logEndRef} />
                  </pre>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Success state */}
        {isComplete && deployedUrl && (
          <Card className="w-full border-green-600/30 bg-card shadow-[6px_6px_0px_0px] shadow-green-600/15">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-green-600/30 bg-green-600/10">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-green-600">
                    <path d="M5 10L8.5 13.5L15 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-tight text-green-600">
                    Successfully Deployed
                  </CardTitle>
                  <CardDescription className="text-[10px] uppercase tracking-[0.15em] mt-0.5">
                    Your site is now live
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 border border-border bg-background/30 p-3">
                <code className="text-xs text-foreground flex-1 truncate">
                  {deployedUrl}
                </code>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={handleCopyUrl}
                  className="shrink-0 text-[9px] uppercase tracking-widest"
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <a
                href={deployedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button className="w-full text-[10px] uppercase tracking-[0.3em] font-black py-5">
                  Open Site →
                </Button>
              </a>
            </CardContent>
          </Card>
        )}

        {/* Error state */}
        {isFailed && error && (
          <ErrorDisplay error={error} logs={logs} repoUrl={repoUrl} />
        )}
      </div>
    </div>
  );
}
