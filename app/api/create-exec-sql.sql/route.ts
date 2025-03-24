import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "create-exec-sql.sql");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    return new NextResponse(fileContent, {
      headers: {
        "Content-Type": "application/sql",
        "Content-Disposition": 'attachment; filename="create-exec-sql.sql"',
      },
    });
  } catch (error) {
    console.error("Error serving SQL file:", error);
    return NextResponse.json(
      { error: "Failed to serve SQL file" },
      { status: 500 }
    );
  }
} 