import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/policies/:path*",
    "/frameworks/:path*",
    "/compliance/:path*",
    "/reports/:path*",
    "/notifications/:path*",
    "/settings/:path*",
    "/api/policies/:path*",
    "/api/frameworks/:path*",
    "/api/analysis/:path*",
    "/api/dashboard/:path*",
    "/api/notifications/:path*",
    "/api/users/:path*",
  ],
};
