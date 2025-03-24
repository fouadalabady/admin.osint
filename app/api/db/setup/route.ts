import { NextResponse } from 'next/server';
import {
  checkTablesExist,
  initExecSQLFunction,
  setupRegistrationTables,
} from '@/lib/database-helpers';

// Helper function to check if error object has a message property
function hasErrorMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

export async function GET() {
  try {
    // First, check if our tables already exist
    const tablesExist = await checkTablesExist();

    if (tablesExist.exists) {
      return NextResponse.json({
        success: true,
        message: 'Database already setup',
        tables: tablesExist.tables,
        skipReason: 'Tables already exist',
      });
    }

    // Try to setup tables
    const setupResult = await setupRegistrationTables();

    // If setup failed with an error about exec_sql not existing
    if (
      !setupResult.success &&
      setupResult.error &&
      hasErrorMessage(setupResult.error) &&
      setupResult.error.message.includes('function "exec_sql" does not exist')
    ) {
      // Try to initialize the exec_sql function first
      const initResult = await initExecSQLFunction();

      if (!initResult.success) {
        // If that failed too, we need to create the function using direct SQL
        return NextResponse.json(
          {
            success: false,
            error: 'Could not initialize exec_sql function',
            message: 'Please run the SQL script manually in Supabase SQL Editor',
            initError: initResult.error,
            manualSetupRequired: true,
          },
          { status: 500 }
        );
      }

      // Try again after initializing the function
      const retryResult = await setupRegistrationTables();

      if (!retryResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Setup failed after initializing exec_sql function',
            message: 'Please run the SQL script manually in Supabase SQL Editor',
            setupError: retryResult.error,
            manualSetupRequired: true,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Database setup completed successfully',
        tables: retryResult.tables,
      });
    }

    if (!setupResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: setupResult.message || 'Setup failed',
          message: 'Please run the SQL script manually in Supabase SQL Editor',
          setupError: setupResult.error,
          manualSetupRequired: true,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully',
      tables: setupResult.tables,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error setting up database:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to setup database',
        manualSetupRequired: true,
      },
      { status: 500 }
    );
  }
}
