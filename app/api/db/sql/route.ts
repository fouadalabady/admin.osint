import { NextResponse } from "next/server";
import { setupProceduresSQL, setupCommands } from "@/public/setup-sql";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  
  // Return the requested SQL type
  if (type === 'procedures') {
    return new NextResponse(setupProceduresSQL, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': 'attachment; filename="setup_procedures.sql"'
      }
    });
  } else if (type === 'commands') {
    return new NextResponse(setupCommands, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': 'attachment; filename="setup_commands.sql"'
      }
    });
  } else {
    // Return both in JSON format if no specific type requested
    return NextResponse.json({
      procedures: setupProceduresSQL,
      commands: setupCommands
    });
  }
} 