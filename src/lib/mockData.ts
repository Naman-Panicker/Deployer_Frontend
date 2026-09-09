import type { User, Project, Deployment, LogEntry, EnvVarPreview } from "@/src/types";

export const DEMO_TOKEN = "demo-dev-token";

export const MOCK_USER: User = {
  id: "user_demo_123",
  email: "demo@deployer.local",
  createdAt: "2026-09-01T10:00:00.000Z",
};

export const MOCK_PROJECTS: Project[] = [
  {
    id: "proj_nextjs_portfolio",
    name: "portfolio-website",
    repoUrl: "https://github.com/developer/nextjs-portfolio",
    subdomain: "portfolio-website",
    branch: "main",
    createdAt: "2026-09-02T14:20:00.000Z",
  },
  {
    id: "proj_ecommerce_api",
    name: "shop-service",
    repoUrl: "https://github.com/developer/ecommerce-backend",
    subdomain: "shop-api",
    branch: "main",
    createdAt: "2026-09-05T09:15:00.000Z",
  },
  {
    id: "proj_docs_site",
    name: "docs-portal",
    repoUrl: "https://github.com/developer/docs-portal",
    subdomain: "docs-portal",
    branch: "develop",
    createdAt: "2026-09-08T18:45:00.000Z",
  },
];

export const MOCK_DEPLOYMENTS: Record<string, Deployment[]> = {
  proj_nextjs_portfolio: [
    {
      id: "dep_live_001",
      status: "DEPLOYED",
      commitHash: "a8f3c91823ab",
      triggerType: "MANUAL",
      createdAt: "2026-09-09T12:00:00.000Z",
      updatedAt: "2026-09-09T12:02:15.000Z",
    },
    {
      id: "dep_prev_002",
      status: "DEPLOYED",
      commitHash: "7b4c810ef12a",
      triggerType: "WEBHOOK",
      createdAt: "2026-09-08T15:30:00.000Z",
      updatedAt: "2026-09-08T15:32:40.000Z",
    },
    {
      id: "dep_fail_003",
      status: "FAILED",
      commitHash: "3f90e21bc001",
      triggerType: "WEBHOOK",
      createdAt: "2026-09-07T11:10:00.000Z",
      updatedAt: "2026-09-07T11:11:05.000Z",
    },
  ],
  proj_ecommerce_api: [
    {
      id: "dep_build_004",
      status: "BUILDING",
      commitHash: "c0ffee1984ab",
      triggerType: "MANUAL",
      createdAt: "2026-09-09T14:25:00.000Z",
      updatedAt: "2026-09-09T14:26:00.000Z",
    },
  ],
  proj_docs_site: [
    {
      id: "dep_q_005",
      status: "QUEUED",
      commitHash: "4e12b70912fa",
      triggerType: "WEBHOOK",
      createdAt: "2026-09-09T14:28:00.000Z",
      updatedAt: "2026-09-09T14:28:00.000Z",
    },
  ],
};

export const MOCK_LOGS: Record<string, LogEntry[]> = {
  dep_live_001: [
    {
      stream: "stdout",
      line: "Cloning repository https://github.com/developer/nextjs-portfolio into build workspace...",
      timestamp: "2026-09-09T12:00:02.000Z",
    },
    {
      stream: "stdout",
      line: "Checking out branch 'main' at commit a8f3c91",
      timestamp: "2026-09-09T12:00:05.000Z",
    },
    {
      stream: "stdout",
      line: "Resolving dependencies with npm ci --prefer-offline...",
      timestamp: "2026-09-09T12:00:12.000Z",
    },
    {
      stream: "stderr",
      line: "npm notice created a lockfile as package-lock.json. You should commit this file.",
      timestamp: "2026-09-09T12:00:25.000Z",
    },
    {
      stream: "stdout",
      line: "Running build script: npm run build",
      timestamp: "2026-09-09T12:00:28.000Z",
    },
    {
      stream: "stdout",
      line: "> nextjs-portfolio@1.0.0 build\n> vite build",
      timestamp: "2026-09-09T12:00:30.000Z",
    },
    {
      stream: "stdout",
      line: "transforming (234 modules)... done in 450ms.",
      timestamp: "2026-09-09T12:00:45.000Z",
    },
    {
      stream: "stdout",
      line: "dist/index.html                   0.46 kB │ gzip: 0.29 kB",
      timestamp: "2026-09-09T12:00:50.000Z",
    },
    {
      stream: "stdout",
      line: "dist/assets/index.js            345.47 kB │ gzip: 108.68 kB",
      timestamp: "2026-09-09T12:00:52.000Z",
    },
    {
      stream: "stdout",
      line: "✓ Build completed successfully with exit code 0.",
      timestamp: "2026-09-09T12:00:55.000Z",
    },
    {
      stream: "stdout",
      line: "Uploading build artifacts to reverse-proxy storage...",
      timestamp: "2026-09-09T12:01:10.000Z",
    },
    {
      stream: "stdout",
      line: "Configuring routing for http://portfolio-website.localhost:8080",
      timestamp: "2026-09-09T12:01:40.000Z",
    },
    {
      stream: "stdout",
      line: "Health check OK. Static site routing active.",
      timestamp: "2026-09-09T12:02:15.000Z",
    },
  ],
};

export const MOCK_ENV_VARS: Record<string, EnvVarPreview[]> = {
  proj_nextjs_portfolio: [
    { key: "NODE_ENV", preview: "••••••••" },
    { key: "NEXT_PUBLIC_SITE_TITLE", preview: "••••blog" },
    { key: "DATABASE_URL", preview: "••••5432" },
  ],
};
