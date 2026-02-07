import { NextRequest, NextResponse } from "next/server";
import { requireOrganization } from "@/lib/session";
import { getUserNotifications, markAllNotificationsRead } from "@/lib/queries/notifications";

export async function GET(request: NextRequest) {
  try {
    const { session, organizationId } = await requireOrganization();
    const { searchParams } = new URL(request.url);

    const result = await getUserNotifications(session.user.id, organizationId, {
      unreadOnly: searchParams.get("unread") === "true",
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "No organization selected") {
        return NextResponse.json({ error: "No organization selected" }, { status: 400 });
      }
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT() {
  try {
    const { session, organizationId } = await requireOrganization();
    await markAllNotificationsRead(session.user.id, organizationId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "No organization selected") {
        return NextResponse.json({ error: "No organization selected" }, { status: 400 });
      }
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
