"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ArrowUp,
  Home,
  RefreshCw,
  HardDrive,
} from "lucide-react";

interface FolderEntry {
  name: string;
  path: string;
  type: "directory" | "file";
}

interface FolderBrowserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (path: string) => void;
  initialPath?: string;
}

export function FolderBrowserDialog({
  open,
  onOpenChange,
  onSelect,
  initialPath,
}: FolderBrowserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string | null>(initialPath || null);
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [entries, setEntries] = useState<FolderEntry[]>([]);
  const [isRoot, setIsRoot] = useState(true);
  const [manualPath, setManualPath] = useState(initialPath || "");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      browseTo(initialPath || null);
    }
  }, [open, initialPath]);

  async function browseTo(folderPath: string | null) {
    setLoading(true);
    setError(null);
    setSelectedPath(null);

    try {
      const res = await fetch("/api/folder/browse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderPath }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to browse folder");
      }

      setCurrentPath(data.currentPath);
      setParentPath(data.parentPath);
      setEntries(data.entries || []);
      setIsRoot(data.isRoot);

      if (data.currentPath) {
        setManualPath(data.currentPath);
        setSelectedPath(data.currentPath);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to browse folder");
    } finally {
      setLoading(false);
    }
  }

  function handleEntryClick(entry: FolderEntry) {
    if (entry.type === "directory") {
      browseTo(entry.path);
    }
  }

  function handleGoUp() {
    if (parentPath) {
      browseTo(parentPath);
    } else {
      browseTo(null); // Go to root/starting points
    }
  }

  function handleGoHome() {
    browseTo(null);
  }

  function handleManualNavigate() {
    if (manualPath.trim()) {
      browseTo(manualPath.trim());
    }
  }

  function handleSelect() {
    if (selectedPath) {
      onSelect(selectedPath);
      onOpenChange(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleManualNavigate();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Browse for Folder
          </DialogTitle>
          <DialogDescription>
            Navigate to and select the folder containing your policy documents
          </DialogDescription>
        </DialogHeader>

        {/* Path input and navigation */}
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={handleGoHome}
            title="Go to starting points"
          >
            <Home className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleGoUp}
            disabled={isRoot && !currentPath}
            title="Go up one level"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Input
            value={manualPath}
            onChange={(e) => setManualPath(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter folder path..."
            className="flex-1"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleManualNavigate}
            disabled={loading}
            title="Go to path"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Current path display */}
        {currentPath && (
          <div className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md truncate">
            {currentPath}
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
            {error}
          </div>
        )}

        {/* Folder list */}
        <ScrollArea className="flex-1 min-h-[300px] border rounded-md">
          <div className="p-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {currentPath ? "No subfolders found" : "No accessible folders"}
              </div>
            ) : (
              <div className="space-y-1">
                {entries.map((entry) => (
                  <button
                    key={entry.path}
                    onClick={() => handleEntryClick(entry)}
                    onDoubleClick={() => {
                      if (entry.type === "directory") {
                        browseTo(entry.path);
                      }
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors
                      ${
                        selectedPath === entry.path
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                  >
                    {entry.path.match(/^[A-Z]:[\\/]?$/) ? (
                      <HardDrive className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <Folder className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span className="truncate">{entry.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <div className="flex-1 text-sm text-muted-foreground">
            {selectedPath && (
              <span className="truncate block">Selected: {selectedPath}</span>
            )}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={!selectedPath}>
            Select Folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
