"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { Shield, User, Building2, FolderOpen, RefreshCw, Save, AlertTriangle, CheckCircle, FileText } from "lucide-react";
import { Organization } from "@/types/organization";

interface FolderFile {
  name: string;
  path: string;
  size: number;
  modified: string;
  type: "file" | "directory";
}

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

  const currentOrgId = session?.user?.currentOrganization?.id;
  const isAdmin = session?.user?.currentOrganization?.role === "org_admin" || session?.user?.isSuperAdmin;

  useEffect(() => {
    if (currentOrgId) {
      fetchOrganization();
    } else {
      setLoading(false);
    }
  }, [currentOrgId]);

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

  async function scanFolder() {
    if (!folderPath) {
      setFolderError("Please enter a folder path first");
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
              <Label htmlFor="folderPath">Local Folder Path</Label>
              <div className="flex gap-2">
                <Input
                  id="folderPath"
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  placeholder="C:\Policies or /Users/you/Documents/Policies"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={scanFolder}
                  disabled={scanning || !folderPath}
                >
                  {scanning ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <FolderOpen className="h-4 w-4" />
                  )}
                  <span className="ml-2">Scan</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the full path to your policy documents folder. Supported formats: PDF, DOCX, DOC, TXT, MD
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
                    <Button variant="outline" size="sm">
                      Import
                    </Button>
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
