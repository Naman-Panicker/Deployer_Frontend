import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEnvVars, useSaveEnvVars } from "@/src/hooks/useEnvVars";
import type { EnvVarInput } from "@/src/types";

interface EnvVarEditorProps {
  projectId: string;
}

interface EnvRow {
  key: string;
  value: string;
  placeholder?: string;
  showPlaintext?: boolean;
}

export function EnvVarEditor({ projectId }: EnvVarEditorProps) {
  const { envVars, isLoading, error: loadError, refetch } = useEnvVars(projectId);
  const { saveEnvVars, isSaving, error: saveError } = useSaveEnvVars();

  const [rows, setRows] = useState<EnvRow[]>([]);
  const [activeTab, setActiveTab] = useState<"rows" | "bulk">("rows");
  const [bulkText, setBulkText] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Hydrate rows when envVars load
  useEffect(() => {
    if (envVars && envVars.length > 0) {
      setRows(
        envVars.map((item) => ({
          key: item.key,
          value: "", // Plaintext is not returned by server
          placeholder: item.preview || "••••••••",
          showPlaintext: false,
        }))
      );
    } else {
      setRows([{ key: "", value: "", showPlaintext: false }]);
    }
  }, [envVars]);

  const handleAddRow = () => {
    setRows((prev) => [...prev, { key: "", value: "", showPlaintext: false }]);
  };

  const handleRemoveRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: "key" | "value", val: string) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: val } : row))
    );
  };

  const toggleVisibility = (index: number) => {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, showPlaintext: !row.showPlaintext } : row
      )
    );
  };

  const handleParseBulk = () => {
    if (!bulkText.trim()) return;

    const parsedRows: EnvRow[] = [];
    const lines = bulkText.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const equalsIdx = trimmed.indexOf("=");
      if (equalsIdx !== -1) {
        const key = trimmed.slice(0, equalsIdx).trim();
        let value = trimmed.slice(equalsIdx + 1).trim();

        // Strip surrounding quotes if present
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        if (key) {
          parsedRows.push({ key, value, showPlaintext: false });
        }
      }
    }

    if (parsedRows.length > 0) {
      setRows(parsedRows);
      setActiveTab("rows");
      setValidationError(null);
    } else {
      setValidationError("No valid KEY=VALUE pairs found in provided text.");
    }
  };

  const handleSave = async () => {
    setValidationError(null);
    setSaveSuccess(false);

    // Filter valid rows
    const validRows: EnvVarInput[] = [];

    for (const r of rows) {
      const key = r.key.trim();
      if (!key) continue;

      if (!r.value && r.placeholder) {
        setValidationError(
          `Variable '${key}' has an existing encrypted value. Because backend overwrites all variables, you must enter a plaintext value before saving.`
        );
        return;
      }

      validRows.push({ key, value: r.value });
    }

    const ok = await saveEnvVars(projectId, validRows);
    if (ok) {
      setSaveSuccess(true);
      refetch();
      setTimeout(() => setSaveSuccess(false), 4000);
    }
  };

  if (isLoading && rows.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-muted-foreground">
        Loading environment variables...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Destructive Overwrite Warning Banner */}
      <div className="border border-amber-600/40 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-300 space-y-1">
        <div className="font-semibold uppercase tracking-wider text-[10px]">
          Warning: Overwrite Policy
        </div>
        <p className="leading-relaxed text-[11px]">
          Saving replaces all environment variables on the server. Because existing secrets are encrypted and cannot be decrypted by the client, enter plaintext values for any variables you want to retain or update.
        </p>
      </div>

      {loadError && (
        <div className="border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
          {loadError}
        </div>
      )}

      {saveError && (
        <div className="border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
          {saveError}
        </div>
      )}

      {validationError && (
        <div className="border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
          {validationError}
        </div>
      )}

      {saveSuccess && (
        <div className="border border-emerald-600/40 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300">
          Environment variables updated successfully.
        </div>
      )}

      {/* Mode Selector & Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={activeTab === "rows" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("rows")}
            className="text-xs"
          >
            Form Editor
          </Button>
          <Button
            type="button"
            variant={activeTab === "bulk" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("bulk")}
            className="text-xs"
          >
            Bulk .env Import
          </Button>
        </div>

        {activeTab === "rows" && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAddRow}
            className="text-xs"
          >
            + Add Variable
          </Button>
        )}
      </div>

      {/* Editor Body */}
      {activeTab === "bulk" ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="bulk-env" className="text-xs font-medium">
              Paste .env format (KEY=VALUE per line)
            </Label>
            <textarea
              id="bulk-env"
              rows={8}
              className="w-full border border-input bg-transparent p-3 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
              placeholder={`API_KEY=secret_12345\nDATABASE_URL=postgres://user:pass@host/db\nNODE_ENV=production`}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={handleParseBulk}>
              Parse &amp; Import to Editor
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Header row on medium+ screens */}
          {rows.length > 0 && (
            <div className="hidden md:grid md:grid-cols-[1fr_1fr_64px_40px] gap-2 text-[11px] font-medium text-muted-foreground px-1">
              <span>KEY</span>
              <span>VALUE</span>
              <span className="text-center">VISIBILITY</span>
              <span className="text-center">ACTION</span>
            </div>
          )}

          <div className="space-y-2">
            {rows.map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-[1fr_1fr_64px_40px] gap-2 border border-border/80 p-2.5 bg-card/40 items-center"
              >
                <div>
                  <Input
                    placeholder="VARIABLE_NAME"
                    value={row.key}
                    onChange={(e) => handleRowChange(index, "key", e.target.value)}
                    className="font-mono text-xs"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <Input
                    type={row.showPlaintext ? "text" : "password"}
                    placeholder={row.placeholder || "value"}
                    value={row.value}
                    onChange={(e) => handleRowChange(index, "value", e.target.value)}
                    className="font-mono text-xs"
                    disabled={isSaving}
                  />
                </div>

                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => toggleVisibility(index)}
                    className="w-full text-[10px]"
                    title={row.showPlaintext ? "Hide value" : "Show value"}
                  >
                    {row.showPlaintext ? "Hide" : "Show"}
                  </Button>
                </div>

                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="destructive"
                    size="xs"
                    onClick={() => handleRemoveRow(index)}
                    className="w-full text-xs"
                    title="Remove variable"
                    disabled={isSaving}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {rows.length === 0 && (
            <div className="border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              No variables defined. Click &quot;+ Add Variable&quot; to configure one.
            </div>
          )}

          <div className="pt-3 flex items-center justify-between border-t border-border">
            <span className="text-xs text-muted-foreground">
              {rows.filter((r) => r.key.trim()).length} variable(s) configured
            </span>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="text-xs"
            >
              {isSaving ? "Saving..." : "Save All Environment Variables"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnvVarEditor;
