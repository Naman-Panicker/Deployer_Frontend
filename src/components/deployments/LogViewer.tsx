import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LogEntry } from "@/src/types";

interface LogViewerProps {
  logs: LogEntry[];
  isLoading: boolean;
  isPolling: boolean;
  error: string | null;
}

export function LogViewer({ logs, isLoading, isPolling, error }: LogViewerProps) {
  const [filterText, setFilterText] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredLogs = useMemo(() => {
    if (!filterText.trim()) return logs;
    const q = filterText.toLowerCase();
    return logs.filter(
      (log) =>
        log.line.toLowerCase().includes(q) ||
        log.stream.toLowerCase().includes(q)
    );
  }, [logs, filterText]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  const handleCopyLogs = async () => {
    const rawText = logs.map((l) => `[${l.timestamp}] [${l.stream}] ${l.line}`).join("\n");
    try {
      await navigator.clipboard.writeText(rawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="border border-border bg-card flex flex-col h-[600px] overflow-hidden">
      {/* Top Console Bar */}
      <div className="border-b border-border bg-muted/40 p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold">Console Output</span>
          {isPolling ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono border border-border text-foreground bg-muted/30">
              <span className="w-1.5 h-1.5 rounded-none bg-primary opacity-80" />
              POLLING (2s)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono border border-border text-muted-foreground bg-muted/20">
              <span className="w-1.5 h-1.5 rounded-none bg-muted-foreground" />
              IDLE
            </span>
          )}
          <span className="text-muted-foreground text-[11px]">
            {filteredLogs.length} / {logs.length} lines
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Filter logs..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="h-7 w-40 sm:w-48 text-xs font-mono"
          />

          <Button
            variant={autoScroll ? "default" : "outline"}
            size="xs"
            onClick={() => setAutoScroll((prev) => !prev)}
            title="Toggle automatic scroll to bottom"
          >
            Auto-scroll: {autoScroll ? "ON" : "OFF"}
          </Button>

          <Button
            variant="outline"
            size="xs"
            onClick={handleCopyLogs}
            disabled={logs.length === 0}
          >
            {copied ? "Copied!" : "Copy All"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="border-b border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Terminal View Body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-black p-4 font-mono text-xs leading-relaxed text-zinc-300 select-text"
      >
        {isLoading && logs.length === 0 ? (
          <div className="text-zinc-500 py-4 text-center">
            Initializing log stream...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-zinc-500 py-4 text-center">
            No logs recorded yet. Build output will appear here in real time.
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-zinc-500 py-4 text-center">
            No log lines matched &quot;{filterText}&quot;.
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredLogs.map((log, index) => {
              const timeStr = log.timestamp
                ? new Date(log.timestamp).toLocaleTimeString()
                : "";
              const isErrorStream = log.stream === "stderr";

              return (
                <div
                  key={index}
                  className={`flex items-start gap-2 hover:bg-zinc-900/60 px-1 py-0.5 ${
                    isErrorStream ? "text-red-400 bg-red-950/20" : "text-zinc-300"
                  }`}
                >
                  {timeStr && (
                    <span className="text-zinc-600 select-none text-[10px] shrink-0 pt-0.5">
                      {timeStr}
                    </span>
                  )}
                  <span
                    className={`select-none text-[10px] font-bold shrink-0 pt-0.5 ${
                      isErrorStream ? "text-red-500" : "text-zinc-500"
                    }`}
                  >
                    [{log.stream}]
                  </span>
                  <span className="break-all whitespace-pre-wrap flex-1">
                    {log.line}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default LogViewer;
