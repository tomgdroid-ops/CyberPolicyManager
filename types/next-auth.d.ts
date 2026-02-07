import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      isSuperAdmin: boolean;
      currentOrganization?: {
        id: string;
        name: string;
        slug: string;
        role: "org_admin" | "org_user" | "org_viewer";
      };
      organizations: Array<{
        id: string;
        name: string;
        slug: string;
        role: "org_admin" | "org_user" | "org_viewer";
        isPrimary: boolean;
      }>;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    isSuperAdmin: boolean;
    organizations: Array<{
      id: string;
      name: string;
      slug: string;
      role: "org_admin" | "org_user" | "org_viewer";
      isPrimary: boolean;
    }>;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    isSuperAdmin: boolean;
    currentOrganizationId?: string;
    organizations: Array<{
      id: string;
      name: string;
      slug: string;
      role: "org_admin" | "org_user" | "org_viewer";
      isPrimary: boolean;
    }>;
  }
}
