import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'direct-setup.sql');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': 'attachment; filename="complete-setup.sql"'
      }
    });
  } catch (error: unknown) {
    const err = error instanceof Error 
      ? error 
      : new Error(String(error));
      
    console.error("Error serving SQL file:", err);
    return NextResponse.json(
      { error: err.message || "Failed to serve SQL file" },
      { status: 500 }
    );
  }
} 