import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';

export async function GET() {
  try {
    // Read the SQL file from the public directory
    const filePath = path.join(process.cwd(), 'public', 'direct-setup.sql');
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Serve the file with appropriate content type
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': 'attachment; filename="complete-setup.sql"',
      },
    });
  } catch (error) {
    console.error('Error serving SQL file:', error);
    return NextResponse.json({ error: 'Failed to serve SQL file' }, { status: 500 });
  }
}
