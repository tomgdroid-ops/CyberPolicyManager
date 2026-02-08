import { NextRequest, NextResponse } from "next/server";
import { requireOrgAdmin } from "@/lib/session";
import fs from "fs";
import path from "path";

// Supported policy file extensions
const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".doc", ".txt", ".md", ".rtf"];

interface FileInfo {
  name: string;
  path: string;
  size: number;
  modified: string;
  type: "file" | "directory";
  extension: string;
}

export async function POST(request: NextRequest) {
  try {
    await requireOrgAdmin();

    const body = await request.json();
    const { folderPath } = body;

    if (!folderPath || typeof folderPath !== "string") {
      return NextResponse.json(
        { error: "Folder path is required" },
        { status: 400 }
      );
    }

    // Normalize the path
    const normalizedPath = path.normalize(folderPath);

    // Security check: prevent path traversal
    if (normalizedPath.includes("..")) {
      return NextResponse.json(
        { error: "Invalid folder path" },
        { status: 400 }
      );
    }

    // Check if path exists and is a directory
    try {
      const stats = fs.statSync(normalizedPath);
      if (!stats.isDirectory()) {
        return NextResponse.json(
          { error: "Path is not a directory" },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Folder not found or not accessible. Make sure the path exists on the server." },
        { status: 404 }
      );
    }

    // Read directory contents
    const entries = fs.readdirSync(normalizedPath, { withFileTypes: true });

    const files: FileInfo[] = [];

    for (const entry of entries) {
      // Skip hidden files
      if (entry.name.startsWith(".")) continue;

      const fullPath = path.join(normalizedPath, entry.name);

      try {
        const stats = fs.statSync(fullPath);

        if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();

          // Only include supported file types
          if (SUPPORTED_EXTENSIONS.includes(ext)) {
            files.push({
              name: entry.name,
              path: fullPath,
              size: stats.size,
              modified: stats.mtime.toISOString(),
              type: "file",
              extension: ext,
            });
          }
        } else if (entry.isDirectory()) {
          // Include directories so user can navigate
          files.push({
            name: entry.name,
            path: fullPath,
            size: 0,
            modified: stats.mtime.toISOString(),
            type: "directory",
            extension: "",
          });
        }
      } catch {
        // Skip files we can't access
        continue;
      }
    }

    // Sort: directories first, then files alphabetically
    files.sort((a, b) => {
      if (a.type === "directory" && b.type === "file") return -1;
      if (a.type === "file" && b.type === "directory") return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      files,
      folderPath: normalizedPath,
      supportedExtensions: SUPPORTED_EXTENSIONS,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden") || error.message.includes("Requires")) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }
    }
    console.error("Folder scan error:", error);
    return NextResponse.json(
      { error: "Failed to scan folder" },
      { status: 500 }
    );
  }
}
