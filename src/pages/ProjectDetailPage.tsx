import { useState } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { AppShell } from "@/src/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectForm } from "@/src/components/projects/ProjectForm";
import { DeleteProjectDialog } from "@/src/components/projects/DeleteProjectDialog";
import { useProject, useUpdateProject, useDeleteProject, type UpdateProjectInput } from "@/src/hooks/useProjects";
import { useDeployments } from "@/src/hooks/useDeployments";
import { DeployButton } from "@/src/components/deployments/DeployButton";
import { DeploymentHistory } from "@/src/components/deployments/DeploymentHistory";
import { DeploymentStatusBadge } from "@/src/components/deployments/DeploymentStatusBadge";
import { EnvVarEditor } from "@/src/components/env/EnvVarEditor";
import { WebhookSetup } from "@/src/components/webhook/WebhookSetup";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeTab = searchParams.get("tab") || "deployments";

  const { project, isLoading, error, refetch } = useProject(id);
  const { updateProject, isLoading: isUpdating, error: updateError } = useUpdateProject();
  const { deleteProject, isLoading: isDeleting, error: deleteError } = useDeleteProject();
  const {
    deployments,
    isLoading: isLoadingDeployments,
    refetch: refetchDeployments,
  } = useDeployments(id);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleUpdate = async (data: UpdateProjectInput) => {
    if (!id) return;
    const updated = await updateProject(id, data);
    if (updated) {
      refetch();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;
    const success = await deleteProject(id);
    if (success) {
      navigate("/dashboard");
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <div className="text-sm text-muted-foreground font-mono">Loading project details...</div>
        </div>
      </AppShell>
    );
  }

  if (error || !project) {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto space-y-4">
          <div className="border border-destructive/50 bg-destructive/10 p-4 text-xs text-destructive flex items-center justify-between">
            <span>{error || "Project not found"}</span>
            <Button variant="outline" size="xs" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const liveUrl = `http://${project.subdomain}.localhost:8080`;

  return (
    <AppShell projectName={project.name}>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Link to="/dashboard" className="hover:text-foreground">
              Projects
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{project.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono border border-border bg-card hover:bg-muted transition-colors"
            >
              <span>{project.subdomain}.localhost:8080</span>
              <span className="text-muted-foreground">↗</span>
            </a>
          </div>
        </div>

        {/* Delete Dialog */}
        <DeleteProjectDialog
          isOpen={isDeleteDialogOpen}
          projectName={project.name}
          isDeleting={isDeleting}
          onConfirm={handleDeleteConfirm}
          onClose={() => setIsDeleteDialogOpen(false)}
        />

        {deleteError && (
          <div className="border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
            {deleteError}
          </div>
        )}

        {/* Project Header Banner */}
        <div className="border border-border bg-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight">{project.name}</h1>
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-mono border border-border bg-muted/40">
                {project.branch || "main"}
              </span>
              {deployments.length > 0 && (
                <DeploymentStatusBadge status={deployments[0].status} />
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                Repo:{" "}
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-primary hover:underline"
                >
                  {project.repoUrl}
                </a>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DeployButton
              projectId={project.id}
              defaultBranch={project.branch}
              onDeployTriggered={() => refetchDeployments()}
            />
          </div>
        </div>

        {/* Tab 1: Deployments & History */}
        {activeTab === "deployments" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Deployment History</CardTitle>
                <CardDescription>
                  Real-time status, git commits, rollback triggers, and build logs.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <DeploymentHistory
                projectId={project.id}
                deployments={deployments}
                isLoading={isLoadingDeployments}
                onDeploymentChange={refetchDeployments}
              />
            </CardContent>
          </Card>
        )}

        {/* Tab 2: Environment Variables (Full Width) */}
        {activeTab === "env" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Environment Variables</CardTitle>
              <CardDescription>
                Encrypted build and runtime environment variables passed to container builds.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnvVarEditor projectId={project.id} />
            </CardContent>
          </Card>
        )}

        {/* Tab 3: Git Webhook (Full Width) */}
        {activeTab === "webhook" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">GitHub Webhook Integration</CardTitle>
              <CardDescription>
                Configure automatic continuous deployment on every git push to {project.branch || "main"}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WebhookSetup
                projectId={project.id}
                branch={project.branch || "main"}
              />
            </CardContent>
          </Card>
        )}

        {/* Tab 4: Settings & Danger Zone */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Project Settings</CardTitle>
                <CardDescription>
                  Modify project details, repository link, or default build branch.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProjectForm
                  initialData={project}
                  onSubmit={handleUpdate}
                  isLoading={isUpdating}
                  error={updateError}
                  isEdit={true}
                />
              </CardContent>
            </Card>

            <Card className="border-destructive/40 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Permanently delete this project, all deployments, logs, and stored secrets.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between pt-2">
                <div className="text-xs text-muted-foreground">
                  Deleting a project immediately unbinds the subdomain and terminates routing.
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  Delete Project
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default ProjectDetailPage;
