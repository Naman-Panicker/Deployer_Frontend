import { useState } from "react";
import { Button } from "@/components/ui/button";

interface WebhookSetupProps {
  projectId: string;
  branch: string;
}

export function WebhookSetup({ projectId, branch }: WebhookSetupProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedContentType, setCopiedContentType] = useState(false);

  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:9000";
  const webhookUrl = `${baseUrl}/api/projects/${projectId}/webhook`;
  const contentType = "application/json";

  const copyToClipboard = async (text: string, setFn: (val: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setFn(true);
      setTimeout(() => setFn(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4 text-xs">
      <p className="text-muted-foreground leading-relaxed text-[11px]">
        Configure a webhook on GitHub to automatically trigger a new deployment whenever code is pushed to your project repository.
      </p>

      {/* Payload URL Box */}
      <div className="space-y-1.5">
        <label className="font-medium text-foreground block">
          Payload URL
        </label>
        <div className="flex items-center gap-1.5">
          <div className="flex-1 overflow-x-auto border border-input/60 bg-card p-2 font-mono text-[11px] select-all truncate rounded-md">
            {webhookUrl}
          </div>
          <Button
            variant="outline"
            size="xs"
            onClick={() => copyToClipboard(webhookUrl, setCopiedUrl)}
            className="shrink-0 text-[11px]"
          >
            {copiedUrl ? "Copied!" : "Copy URL"}
          </Button>
        </div>
      </div>

      {/* Content Type Box */}
      <div className="space-y-1.5">
        <label className="font-medium text-foreground block">
          Content type
        </label>
        <div className="flex items-center gap-1.5">
          <div className="flex-1 border border-input/60 bg-card p-2 font-mono text-[11px] rounded-md">
            {contentType}
          </div>
          <Button
            variant="outline"
            size="xs"
            onClick={() => copyToClipboard(contentType, setCopiedContentType)}
            className="shrink-0 text-[11px]"
          >
            {copiedContentType ? "Copied!" : "Copy"}
          </Button>
        </div>
      </div>

      {/* Step by step checklist */}
      <div className="border border-border/60 bg-card/60 p-3.5 space-y-2 rounded-xl">
        <span className="font-semibold text-foreground block">
          Setup Instructions for GitHub:
        </span>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-[11px] leading-relaxed">
          <li>Open your repository on GitHub.</li>
          <li>Go to <strong className="text-foreground">Settings</strong> &rarr; <strong className="text-foreground">Webhooks</strong> &rarr; <strong className="text-foreground">Add webhook</strong>.</li>
          <li>Paste the <strong className="text-foreground">Payload URL</strong> from above.</li>
          <li>Select <strong className="text-foreground">application/json</strong> as the Content type.</li>
          <li>Select <strong className="text-foreground">&quot;Just the push event&quot;</strong>.</li>
          <li>Click <strong className="text-foreground">Add webhook</strong>.</li>
        </ol>
      </div>

      <p className="text-[11px] text-muted-foreground">
        When push events occur on <span className="font-mono text-foreground font-semibold">{branch || "main"}</span>, Deployer will automatically queue a new deployment with the incoming commit hash.
      </p>
    </div>
  );
}

export default WebhookSetup;
