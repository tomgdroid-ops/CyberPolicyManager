import { NextRequest, NextResponse } from "next/server";
import { requireOrganization } from "@/lib/session";
import { updateMapping, deleteMapping, verifyMapping } from "@/lib/queries/mappings";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; mappingId: string }> }) {
  try {
    const { organizationId } = await requireOrganization();
    const { mappingId } = await params;
    const body = await request.json();

    const updated = await updateMapping(mappingId, organizationId, body.coverage, body.notes);
    if (!updated) {
      return NextResponse.json({ error: "Mapping not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; mappingId: string }> }) {
  try {
    const { organizationId } = await requireOrganization();
    const { mappingId } = await params;
    const deleted = await deleteMapping(mappingId, organizationId);
    if (!deleted) {
      return NextResponse.json({ error: "Mapping not found" }, { status: 404 });
    }
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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; mappingId: string }> }) {
  try {
    const { session, organizationId } = await requireOrganization();
    const { mappingId } = await params;
    const verified = await verifyMapping(mappingId, organizationId, session.user.id);
    if (!verified) {
      return NextResponse.json({ error: "Mapping not found" }, { status: 404 });
    }
    return NextResponse.json(verified);
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
