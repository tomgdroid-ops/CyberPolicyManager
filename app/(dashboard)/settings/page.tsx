"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { Shield, User, Building2, FolderOpen, RefreshCw, Save, AlertTriangle, CheckCircle, FileText, Search, Folder, Check } from "lucide-react";
import { Organization } from "@/types/organization";

// Supported policy file extensions
const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".doc", ".txt", ".md", ".rtf"];

// IndexedDB helper functions for persisting directory handles
const DB_NAME = "PolicyVaultStorage";
const STORE_NAME = "directoryHandles";

async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

async function saveDirectoryHandle(orgId: string, handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(handle, `org-${orgId}`);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function loadDirectoryHandle(orgId: string): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(`org-${orgId}`);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  } catch {
    return null;
  }
}

interface FolderFile {
  name: string;
  path: string;
  size: number;
  modified: string;
  type: "file" | "directory";
}

// Type declarations for File System Access API
declare global {
  interface Window {
    showDirectoryPicker?: (options?: {
      id?: string;
      mode?: "read" | "readwrite";
      startIn?: "desktop" | "documents" | "downloads" | "music" | "pictures" | "videos";
    }) => Promise<FileSystemDirectoryHandle>;
  }
}

interface FileSystemDirectoryHandle {
  kind: "directory";
  name: string;
  values(): AsyncIterableIterator<FileSystemHandle>;
  getDirectoryHandle(name: string): Promise<FileSystemDirectoryHandle>;
  getFileHandle(name: string): Promise<FileSystemFileHandle>;
}

interface FileSystemFileHandle {
  kind: "file";
  name: string;
  getFile(): Promise<File>;
}

type FileSystemHandle = FileSystemDirectoryHandle | FileSystemFileHandle;

