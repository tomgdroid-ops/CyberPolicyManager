import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getFrameworkById, getFrameworkCategories } from "@/lib/queries/frameworks";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    const framework = await getFrameworkById(id);
    if (!framework) {
      return NextResponse.json({ error: "Framework not found" }, { status: 404 });
    }
    const categories = await getFrameworkCategories(id);
    return NextResponse.json({ ...framework, categories });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
