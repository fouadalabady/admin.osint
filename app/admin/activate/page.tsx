"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function ActivateAdminPage() {
  const [email, setEmail] = useState("fouadelabady@gmail.com");
  const [adminKey, setAdminKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/activate-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, adminKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to activate admin user");
      }

      setSuccess(`Admin user ${email} activated successfully!`);
    } catch (err) {
      console.error("Error activating admin:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex justify-center items-center min-h-screen py-8">
      <div className="w-full max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Activate Admin User</CardTitle>
            <CardDescription>
              Activate a super admin user for the dashboard
            </CardDescription>
          </CardHeader>

          {error && (
            <div className="px-6 pb-3">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {success && (
            <div className="px-6 pb-3">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            </div>
          )}

          {success && (
            <div className="flex flex-col items-center mt-4">
              <Button asChild className="mt-4">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          )}

          <CardContent>
            <form onSubmit={handleActivate} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Admin Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="adminKey" className="text-sm font-medium">
                  Admin Activation Key
                </label>
                <Input
                  id="adminKey"
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="Enter the admin activation key"
                />
                <p className="text-xs text-muted-foreground">
                  This is the key set in your environment variables as ADMIN_ACTIVATION_KEY
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Activating..." : "Activate Admin User"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-between">
            <p className="text-xs text-muted-foreground">
              This tool is for initial setup only. Use with caution.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 