export default function SettingsPage() {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [folderPath, setFolderPath] = useState("");
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [folderFiles, setFolderFiles] = useState<FolderFile[]>([]);
  const [folderError, setFolderError] = useState<string | null>(null);
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [supportsFileSystemAPI, setSupportsFileSystemAPI] = useState(false);
  const [importingFile, setImportingFile] = useState<string | null>(null);
  const [importedFiles, setImportedFiles] = useState<Set<string>>(new Set());
  const [handlesReady, setHandlesReady] = useState(false); // Track when handles are loaded

  // Use a ref to store file handles - React state may not preserve native objects properly
  const fileHandlesRef = useRef<Map<string, FileSystemFileHandle>>(new Map());

  // Check if File System Access API is supported
  useEffect(() => {
    const isSupported = typeof window !== "undefined" && "showDirectoryPicker" in window;
    setSupportsFileSystemAPI(isSupported);
  }, []);

  const currentOrgId = session?.user?.currentOrganization?.id;
  const isAdmin = session?.user?.currentOrganization?.role === "org_admin" || session?.user?.isSuperAdmin;

  // Fetch organization data
  useEffect(() => {
    if (currentOrgId) {
      fetchOrganization();
    } else {
      setLoading(false);
    }
  }, [currentOrgId]);

  // Restore directory handle after we know the org ID and API support
  useEffect(() => {
    if (currentOrgId && supportsFileSystemAPI) {
      restoreDirectoryHandle();
    }
  }, [currentOrgId, supportsFileSystemAPI]);

  // Restore directory handle from IndexedDB
  async function restoreDirectoryHandle() {
    if (!currentOrgId) return;

    try {
      const handle = await loadDirectoryHandle(currentOrgId);
      if (handle) {
        // Verify we still have permission
        let permission = await (handle as any).queryPermission({ mode: "read" });

        // If permission not granted, try to request it
        if (permission !== "granted") {
          try {
            permission = await (handle as any).requestPermission({ mode: "read" });
          } catch {
            // User denied or browser blocked the request
            console.log("Permission request was denied or blocked");
          }
        }

        if (permission === "granted") {
          setDirectoryHandle(handle);
          setFolderPath(handle.name);
          // Auto-scan the folder
          await scanFolderWithHandle(handle);
        } else {
          // Still show the folder name so user knows a folder was previously selected
          setFolderPath(handle.name);
          console.log("Permission not granted, user needs to click Browse to reconnect");
        }
      }
    } catch (error) {
      console.log("Could not restore directory handle:", error);
    }
  }

  async function fetchOrganization() {
    try {
      const res = await fetch(`/api/organizations/${currentOrgId}`);
      if (res.ok) {
        const data = await res.json();
        setOrganization(data.organization);
        setFolderPath(data.organization.policyFolderPath || "");
        setSyncEnabled(data.organization.policyFolderSyncEnabled || false);
      }
    } catch (error) {
      console.error("Failed to fetch organization:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveFolderSettings() {
    if (!currentOrgId) return;

    setSaving(true);
    try {
      // Save directory handle to IndexedDB for persistence
      if (directoryHandle) {
        await saveDirectoryHandle(currentOrgId, directoryHandle);
      }

      const res = await fetch(`/api/organizations/${currentOrgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyFolderPath: folderPath || null,
          policyFolderSyncEnabled: syncEnabled,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save settings");
      }

      addToast({ title: "Folder settings saved successfully" });
      fetchOrganization();
    } catch (error) {
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  // Open native folder picker (File System Access API)
  async function handleBrowseFolder() {
    if (!window.showDirectoryPicker) {
      addToast({
        title: "Not Supported",
        description: "Your browser doesn't support folder selection. Please use Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    try {
      const handle = await window.showDirectoryPicker({
        id: "policy-folder",
        mode: "read",
        startIn: "documents",
      });

      setDirectoryHandle(handle);
      setFolderPath(handle.name); // Show folder name (we can't get full path for security)
      setFolderFiles([]);
      setFolderError(null);

      // Automatically scan after selecting
      await scanFolderWithHandle(handle);
    } catch (error) {
      // User cancelled the picker - that's fine, do nothing
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to open folder",
        variant: "destructive",
      });
    }
  }

  // Scan folder using File System Access API handle
  async function scanFolderWithHandle(handle: FileSystemDirectoryHandle) {
    console.log("Scanning folder with handle:", handle.name);
    setScanning(true);
    setFolderError(null);
    setFolderFiles([]);
    setHandlesReady(false); // Reset handles ready state
    fileHandlesRef.current.clear(); // Clear previous handles

    try {
      const files: FolderFile[] = [];

      for await (const entry of handle.values()) {
        if (entry.kind === "file") {
          const ext = "." + entry.name.split(".").pop()?.toLowerCase();
          if (SUPPORTED_EXTENSIONS.includes(ext)) {
            const fileHandle = entry as FileSystemFileHandle;
            const file = await fileHandle.getFile();
            console.log("Found file:", entry.name, "handle valid:", !!fileHandle);

            // Store handle in ref (refs persist properly unlike state for native objects)
            fileHandlesRef.current.set(entry.name, fileHandle);

            files.push({
              name: entry.name,
              path: entry.name,
              size: file.size,
              modified: file.lastModified ? new Date(file.lastModified).toISOString() : new Date().toISOString(),
              type: "file",
            });
          }
        }
      }

      // Sort by name
      files.sort((a, b) => a.name.localeCompare(b.name));

      console.log("Setting folderFiles, count:", files.length, "handles in ref:", fileHandlesRef.current.size);
      setFolderFiles(files);
      setHandlesReady(true); // Signal that handles are ready
      if (files.length === 0) {
        setFolderError("No policy files found. Supported formats: PDF, DOCX, DOC, TXT, MD, RTF");
      }
    } catch (error) {
      setFolderError(error instanceof Error ? error.message : "Failed to scan folder");
    } finally {
      setScanning(false);
    }
  }

  // Scan using stored handle or server API
  async function scanFolder() {
    if (directoryHandle) {
      await scanFolderWithHandle(directoryHandle);
      return;
    }

    // Fall back to server-side scanning if we have a path but no handle
    if (!folderPath) {
      setFolderError("Please select a folder first");
      return;
    }

    setScanning(true);
    setFolderError(null);
    setFolderFiles([]);

    try {
      const res = await fetch("/api/folder/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderPath }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to scan folder");
      }

      setFolderFiles(data.files || []);
      if (data.files?.length === 0) {
        setFolderError("No policy files found in this folder");
      }
    } catch (error) {
      setFolderError(error instanceof Error ? error.message : "Failed to scan folder");
    } finally {
      setScanning(false);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // Import a file from the folder as a new policy
  async function handleImportFile(file: FolderFile) {
    // Get handle from ref instead of from file object
    const fileHandle = fileHandlesRef.current.get(file.name);
    console.log("Importing file:", file.name, "fileHandle from ref:", !!fileHandle);

    if (!fileHandle) {
      addToast({
        title: "Error",
        description: "File handle not available. Please rescan the folder.",
        variant: "destructive",
      });
      return;
    }

    setImportingFile(file.name);

    try {
      // Get the file from the stored handle
      const fileData = await fileHandle.getFile();

      // Create form data to send to API
      const formData = new FormData();
      formData.append("file", fileData);

      const res = await fetch("/api/policies/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to import file");
      }

      addToast({
        title: "Policy imported",
        description: `"${data.policy.policy_name}" has been created`,
      });

      // Mark the file as imported
      setImportedFiles((prev) => new Set(prev).add(file.name));
    } catch (error) {
      addToast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import file",
        variant: "destructive",
      });
    } finally {
      setImportingFile(null);
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "org_admin":
        return "Administrator";
      case "org_user":
        return "User";
      case "org_viewer":
        return "Viewer";
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Profile
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Name</Label>
              <p className="font-medium">{session?.user?.name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="font-medium">{session?.user?.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Account Type</Label>
              <p className="font-medium">
                {session?.user?.isSuperAdmin ? (
                  <Badge variant="default">Super Admin</Badge>
                ) : (
                  "Standard User"
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {session?.user?.currentOrganization && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" /> Current Organization
            </CardTitle>
            <CardDescription>Your role in the selected organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Organization</Label>
                <p className="font-medium">{session.user.currentOrganization.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Role</Label>
                <p className="font-medium">
                  {getRoleDisplayName(session.user.currentOrganization.role)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Policy Folder Settings - Admin Only */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Policy Folder Mapping
            </CardTitle>
            <CardDescription>
              Map a local folder on your computer that contains your policy documents.
              This allows you to scan and import policies from your file system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="folderPath">Policy Folder</Label>
              <div className="flex gap-2">
                {supportsFileSystemAPI ? (
                  <>
                    <div className="flex-1 flex items-center px-3 rounded-md border bg-muted/50 text-sm">
                      {directoryHandle ? (
                        <span className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4 text-primary" />
                          {directoryHandle.name}
                        </span>
                      ) : folderPath ? (
                        <span className="flex items-center gap-2 text-amber-600">
                          <AlertTriangle className="h-4 w-4" />
                          {folderPath} (click Browse to reconnect)
                        </span>
                      ) : (
                        <span className="text-muted-foreground">No folder selected</span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleBrowseFolder}
                      title="Browse for folder"
                    >
                      <Search className="h-4 w-4" />
                      <span className="ml-2">Browse...</span>
                    </Button>
                  </>
                ) : (
                  <Input
                    id="folderPath"
                    value={folderPath}
                    onChange={(e) => setFolderPath(e.target.value)}
                    placeholder="C:\Policies or /Users/you/Documents/Policies"
                    className="flex-1"
                  />
                )}
                <Button
                  variant="outline"
                  onClick={scanFolder}
                  disabled={scanning || (!folderPath && !directoryHandle)}
                >
                  {scanning ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-2">Refresh</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {supportsFileSystemAPI
                  ? "Click Browse to select your policy documents folder. Supported: PDF, DOCX, DOC, TXT, MD, RTF"
                  : "Enter the full path to your folder. For better experience, use Chrome or Edge."}
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Enable Auto-Sync</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically detect changes to policy files in the mapped folder
                </p>
              </div>
              <Switch
                checked={syncEnabled}
                onCheckedChange={setSyncEnabled}
              />
            </div>

            {organization?.policyFolderLastSync && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Last synced: {new Date(organization.policyFolderLastSync).toLocaleString()}
              </div>
            )}

            <Button onClick={handleSaveFolderSettings} disabled={saving}>
              {saving ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Folder Settings
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Folder Scan Results */}
      {isAdmin && (folderFiles.length > 0 || folderError) && (
        <Card>
          <CardHeader>
            <CardTitle>Folder Contents</CardTitle>
            <CardDescription>
              {folderFiles.length > 0
                ? `Found ${folderFiles.length} file${folderFiles.length === 1 ? "" : "s"} in the folder`
                : "Scan results"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {folderError ? (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 text-red-800">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p>{folderError}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {folderFiles.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)} • Modified {new Date(file.modified).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {importedFiles.has(file.name) ? (
                      <button
                        disabled
                        style={{
                          backgroundColor: '#e5e7eb',
                          color: '#6b7280',
                          padding: '0.375rem 0.75rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          display: 'inline-flex',
                          alignItems: 'center',
                          cursor: 'default',
                        }}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Imported
                      </button>
                    ) : (
                      <button
                        onClick={() => handleImportFile(file)}
                        disabled={importingFile === file.name || !handlesReady}
                        style={{
                          backgroundColor: importingFile === file.name || !handlesReady ? '#9ca3af' : '#16a34a',
                          color: 'white',
                          padding: '0.375rem 0.75rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          display: 'inline-flex',
                          alignItems: 'center',
                          cursor: importingFile === file.name || !handlesReady ? 'not-allowed' : 'pointer',
                          border: 'none',
                        }}
                      >
                        {importingFile === file.name ? (
                          <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                        ) : null}
                        {importingFile === file.name ? "Importing..." : "Import"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" /> About PolicyVault
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            PolicyVault is a multi-tenant cybersecurity policy management platform that enables
            organizations to track, manage, and analyze their security policies
            against compliance frameworks.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Version 2.0.0 (Multi-Tenant MSSP Platform)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
