import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuthContext } from "@/src/context/AuthContext";
import { Button } from "@/components/ui/button";

interface AppShellProps {
  children: ReactNode;
  title?: string;
  action?: ReactNode;
  projectName?: string;
}

export function AppShell({ children, title, action, projectName }: AppShellProps) {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id?: string; dId?: string }>();
  const [searchParams] = useSearchParams();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const activeProjectId = params.id;
  const currentTab = searchParams.get("tab") || "deployments";

  const isProjectsActive = location.pathname === "/dashboard" || location.pathname === "/";
  const isNewProjectActive = location.pathname === "/projects/new";
  const isProjectDetail = location.pathname.startsWith("/projects/") && !isNewProjectActive;

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed md:sticky top-0 z-50 h-screen w-64 border-r border-border bg-card flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="h-14 border-b border-border px-5 flex items-center justify-between">
            <Link
              to="/dashboard"
              className="font-bold text-sm tracking-tight flex items-center gap-2"
              onClick={() => setIsMobileOpen(false)}
            >
              <span>DEPLOYER</span>
              <span className="text-[10px] font-mono font-normal border border-border px-1 py-0.2 bg-muted/40 text-muted-foreground">
                v2.0
              </span>
            </Link>

            {/* Mobile close button */}
            <button
              type="button"
              className="md:hidden p-1 text-muted-foreground hover:text-foreground"
              onClick={() => setIsMobileOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-4 space-y-6 flex-1">
            {/* Main Navigation */}
            <div className="space-y-1">
              <span className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Platform
              </span>
              <nav className="mt-1 space-y-1">
                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    isProjectsActive
                      ? "bg-foreground text-background font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span>Projects</span>
                </Link>

                <Link
                  to="/projects/new"
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    isNewProjectActive
                      ? "bg-foreground text-background font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>New Project</span>
                </Link>
              </nav>
            </div>

            {/* Contextual Active Project Navigation */}
            {isProjectDetail && activeProjectId && (
              <div className="space-y-1 pt-3 border-t border-border/60">
                <div className="px-2 pb-1 flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Project Scope
                  </span>
                  {projectName && (
                    <span className="text-[10px] font-mono truncate max-w-[110px] text-foreground font-semibold">
                      {projectName}
                    </span>
                  )}
                </div>

                <nav className="mt-1 space-y-1">
                  <Link
                    to={`/projects/${activeProjectId}?tab=deployments`}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      currentTab === "deployments" && !params.dId
                        ? "bg-foreground text-background font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Deployments</span>
                  </Link>

                  <Link
                    to={`/projects/${activeProjectId}?tab=env`}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      currentTab === "env"
                        ? "bg-foreground text-background font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <span>Environment Vars</span>
                  </Link>

                  <Link
                    to={`/projects/${activeProjectId}?tab=webhook`}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      currentTab === "webhook"
                        ? "bg-foreground text-background font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span>Git Webhook</span>
                  </Link>

                  <Link
                    to={`/projects/${activeProjectId}?tab=settings`}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      currentTab === "settings"
                        ? "bg-foreground text-background font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Settings</span>
                  </Link>
                </nav>
              </div>
            )}
          </div>
        </div>

        {/* User Account & Logout Footer */}
        <div className="border-t border-border p-4 bg-card/40 space-y-2">
          {user?.email && (
            <div className="flex items-center gap-2 text-xs truncate">
              <span className="w-5 h-5 rounded-none bg-muted flex items-center justify-center font-mono text-[10px] font-bold text-foreground shrink-0 border border-border">
                {user.email.charAt(0).toUpperCase()}
              </span>
              <span className="truncate text-muted-foreground text-[11px] font-mono">
                {user.email}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
              <span className="w-1.5 h-1.5 rounded-none bg-emerald-700 dark:bg-emerald-400" />
              Gateway 9000
            </span>
            <Button
              variant="outline"
              size="xs"
              onClick={logout}
              className="text-[10px] h-6 px-2"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-border bg-card/60 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="md:hidden p-1.5 border border-border hover:bg-muted text-foreground"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open sidebar navigation"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {title ? (
              <h1 className="text-sm font-semibold tracking-tight">{title}</h1>
            ) : (
              <span className="text-xs text-muted-foreground font-mono">Deployer Dashboard</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {action}
            {!isNewProjectActive && (
              <Button
                size="xs"
                onClick={() => navigate("/projects/new")}
                className="text-xs hidden sm:inline-flex"
              >
                + New Project
              </Button>
            )}
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-6 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppShell;
