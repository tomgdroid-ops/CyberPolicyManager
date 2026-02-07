import { NextRequest, NextResponse } from "next/server";
import { requireOrganization } from "@/lib/session";
import { markNotificationRead } from "@/lib/queries/notifications";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { session, organizationId } = await requireOrganization();
    const { id } = await params;
    await markNotificationRead(id, session.user.id, organizationId);
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
