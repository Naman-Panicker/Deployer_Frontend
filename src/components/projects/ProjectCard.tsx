import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Project } from "@/src/types";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();
  const liveUrl = `http://${project.subdomain}.localhost:8080`;

  const formattedDate = new Date(project.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card className="flex flex-col justify-between transition-colors min-w-0 overflow-hidden bg-card">
      <CardHeader className="cursor-pointer min-w-0" onClick={() => navigate(`/projects/${project.id}`)}>
        <div className="flex items-start justify-between gap-2 w-full min-w-0">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base font-medium hover:text-primary transition-colors truncate" title={project.name}>
              {project.name}
            </CardTitle>
            <CardDescription className="font-mono text-xs mt-1 truncate text-foreground" title={project.repoUrl}>
              {project.repoUrl}
            </CardDescription>
          </div>
          <span className="shrink-0 inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium rounded-md bg-muted text-foreground">
            {project.branch || "main"}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 min-w-0">
        <div className="flex items-center gap-1.5 text-xs min-w-0">
          <span className="text-foreground shrink-0">Domain:</span>
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-foreground hover:text-primary hover:underline truncate min-w-0 flex-1"
            onClick={(e) => e.stopPropagation()}
            title={liveUrl}
          >
            {project.subdomain}.localhost:8080
          </a>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between text-xs text-foreground pt-2 min-w-0">
        <span className="truncate mr-2 text-foreground">Created {formattedDate}</span>
        <Button
          variant="outline"
          size="xs"
          className="shrink-0 bg-muted text-foreground hover:bg-muted/80"
          onClick={() => navigate(`/projects/${project.id}`)}
        >
          Manage &rarr;
        </Button>
      </CardFooter>
    </Card>
  );
}

export default ProjectCard;
