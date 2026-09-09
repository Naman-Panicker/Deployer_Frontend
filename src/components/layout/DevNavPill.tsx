import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/src/context/AuthContext";
import { DEMO_TOKEN } from "@/src/lib/mockData";
import { Button } from "@/components/ui/button";

export function DevNavPill() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, logout, login } = useAuthContext();

  const isDemo = token === DEMO_TOKEN;

  const handleEnterDemo = () => {
    login(DEMO_TOKEN, {
      id: "user_demo_123",
      email: "demo@deployer.local",
      createdAt: new Date().toISOString(),
    });
    navigate("/dashboard");
  };

  const pages = [
    { label: "Login", path: "/login" },
    { label: "Signup", path: "/signup" },
    { label: "Dashboard", path: "/dashboard", protected: true },
    { label: "+ New Project", path: "/projects/new", protected: true },
    { label: "Project Detail", path: "/projects/proj_nextjs_portfolio", protected: true },
    { label: "Live Logs", path: "/projects/proj_nextjs_portfolio/deployments/dep_live_001", protected: true },
  ];

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 text-xs rounded-none">
      <div className="flex items-center gap-1.5 pr-2 border-r border-border font-medium text-foreground">
        <span className="w-2 h-2 rounded-none bg-primary inline-block" />
        <span className="text-[11px] font-mono font-semibold">DEV PREVIEW</span>
      </div>

      <nav className="flex items-center gap-1">
        {pages.map((p) => {
          const isActive = location.pathname === p.path;
          return (
            <Link
              key={p.path}
              to={p.path}
              onClick={(e) => {
                if (p.protected && !token) {
                  e.preventDefault();
                  handleEnterDemo();
                  setTimeout(() => navigate(p.path), 50);
                }
              }}
              className={`px-2 py-0.5 text-[11px] font-mono transition-colors border ${
                isActive
                  ? "bg-foreground text-background font-semibold border-foreground"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground border-transparent"
              }`}
            >
              {p.label}
            </Link>
          );
        })}
      </nav>

      <div className="pl-2 border-l border-border flex items-center gap-1">
        {!isDemo ? (
          <Button
            size="xs"
            variant="default"
            onClick={handleEnterDemo}
            className="text-[10px] h-5 px-1.5"
          >
            Enable Demo Mode
          </Button>
        ) : (
          <Button
            size="xs"
            variant="outline"
            onClick={logout}
            className="text-[10px] h-5 px-1.5"
          >
            Exit Demo
          </Button>
        )}
      </div>
    </div>
  );
}

export default DevNavPill;
