import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getPolicyById } from "@/lib/queries/policies";
import { query } from "@/lib/db";
import { logAudit } from "@/lib/queries/audit";
import { extractText } from "@/lib/services/document-parser";
import { randomUUID } from "crypto";
import { createHash } from "crypto";
import * as fs from "fs/promises";
import * as path from "path";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const policy = await getPolicyById(id);
    if (!policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }
    if (policy.status !== "draft" && policy.status !== "revision") {
      return NextResponse.json({ error: "Can only upload documents for policies in draft or revision status" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedExtensions = [".docx", ".pdf"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json({ error: "Only .docx and .pdf files are accepted" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const hash = createHash("sha256").update(buffer).digest("hex");
    const savedFilename = `${randomUUID()}${ext}`;
    const uploadDir = process.env.UPLOAD_DIR || "./uploads";
    const filePath = path.join(uploadDir, savedFilename);

    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(filePath, buffer);

    // Extract text content
    let contentText = "";
    try {
      contentText = await extractText(buffer, file.name);
    } catch (err) {
      console.error("Text extraction failed:", err);
    }

    // Delete old file if exists
    if (policy.document_path) {
      try {
        await fs.unlink(policy.document_path);
      } catch {
        // ignore
      }
    }

    await query(
      `UPDATE policies SET
        document_filename = $1,
        document_path = $2,
        document_hash = $3,
        document_size_bytes = $4,
        document_content_text = $5,
        updated_at = now()
       WHERE id = $6`,
      [file.name, filePath, hash, buffer.length, contentText || null, id]
    );

    await logAudit(session.user.id, "policy.document_uploaded", "policy", id, {
      filename: file.name,
      size: buffer.length,
      text_extracted: !!contentText,
    });

    return NextResponse.json({
      success: true,
      filename: file.name,
      size: buffer.length,
      text_extracted: !!contentText,
      text_length: contentText.length,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
