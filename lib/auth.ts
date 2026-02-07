import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { query } from "./db";

interface UserOrganization {
  id: string;
  name: string;
  slug: string;
  role: "org_admin" | "org_user" | "org_viewer";
  isPrimary: boolean;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Fetch user with is_super_admin flag
        const result = await query(
          "SELECT id, email, name, password_hash, is_active, is_super_admin FROM users WHERE email = $1",
          [credentials.email]
        );

        const user = result.rows[0];
        if (!user || !user.is_active) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password_hash);
        if (!isValid) {
          return null;
        }

        // Fetch user's organizations
        const orgsResult = await query(
          `SELECT o.id, o.name, o.slug, om.role, om.is_primary
           FROM organizations o
           JOIN organization_members om ON o.id = om.organization_id
           WHERE om.user_id = $1 AND o.is_active = true
           ORDER BY om.is_primary DESC, o.name ASC`,
          [user.id]
        );

        const organizations: UserOrganization[] = orgsResult.rows.map((row) => ({
          id: row.id,
          name: row.name,
          slug: row.slug,
          role: row.role,
          isPrimary: row.is_primary,
        }));

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isSuperAdmin: user.is_super_admin,
          organizations,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.isSuperAdmin = user.isSuperAdmin;
        token.organizations = user.organizations;

        // Set default organization to primary or first available
        const primaryOrg = user.organizations.find((o) => o.isPrimary);
        token.currentOrganizationId = primaryOrg?.id || user.organizations[0]?.id;
      }

      // Handle organization switching
      if (trigger === "update" && session?.currentOrganizationId) {
        // Verify user has access to the organization
        const hasAccess = token.organizations?.some(
          (org: UserOrganization) => org.id === session.currentOrganizationId
        );
        if (hasAccess) {
          token.currentOrganizationId = session.currentOrganizationId;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isSuperAdmin = token.isSuperAdmin as boolean;
        session.user.organizations = token.organizations as UserOrganization[];

        // Set current organization context
        const currentOrgId = token.currentOrganizationId as string;
        const currentOrg = session.user.organizations?.find((o) => o.id === currentOrgId);

        if (currentOrg) {
          session.user.currentOrganization = {
            id: currentOrg.id,
            name: currentOrg.name,
            slug: currentOrg.slug,
            role: currentOrg.role,
          };
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Helper function to refresh user's organization list
export async function refreshUserOrganizations(userId: string): Promise<UserOrganization[]> {
  const orgsResult = await query(
    `SELECT o.id, o.name, o.slug, om.role, om.is_primary
     FROM organizations o
     JOIN organization_members om ON o.id = om.organization_id
     WHERE om.user_id = $1 AND o.is_active = true
     ORDER BY om.is_primary DESC, o.name ASC`,
    [userId]
  );

  return orgsResult.rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    role: row.role,
    isPrimary: row.is_primary,
  }));
}
