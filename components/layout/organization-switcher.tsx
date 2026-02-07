"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { Building2, Check, ChevronDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function OrganizationSwitcher() {
  const { data: session, update } = useSession();
  const [switching, setSwitching] = useState(false);

  const currentOrg = session?.user?.currentOrganization;
  const organizations = session?.user?.organizations || [];
  const isSuperAdmin = session?.user?.isSuperAdmin;

  async function switchOrganization(organizationId: string) {
    if (organizationId === currentOrg?.id) return;

    setSwitching(true);
    try {
      const res = await fetch("/api/auth/switch-organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });

      if (res.ok) {
        // Update the session with the new organization
        await update({ currentOrganizationId: organizationId });
        // Refresh the page to load new org data
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to switch organization:", error);
    } finally {
      setSwitching(false);
    }
  }

  if (!currentOrg && organizations.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between gap-2"
          disabled={switching}
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <span className="truncate">{currentOrg?.name || "Select Organization"}</span>
          </div>
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => switchOrganization(org.id)}
            className="cursor-pointer"
          >
            <div className="flex w-full items-center justify-between">
              <div className="flex flex-col">
                <span className="font-medium">{org.name}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {org.role.replace("org_", "")}
                  {org.isPrimary && " • Primary"}
                </span>
              </div>
              {org.id === currentOrg?.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
        {isSuperAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/organizations/new" className="cursor-pointer">
                <Plus className="mr-2 h-4 w-4" />
                Create Organization
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
