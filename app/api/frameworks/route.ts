import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { listFrameworks } from "@/lib/queries/frameworks";

export async function GET() {
  try {
    await requireSession();
    const frameworks = await listFrameworks();
    return NextResponse.json(frameworks);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
