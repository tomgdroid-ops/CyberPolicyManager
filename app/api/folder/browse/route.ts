import { NextRequest, NextResponse } from "next/server";
import { requireOrgAdmin } from "@/lib/session";
import fs from "fs";
import path from "path";
import os from "os";

interface FolderEntry {
  name: string;
  path: string;
  type: "directory" | "file";
}

// Get common starting points for folder browsing
function getStartingPoints(): FolderEntry[] {
  const points: FolderEntry[] = [];
  const platform = os.platform();

  if (platform === "win32") {
    // Windows: Check common drives
    const drives = ["C:", "D:", "E:", "F:"];
    for (const drive of drives) {
      try {
        if (fs.existsSync(drive + "\\")) {
          points.push({
            name: drive,
            path: drive + "\\",
            type: "directory",
          });
        }
      } catch {
        // Drive doesn't exist or not accessible
      }
    }

    // Add user folders
    const userProfile = process.env.USERPROFILE;
    if (userProfile) {
      const userFolders = ["Documents", "Desktop", "Downloads"];
      for (const folder of userFolders) {
        const folderPath = path.join(userProfile, folder);
        if (fs.existsSync(folderPath)) {
          points.push({
            name: folder,
            path: folderPath,
            type: "directory",
          });
        }
      }
    }
  } else {
    // Unix/Mac
    points.push({ name: "Root", path: "/", type: "directory" });

    const home = os.homedir();
    if (home) {
      points.push({ name: "Home", path: home, type: "directory" });

      const userFolders = ["Documents", "Desktop", "Downloads"];
      for (const folder of userFolders) {
        const folderPath = path.join(home, folder);
        if (fs.existsSync(folderPath)) {
          points.push({
            name: folder,
            path: folderPath,
            type: "directory",
          });
        }
      }
    }
  }

  return points;
}

export async function POST(request: NextRequest) {
  try {
    await requireOrgAdmin();

    const body = await request.json();
    const { folderPath } = body;

    // If no path provided, return starting points
    if (!folderPath) {
      return NextResponse.json({
        currentPath: null,
        parentPath: null,
        entries: getStartingPoints(),
        isRoot: true,
      });
    }

    // Normalize and validate path
    const normalizedPath = path.normalize(folderPath);

    // Security: prevent path traversal
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
        { error: "Folder not found or not accessible" },
        { status: 404 }
      );
    }

    // Read directory contents
    const dirEntries = fs.readdirSync(normalizedPath, { withFileTypes: true });

    const entries: FolderEntry[] = [];

    for (const entry of dirEntries) {
      // Skip hidden files/folders
      if (entry.name.startsWith(".")) continue;

      // Only include directories
      if (entry.isDirectory()) {
        const fullPath = path.join(normalizedPath, entry.name);

        // Check if we can access this directory
        try {
          fs.accessSync(fullPath, fs.constants.R_OK);
          entries.push({
            name: entry.name,
            path: fullPath,
            type: "directory",
          });
        } catch {
          // Skip inaccessible directories
        }
      }
    }

    // Sort alphabetically
    entries.sort((a, b) => a.name.localeCompare(b.name));

    // Calculate parent path
    const parentPath = path.dirname(normalizedPath);
    const isRoot = parentPath === normalizedPath; // At root when parent equals current

    return NextResponse.json({
      currentPath: normalizedPath,
      parentPath: isRoot ? null : parentPath,
      entries,
      isRoot,
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
    console.error("Folder browse error:", error);
    return NextResponse.json(
      { error: "Failed to browse folder" },
      { status: 500 }
    );
  }
}
