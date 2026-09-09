import { useNavigate } from "react-router-dom";
import { AppShell } from "@/src/components/layout/AppShell";
import { ProjectCard } from "@/src/components/projects/ProjectCard";
import { useProjects } from "@/src/hooks/useProjects";
import { Button } from "@/components/ui/button";

export function DashboardPage() {
  const { projects, isLoading, error, refetch } = useProjects();
  const navigate = useNavigate();

  return (
    <AppShell
      title="Projects"
      action={
        <Button size="sm" onClick={() => navigate("/projects/new")}>
          + New Project
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading projects...</div>
        </div>
      ) : error ? (
        <div className="border border-destructive/50 bg-destructive/10 p-4 text-xs text-destructive flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="xs" onClick={refetch}>
            Retry
          </Button>
        </div>
      ) : projects.length === 0 ? (
        <div className="border border-dashed border-border py-16 text-center space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-medium">No projects found</h2>
            <p className="text-xs text-muted-foreground">
              Get started by linking your Git repository to deploy your web application.
            </p>
          </div>
          <Button size="sm" onClick={() => navigate("/projects/new")}>
            Deploy Your First Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

export default DashboardPage;
