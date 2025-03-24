"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Database, RefreshCw } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if user is a super admin
  if (status === "loading") {
    return <div className="flex justify-center items-center min-h-screen">
      <RefreshCw className="animate-spin h-6 w-6 text-primary" />
    </div>;
  }

  if (status === "unauthenticated") {
    router.replace("/auth/login");
    return null;
  }

  if (session?.user?.role !== "super_admin") {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            Only super administrators can access the setup page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const setupOtpTable = async () => {
    setLoading("otp");
    setSuccess(null);
    setError(null);

    try {
      const response = await fetch("/api/db/create-otp-table", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create OTP table");
      }

      setSuccess(`OTP table created successfully: ${data.message}`);
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Database Setup</h1>
      <p className="mb-6 text-gray-600 dark:text-gray-400">
        Use this page to set up required database tables and functions for the application.
        Only proceed if you know what you're doing.
      </p>

      {success && (
        <Alert className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              OTP Verifications Table
            </CardTitle>
            <CardDescription>
              Sets up the table for storing one-time password verification codes used in password reset.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This will create the <code>otp_verifications</code> table with proper indexes and security policies.
              Required for the password reset functionality.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={setupOtpTable} 
              disabled={loading === "otp"}
              className="w-full"
            >
              {loading === "otp" ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Set up OTP Table"
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Additional setup cards can be added here */}
      </div>
    </div>
  );
} 