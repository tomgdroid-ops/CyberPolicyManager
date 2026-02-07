"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, User, Building2 } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();

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

  return (
    <div className="space-y-6 max-w-2xl">
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
