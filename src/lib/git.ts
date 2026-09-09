/**
 * Git repository inspection utilities for client-side GitHub verification
 */

export interface ParsedGitRepo {
  owner: string;
  repo: string;
  isGitHub: boolean;
}

/**
 * Extracts owner and repository name from various Git URL formats.
 */
export function parseGitRepo(url: string): ParsedGitRepo | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();

  // Pattern 1: HTTPS or HTTP GitHub URLs (with optional .git, tree/blob subpaths, etc.)
  // e.g. https://github.com/owner/repo, https://github.com/owner/repo.git, github.com/owner/repo
  const githubMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com[/:]([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git|\/.*)?$/i
  );

  if (githubMatch && githubMatch[1] && githubMatch[2]) {
    // Remove .git suffix if captured
    const repo = githubMatch[2].replace(/\.git$/i, "");
    return {
      owner: githubMatch[1],
      repo,
      isGitHub: true,
    };
  }

  // Pattern 2: SSH GitHub URLs: git@github.com:owner/repo.git
  const sshMatch = trimmed.match(/^git@github\.com:([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git)?$/i);
  if (sshMatch && sshMatch[1] && sshMatch[2]) {
    return {
      owner: sshMatch[1],
      repo: sshMatch[2].replace(/\.git$/i, ""),
      isGitHub: true,
    };
  }

  // Non-GitHub URL detected
  return null;
}

export interface BranchFetchResult {
  branches: string[];
  defaultBranchCandidate: string;
}

/**
 * Fetches branch list from GitHub API.
 * Supports optional Personal Access Token for private repositories.
 */
export async function fetchGitHubBranches(
  owner: string,
  repo: string,
  token?: string
): Promise<BranchFetchResult> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };

  if (token && token.trim()) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  const endpoint = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches?per_page=100`;

  const response = await fetch(endpoint, {
    headers,
    cache: "no-cache",
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Repository not found or private. Provide an access token or use manual override.");
    }
    if (response.status === 403) {
      const rateLimitRemaining = response.headers.get("x-ratelimit-remaining");
      if (rateLimitRemaining === "0") {
        throw new Error("GitHub API rate limit exceeded (60 req/hr). Use manual branch entry or provide a token.");
      }
      throw new Error("GitHub access forbidden. Check permissions or repository visibility.");
    }
    if (response.status === 401) {
      throw new Error("Invalid GitHub token credentials.");
    }
    throw new Error(`GitHub API error (HTTP ${response.status})`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected payload structure returned by GitHub.");
  }

  if (data.length === 0) {
    throw new Error("Repository has no active branches.");
  }

  const branches = data.map((item: { name: string }) => item.name);

  // Determine standard default branch candidate
  let defaultBranchCandidate = branches[0];
  if (branches.includes("main")) {
    defaultBranchCandidate = "main";
  } else if (branches.includes("master")) {
    defaultBranchCandidate = "master";
  }

  return {
    branches,
    defaultBranchCandidate,
  };
}
