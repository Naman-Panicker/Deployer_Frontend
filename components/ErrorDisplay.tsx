import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DeploymentError } from "@/src/hooks/useDeploymentStatus";

type ErrorDisplayProps = {
  error: DeploymentError;
  logs: string[];
  repoUrl?: string;
};

export default function ErrorDisplay({ error, logs, repoUrl }: ErrorDisplayProps) {
  const [showStack, setShowStack] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleCopy = async () => {
    const errorText = [
      `Step: ${error.step}`,
      `Message: ${error.message}`,
      error.stack ? `\nStack Trace:\n${error.stack}` : "",
      error.details ? `\nDetails:\n${error.details}` : "",
      logs.length > 0 ? `\nBuild Logs:\n${logs.join("")}` : "",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(errorText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      console.error("Failed to copy to clipboard");
    }
  };

  const handleRetry = () => {
    navigate("/", { state: { repoUrl } });
  };

  return (
    <Card className="w-full border-destructive/30 bg-card shadow-[6px_6px_0px_0px_var(--destructive)]/15">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {/* Error icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-destructive/30 bg-destructive/10">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-destructive">
              <path d="M10 6v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
              <rect x="9.25" y="13" width="1.5" height="1.5" fill="currentColor" />
              <path d="M8.66 2.5L1.82 14.5a1.5 1.5 0 001.34 2.17h13.68a1.5 1.5 0 001.34-2.17L11.34 2.5a1.5 1.5 0 00-2.68 0z" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </div>
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-destructive">
              Deployment Failed
            </CardTitle>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-0.5">
              Failed at: {error.step}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Error message */}
        <div className="border border-destructive/20 bg-destructive/5 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-destructive/70 mb-1">
            Error Message
          </p>
          <p className="text-xs text-foreground font-medium break-all">
            {error.message}
          </p>
        </div>

        {/* Stack trace (collapsible) */}
        {error.stack && (
          <div>
            <button
              onClick={() => setShowStack(!showStack)}
              className="flex w-full items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors py-1.5"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                className={`transition-transform duration-200 ${showStack ? "rotate-90" : ""}`}
              >
                <path d="M3 1L7 5L3 9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="square" />
              </svg>
              Stack Trace
            </button>
            {showStack && (
              <div className="border border-border bg-foreground/5 p-3 max-h-48 overflow-y-auto custom-scrollbar">
                <pre className="text-[10px] leading-relaxed text-muted-foreground whitespace-pre-wrap break-all">
                  {error.stack}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Build logs (collapsible) */}
        {logs.length > 0 && (
          <div>
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="flex w-full items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors py-1.5"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                className={`transition-transform duration-200 ${showLogs ? "rotate-90" : ""}`}
              >
                <path d="M3 1L7 5L3 9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="square" />
              </svg>
              Build Output ({logs.length} lines)
            </button>
            {showLogs && (
              <div className="border border-border bg-[#1a1612] p-3 max-h-64 overflow-y-auto custom-scrollbar">
                <pre className="text-[10px] leading-relaxed text-[#c4a882] whitespace-pre-wrap break-all">
                  {logs.join("")}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="gap-2 flex-col sm:flex-row">
        <Button
          variant="outline"
          onClick={handleCopy}
          className="w-full text-[10px] uppercase tracking-[0.2em] font-bold"
        >
          {copied ? "Copied!" : "Copy Error Details"}
        </Button>
        {repoUrl && (
          <Button
            onClick={handleRetry}
            className="w-full text-[10px] uppercase tracking-[0.2em] font-bold"
          >
            Retry Deployment
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
