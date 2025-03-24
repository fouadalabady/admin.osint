import { NextResponse } from 'next/server';
import { initExecSQLFunction } from '@/lib/database-helpers';

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
    // Initialize the exec_sql function
    const result = await initExecSQLFunction();

    if (!result.success) {
      const errorMessage = hasErrorMessage(result.error) ? result.error.message : 'Unknown error';

      console.error('Failed to initialize exec_sql function:', errorMessage);

      return NextResponse.json(
        {
          success: false,
          message: 'Failed to initialize SQL execution function',
          error: errorMessage,
          manualSetupRequired: true,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'SQL execution function created successfully',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error initializing SQL function:', errorMessage);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to initialize SQL execution function',
        error: errorMessage,
        manualSetupRequired: true,
      },
      { status: 500 }
    );
  }
}
