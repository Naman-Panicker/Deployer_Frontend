import { useState, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/src/lib/utils";
import { parseGitRepo, fetchGitHubBranches } from "@/src/lib/git";
import type { Project } from "@/src/types";

interface ProjectFormProps {
  initialData?: Partial<Project>;
  onSubmit: (data: {
    name: string;
    repoUrl: string;
    subdomain: string;
    branch?: string;
  }) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isEdit?: boolean;
}

type RepoAccessStatus = "idle" | "checking" | "verified" | "error" | "manual";

export function ProjectForm({
  initialData,
  onSubmit,
  isLoading,
  error,
  isEdit = false,
}: ProjectFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [repoUrl, setRepoUrl] = useState(initialData?.repoUrl || "");
  const [subdomain, setSubdomain] = useState(initialData?.subdomain || "");
  const [branch, setBranch] = useState(initialData?.branch || "main");
  const [isSubdomainManual, setIsSubdomainManual] = useState(isEdit);

  // Repository access verification state
  const [repoAccessStatus, setRepoAccessStatus] = useState<RepoAccessStatus>(
    isEdit && initialData?.repoUrl ? "verified" : "idle"
  );
  const [branches, setBranches] = useState<string[]>(
    isEdit && initialData?.branch ? [initialData.branch] : []
  );
  const [repoError, setRepoError] = useState<string | null>(null);
  const [githubToken, setGithubToken] = useState("");
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [lastVerifiedUrl, setLastVerifiedUrl] = useState(initialData?.repoUrl || "");

  // When initialData changes (e.g. project loaded), sync fields
  useEffect(() => {
    if (initialData) {
      if (initialData.name) setName(initialData.name);
      if (initialData.repoUrl) {
        setRepoUrl(initialData.repoUrl);
        setLastVerifiedUrl(initialData.repoUrl);
      }
      if (initialData.subdomain) setSubdomain(initialData.subdomain);
      if (initialData.branch) {
        setBranch(initialData.branch);
        setBranches((prev) => (prev.includes(initialData.branch!) ? prev : [initialData.branch!, ...prev]));
      }
      if (initialData.repoUrl && isEdit) {
        setRepoAccessStatus("verified");
        // Verify in background to populate all remote branches
        verifyRepo(initialData.repoUrl, initialData.branch);
      }
    }
  }, [initialData, isEdit]);

  const verifyRepo = async (
    targetUrl: string,
    targetBranch?: string,
    tokenOverride?: string
  ) => {
    const trimmed = targetUrl.trim();
    if (!trimmed) {
      setRepoAccessStatus("idle");
      setRepoError(null);
      return;
    }

    const parsed = parseGitRepo(trimmed);
    if (!parsed) {
      setRepoAccessStatus("error");
      setRepoError(
        "Invalid or non-GitHub repository URL. Automatic branch discovery is supported for GitHub. Switch to manual branch override below."
      );
      return;
    }

    setRepoAccessStatus("checking");
    setRepoError(null);

    try {
      const { branches: remoteBranches, defaultBranchCandidate } = await fetchGitHubBranches(
        parsed.owner,
        parsed.repo,
        tokenOverride || githubToken
      );

      setBranches(remoteBranches);
      setRepoAccessStatus("verified");
      setLastVerifiedUrl(trimmed);
      setRepoError(null);

      // Auto-populate project name & subdomain if currently blank and not in edit mode
      if (!isEdit) {
        if (!name.trim()) {
          setName(parsed.repo);
          if (!isSubdomainManual) {
            setSubdomain(slugify(parsed.repo));
          }
        }
      }

      // Select candidate branch
      const activeBranch = targetBranch || branch;
      if (activeBranch && remoteBranches.includes(activeBranch)) {
        setBranch(activeBranch);
      } else {
        setBranch(defaultBranchCandidate);
      }
    } catch (err: unknown) {
      setRepoAccessStatus("error");
      const message = err instanceof Error ? err.message : "Failed to access repository";
      setRepoError(message);
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSubdomainManual && !isEdit) {
      setSubdomain(slugify(val));
    }
  };

  const handleSubdomainChange = (val: string) => {
    setIsSubdomainManual(true);
    setSubdomain(slugify(val));
  };

  const handleRepoUrlChange = (val: string) => {
    setRepoUrl(val);
    // If URL was altered after verification, reset access status
    if (val.trim() !== lastVerifiedUrl.trim()) {
      if (repoAccessStatus === "verified") {
        setRepoAccessStatus("idle");
      }
    }
  };

  const handleRepoUrlBlur = () => {
    const trimmed = repoUrl.trim();
    if (trimmed && trimmed !== lastVerifiedUrl.trim()) {
      verifyRepo(trimmed, branch);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !repoUrl.trim() || !subdomain.trim()) return;
    if (repoAccessStatus !== "verified" && repoAccessStatus !== "manual") return;

    await onSubmit({
      name: name.trim(),
      repoUrl: repoUrl.trim(),
      subdomain: subdomain.trim(),
      branch: branch.trim() || "main",
    });
  };

  const isFormLocked = repoAccessStatus !== "verified" && repoAccessStatus !== "manual";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Project Name */}
      <div className="space-y-1.5">
        <Label htmlFor="project-name">Project Name</Label>
        <Input
          id="project-name"
          placeholder="my-cool-app"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      {/* Git Repository URL with Access Verification */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="project-repo">Git Repository URL</Label>
          {repoAccessStatus === "verified" && (
            <span className="font-mono text-[10px] text-primary">
              [ACCESS CONFIRMED]
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            id="project-repo"
            type="url"
            placeholder="https://github.com/owner/repository"
            value={repoUrl}
            onChange={(e) => handleRepoUrlChange(e.target.value)}
            onBlur={handleRepoUrlBlur}
            required
            disabled={isLoading}
            className="font-mono text-xs"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading || repoAccessStatus === "checking" || !repoUrl.trim()}
            onClick={() => verifyRepo(repoUrl, branch, githubToken)}
            className="shrink-0 font-mono text-xs"
          >
            {repoAccessStatus === "checking" ? "Verifying..." : "Verify Access"}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Public GitHub or Git repository containing your application code.
        </p>
      </div>

      {/* Branch Section: Visible only when repo access is received */}
      {repoAccessStatus === "idle" && (
        <div className="border border-dashed border-border bg-muted/10 p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-muted-foreground">
              Default Branch: [AWAITING REPOSITORY ACCESS]
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              Locked
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Branch selection is locked until repository access is verified. Enter a repository URL above and click Verify Access.
          </p>
        </div>
      )}

      {repoAccessStatus === "checking" && (
        <div className="border border-border bg-muted/30 p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-foreground animate-pulse">
              Default Branch: [VERIFYING REPOSITORY ACCESS...]
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground font-mono">
            Contacting Git remote and discovering available branches...
          </p>
        </div>
      )}

      {repoAccessStatus === "error" && (
        <div className="border border-destructive/40 bg-destructive/10 p-3 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-xs font-semibold text-destructive">
                [ACCESS FAILED / REPO UNREACHABLE]
              </span>
              <p className="mt-1 text-[11px] text-destructive/90 font-mono">
                {repoError}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-destructive/20 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowTokenInput(!showTokenInput)}
              className="text-[11px] underline text-muted-foreground hover:text-foreground font-mono"
            >
              {showTokenInput ? "Hide Token Input" : "Private Repo? Add Token"}
            </button>
            <button
              type="button"
              onClick={() => setRepoAccessStatus("manual")}
              className="text-[11px] font-semibold underline text-foreground hover:text-foreground/80 font-mono"
            >
              Manual Branch Override &rarr;
            </button>
          </div>

          {showTokenInput && (
            <div className="pt-2 space-y-1.5">
              <Label htmlFor="github-token" className="text-[10px] text-muted-foreground">
                GitHub Personal Access Token (PAT):
              </Label>
              <div className="flex gap-2">
                <Input
                  id="github-token"
                  type="password"
                  placeholder="ghp_..."
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  className="text-xs h-7 font-mono"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs font-mono shrink-0"
                  onClick={() => verifyRepo(repoUrl, branch, githubToken)}
                >
                  Retry with Token
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {repoAccessStatus === "verified" && (
        <div className="space-y-1.5 border border-border bg-card p-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="project-branch" className="text-xs font-semibold">
              Default Branch
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground font-mono">
                [{branches.length} BRANCH{branches.length > 1 ? "ES" : ""} FOUND]
              </span>
              <button
                type="button"
                onClick={() => verifyRepo(repoUrl, branch, githubToken)}
                className="text-[10px] text-primary underline hover:text-foreground font-mono"
              >
                Refresh
              </button>
            </div>
          </div>

          <select
            id="project-branch"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            disabled={isLoading}
            className="h-8 w-full rounded-none border border-input bg-background px-2.5 py-1 text-xs font-mono text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-muted-foreground">
            Target branch deployed when triggering build workflows.
          </p>
        </div>
      )}

      {repoAccessStatus === "manual" && (
        <div className="space-y-1.5 border border-dashed border-border bg-muted/10 p-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="project-branch-manual" className="text-xs font-semibold">
              Default Branch (Manual Specification)
            </Label>
            <button
              type="button"
              onClick={() => verifyRepo(repoUrl, branch, githubToken)}
              className="text-[10px] underline text-muted-foreground hover:text-foreground font-mono"
            >
              Try Auto-Detect &rarr;
            </button>
          </div>
          <Input
            id="project-branch-manual"
            placeholder="main"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            disabled={isLoading}
            className="font-mono text-xs"
          />
          <p className="text-[11px] text-muted-foreground">
            Manual branch override active. Ensure this branch exists on your remote Git repository.
          </p>
        </div>
      )}

      {/* Subdomain Input */}
      <div className="space-y-1.5">
        <Label htmlFor="project-subdomain">Subdomain</Label>
        <div className="flex items-center">
          <Input
            id="project-subdomain"
            placeholder="my-cool-app"
            value={subdomain}
            onChange={(e) => handleSubdomainChange(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Assigned URL:{" "}
          <span className="font-mono text-foreground font-semibold">
            http://{subdomain || "subdomain"}.localhost:8080
          </span>
        </p>
      </div>

      {/* Submit CTA */}
      <div className="pt-2">
        <Button
          type="submit"
          className="w-full font-mono text-xs uppercase tracking-wider"
          disabled={isLoading || isFormLocked}
        >
          {isLoading
            ? isEdit
              ? "Saving changes..."
              : "Creating project..."
            : isFormLocked
            ? "Verify Repository Access to Proceed"
            : isEdit
            ? "Save Changes"
            : "Create Project"}
        </Button>
      </div>
    </form>
  );
}

export default ProjectForm;
