import { NextRequest, NextResponse } from "next/server";
import { requireOrgUser } from "@/lib/session";
import { createPolicy, createPolicyVersion } from "@/lib/queries/policies";
import { query } from "@/lib/db";
import { logAudit } from "@/lib/queries/audit";
import { extractText } from "@/lib/services/document-parser";
import { randomUUID } from "crypto";
import { createHash } from "crypto";
import * as fs from "fs/promises";
import * as path from "path";

// Generate a policy code from filename
function generatePolicyCode(filename: string): string {
  // Remove extension
  const name = filename.replace(/\.[^.]+$/, "");
  // Convert to uppercase, replace spaces/special chars with underscores
  const code = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .substring(0, 20);
  // Add random suffix to ensure uniqueness
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${code}_${suffix}`;
}

// Generate a policy name from filename
function generatePolicyName(filename: string): string {
  // Remove extension
  const name = filename.replace(/\.[^.]+$/, "");
  // Convert underscores/dashes to spaces and title case
  return name
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function POST(request: NextRequest) {
  console.log("Import API called");
  try {
    const { session, organizationId } = await requireOrgUser();
    console.log("Session verified, org:", organizationId);

    const formData = await request.formData();
    const file = formData.get("file") as File;
    console.log("File received:", file?.name, file?.size);
    const customName = formData.get("policyName") as string | null;
    const customCode = formData.get("policyCode") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedExtensions = [".docx", ".pdf", ".doc", ".txt", ".md", ".rtf"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { error: "Only .docx, .pdf, .doc, .txt, .md, and .rtf files are accepted" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const hash = createHash("sha256").update(buffer).digest("hex");
    const savedFilename = `${randomUUID()}${ext}`;
    const uploadDir = process.env.UPLOAD_DIR || "./uploads";
    const filePath = path.join(uploadDir, savedFilename);

    // Ensure upload directory exists
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(filePath, buffer);

    // Extract text content
    let contentText = "";
    try {
      contentText = await extractText(buffer, file.name);
    } catch (err) {
      console.error("Text extraction failed:", err);
    }

    // Generate policy name and code if not provided
    const policyName = customName || generatePolicyName(file.name);
    const policyCode = customCode || generatePolicyCode(file.name);

    // Create the policy
    const policy = await createPolicy(
      organizationId,
      {
        policy_code: policyCode,
        policy_name: policyName,
        description: `Imported from file: ${file.name}`,
        classification: "Internal",
        review_frequency_months: 12,
      },
      session.user.id
    );

    // Update with document info
    await query(
      `UPDATE policies SET
        document_filename = $1,
        document_path = $2,
        document_hash = $3,
        document_size_bytes = $4,
        document_content_text = $5,
        updated_at = now()
       WHERE id = $6`,
      [file.name, filePath, hash, buffer.length, contentText || null, policy.id]
    );

    // Create initial version
    await createPolicyVersion(policy.id, "imported", session.user.id, `Imported from file: ${file.name}`);

    // Log audit
    await logAudit(organizationId, session.user.id, "policy.imported", "policy", policy.id, {
      filename: file.name,
      size: buffer.length,
      policy_name: policyName,
      policy_code: policyCode,
      text_extracted: !!contentText,
    });

    return NextResponse.json({
      success: true,
      policy: {
        id: policy.id,
        policy_code: policyCode,
        policy_name: policyName,
      },
      document: {
        filename: file.name,
        size: buffer.length,
        text_extracted: !!contentText,
        text_length: contentText.length,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden") || error.message.includes("Requires")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (error.message === "No organization selected") {
        return NextResponse.json({ error: "No organization selected" }, { status: 400 });
      }
    }
    console.error("Import error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
