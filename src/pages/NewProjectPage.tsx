import { useNavigate, Link } from "react-router-dom";
import { AppShell } from "@/src/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectForm } from "@/src/components/projects/ProjectForm";
import { useCreateProject, type CreateProjectInput } from "@/src/hooks/useProjects";

export function NewProjectPage() {
  const { createProject, isLoading, error } = useCreateProject();
  const navigate = useNavigate();

  const handleCreate = async (data: CreateProjectInput) => {
    const created = await createProject(data);
    if (created && created.id) {
      navigate(`/projects/${created.id}`);
    }
  };

  return (
    <AppShell>
      <div className="max-w-xl mx-auto space-y-4">
        <div>
          <Link
            to="/dashboard"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2"
          >
            &larr; Back to Projects
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">New Project</CardTitle>
            <CardDescription>
              Connect a Git repository and configure its deployment subdomain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectForm
              onSubmit={handleCreate}
              isLoading={isLoading}
              error={error}
              isEdit={false}
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

export default NewProjectPage;
