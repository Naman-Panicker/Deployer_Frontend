import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

export default function Landing() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefillUrl = (location.state as { repoUrl?: string })?.repoUrl || "";

  const [repoLink, setRepoLink] = useState(prefillUrl);
  const [isDeploying, setIsDeploying] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const handleDeploy = async () => {
    if (!repoLink) return;
    setIsDeploying(true);
    setInlineError(null);

    try {
      const res = await axios.post("http://localhost:3000/api/v1/upload", {
        url: repoLink,
      });

      const { id } = res.data;
      // Navigate to the deployment status page
      navigate(`/deploy/${id}`, { state: { repoUrl: repoLink } });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorData = err.response?.data?.error;
        if (errorData) {
          // Server returned structured error — navigate to deploy page with error state
          const fakeId = `error-${Date.now()}`;
          navigate(`/deploy/${fakeId}`, {
            state: {
              repoUrl: repoLink,
              uploadError: errorData,
            },
          });
          return;
        }
        setInlineError(
          err.message || "Failed to connect to deployment server"
        );
      } else if (err instanceof Error) {
        setInlineError(err.message);
      } else {
        setInlineError("Failed to connect to deployment server");
      }
      setIsDeploying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 font-mono text-foreground">
      <Card className="w-full max-w-sm border-border bg-card shadow-[6px_6px_0px_0px_var(--primary)]/10">
        <CardHeader className="space-y-1.5 pb-4">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle className="text-lg font-bold uppercase tracking-tight">
                DEPLOYER
              </CardTitle>
              <CardDescription className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-70">
                Automated Deployment
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label 
              htmlFor="repo-link" 
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
            >
              Repository URL
            </label>
            <Input
              id="repo-link"
              type="url"
              placeholder="https://github.com/user/project"
              value={repoLink}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setRepoLink(e.target.value);
                setInlineError(null);
              }}
              className="bg-background/30 border-border focus-visible:ring-primary/20 text-xs"
              disabled={isDeploying}
            />
          </div>
          {inlineError && (
            <div className="border border-destructive/30 bg-destructive/5 p-2.5">
              <p className="text-[10px] text-destructive font-medium">
                {inlineError}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-2">
          <Button 
            onClick={handleDeploy}
            disabled={!repoLink || isDeploying}
            className="w-full py-5 text-[10px] uppercase tracking-[0.3em] font-black"
          >
            {isDeploying ? (
              <span className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 bg-primary-foreground animate-pulse" />
                Deploying...
              </span>
            ) : (
              "Deploy Instance"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}