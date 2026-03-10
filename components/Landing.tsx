import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import axios from "axios";

export default function Landing() {
  const [repoLink, setRepoLink] = useState("");

  const handleDeploy = () => {
    if (!repoLink) return;
    console.log("Deploying:", repoLink);
    // In a real app, this would call the backend

    axios.post("http://localhost:3000/api/v1/upload", {
        "url": repoLink
      }).then((res) => {
        alert(`Deployment of repo: ${repoLink}\n Deployed with ID: ${res.data.id}`);
      }).catch((err) => {
        alert(`Deployment request failed for: ${repoLink}`);
      })
    
    
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRepoLink(e.target.value)}
              className="bg-background/30 border-border focus-visible:ring-primary/20 text-xs"
            />
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <Button 
            onClick={handleDeploy}
            disabled={!repoLink}
            className="w-full py-5 text-[10px] uppercase tracking-[0.3em] font-black"
          >
            Deploy Instance
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}