import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getFrameworkControls, searchControls, getControlById, getControlBestPractices } from "@/lib/queries/frameworks";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search");
    const categoryId = searchParams.get("category_id") || undefined;
    const controlId = searchParams.get("control_id");

    // Single control detail with best practices
    if (controlId) {
      const control = await getControlById(controlId);
      if (!control) {
        return NextResponse.json({ error: "Control not found" }, { status: 404 });
      }
      const bestPractices = await getControlBestPractices(controlId);
      return NextResponse.json({ ...control, best_practices: bestPractices });
    }

    // Search
    if (search) {
      const results = await searchControls(id, search);
      return NextResponse.json(results);
    }

    // List controls for framework
    const controls = await getFrameworkControls(id, categoryId);
    return NextResponse.json(controls);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
