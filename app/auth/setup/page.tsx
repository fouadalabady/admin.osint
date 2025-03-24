'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Download, Database, Terminal, Code, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function SetupPage() {
  const [setupStatus, setSetupStatus] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
  }>({});

  const handleDirectSetup = async () => {
    try {
      setSetupStatus({ message: 'Setting up database...' });
      const response = await fetch('/api/db/direct-setup');
      const data = await response.json();

      setSetupStatus({
        success: data.success,
        message: data.message,
        error: data.success ? undefined : JSON.stringify(data.error || data.details || {}, null, 2),
      });
    } catch (error) {
      setSetupStatus({
        success: false,
        message: 'Failed to run setup',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8 flex flex-col">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Database Setup</CardTitle>
          <CardDescription>
            Configure the database for user registration and OTP verification
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-2 text-sm">
            {/* Status message box */}
            {setupStatus.message && (
              <div
                className={`rounded-md ${
                  setupStatus.success
                    ? 'bg-green-50 text-green-600'
                    : 'bg-destructive/15 text-destructive'
                } p-4 mb-4`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">
                    {setupStatus.success ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <AlertCircle className="h-5 w-5" />
                    )}
                  </span>
                  <span className="font-semibold">{setupStatus.success ? 'Success' : 'Error'}</span>
                </div>
                <p>{setupStatus.message}</p>
                {setupStatus.error && (
                  <pre className="mt-2 bg-muted p-2 rounded text-xs overflow-auto">
                    {setupStatus.error}
                  </pre>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm">
                    1
                  </span>
                  <h3 className="font-medium">Check Setup Status</h3>
                </div>
                <p className="text-sm text-muted-foreground ml-11 mb-3">
                  Verify if required database tables already exist
                </p>
                <div className="ml-11">
                  <Button variant="outline" size="sm" className="mt-2">
                    Check Status
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm">
                    2
                  </span>
                  <h3 className="font-medium">Initialize Database Functions</h3>
                </div>
                <p className="text-sm text-muted-foreground ml-11 mb-3">
                  Create required PostgreSQL functions for setup
                </p>
                <div className="ml-11">
                  <Button variant="outline" size="sm" className="mt-2">
                    Initialize Functions
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm">
                    3
                  </span>
                  <h3 className="font-medium">Setup Database</h3>
                </div>
                <p className="text-sm text-muted-foreground ml-11 mb-3">
                  Create tables, indexes, and security policies
                </p>
                <div className="ml-11">
                  <Button variant="outline" size="sm" className="mt-2">
                    Setup Database
                  </Button>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <h3 className="font-semibold mb-3">Direct Setup</h3>
            <p className="text-sm text-muted-foreground mb-4">
              For quicker setup, you can use the direct setup method which bypasses the dependency
              on PostgreSQL functions.
            </p>

            <div className="ml-2 mb-4 flex flex-col gap-2">
              <Button
                variant="default"
                size="sm"
                className="gap-2 w-fit"
                onClick={handleDirectSetup}
                disabled={setupStatus.message === 'Setting up database...'}
              >
                <Database className="h-4 w-4" />
                {setupStatus.message === 'Setting up database...'
                  ? 'Setting up...'
                  : 'Run Direct Setup'}
              </Button>

              <Button asChild variant="outline" size="sm" className="gap-2 w-fit">
                <a
                  href="#"
                  onClick={() => {
                    navigator.clipboard.writeText('npm run setup-db');
                    alert('Command copied to clipboard!');
                  }}
                >
                  <Code className="h-4 w-4" />
                  npm run setup-db
                </a>
              </Button>
            </div>

            <Separator className="my-6" />

            <h3 className="font-semibold mb-3">Manual Setup Instructions</h3>
            <p className="text-sm text-muted-foreground mb-4">
              If automatic setup fails, you can run the SQL manually in the Supabase SQL Editor:
            </p>

            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li className="text-sm">Log into your Supabase dashboard</li>
              <li className="text-sm">Navigate to SQL Editor</li>
              <li className="text-sm">Run the SQL setup script below</li>
            </ol>

            <div className="ml-2 mt-4 flex flex-col gap-2">
              <Button asChild variant="outline" size="sm" className="gap-2 w-fit">
                <Link href="/setup-database.sql" download>
                  <Download className="h-4 w-4" />
                  Download Complete Database Setup SQL
                </Link>
              </Button>

              <p className="text-xs text-muted-foreground mt-2">
                Or you can download separate scripts:
              </p>

              <div className="flex flex-col gap-2 ml-1">
                <Button asChild variant="outline" size="sm" className="gap-2 w-fit">
                  <Link href="/create-exec-sql.sql" download>
                    <Terminal className="h-4 w-4" />
                    Download exec_sql Function Setup
                  </Link>
                </Button>

                <Button asChild variant="outline" size="sm" className="gap-2 w-fit">
                  <Link href="/direct-setup.sql" download>
                    <Download className="h-4 w-4" />
                    Download Tables Setup SQL
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t px-6 py-4">
          <p className="text-xs text-muted-foreground">© 2025 Your Company. All rights reserved.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
