import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeleteProjectDialogProps {
  isOpen: boolean;
  projectName: string;
  isDeleting: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export function DeleteProjectDialog({
  isOpen,
  projectName,
  isDeleting,
  onConfirm,
  onClose,
}: DeleteProjectDialogProps) {
  const [confirmInput, setConfirmInput] = useState("");

  if (!isOpen) return null;

  const isConfirmed = confirmInput === projectName;

  const handleConfirm = async () => {
    if (!isConfirmed || isDeleting) return;
    await onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
      <Card className="w-full max-w-md border-destructive/40 bg-card rounded-xl">
        <CardHeader>
          <CardTitle className="text-destructive font-semibold">Delete Project</CardTitle>
          <CardDescription>
            This action cannot be undone. This will permanently delete the project{" "}
            <span className="font-semibold text-foreground">&apos;{projectName}&apos;</span>, its deployments, logs, and configuration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="confirm-delete">
            Type <span className="font-mono font-bold text-foreground">{projectName}</span> to confirm:
          </Label>
          <Input
            id="confirm-delete"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder={projectName}
            disabled={isDeleting}
            autoFocus
          />
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setConfirmInput("");
              onClose();
            }}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={!isConfirmed || isDeleting}
            onClick={handleConfirm}
          >
            {isDeleting ? "Deleting..." : "Delete Project"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default DeleteProjectDialog;
