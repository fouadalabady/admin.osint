import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * API endpoint to set up the database using the SQL scripts
 * This should only be used in development environments
 */
export async function GET() {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development environments' },
        { status: 403 }
      );
    }

    const supabase = createClient();
    
    // Read the main setup script
    const sqlDir = path.join(process.cwd(), 'sql');
    const mainScript = fs.readFileSync(
      path.join(sqlDir, '00_run_all.sql'),
      'utf8'
    );
    
    // Replace \i commands with actual file contents
    const processedScript = mainScript.replace(
      /\\i\s+sql\/(.+\.sql)/g,
      (match, filename) => {
        try {
          return fs.readFileSync(path.join(sqlDir, filename), 'utf8');
        } catch (err) {
          console.error(`Error reading SQL file ${filename}:`, err);
          return `-- Error loading ${filename}\n`;
        }
      }
    );
    
    // Execute the compiled script
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: processedScript,
    });

    if (error) {
      console.error('Error setting up database:', error);
      return NextResponse.json(
        { error: 'Database setup failed', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully',
      data,
    });
  } catch (err) {
    console.error('Error in database setup endpoint:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: err },
      { status: 500 }
    );
  }
}
