"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (!email.trim()) {
      setError("Please enter your email address");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setSuccess("Password reset instructions have been sent to your email");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send reset instructions";
      setError(errorMessage);
      console.error("Password reset error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex flex-col justify-center items-center min-h-screen py-8">
      <div className="w-full max-w-md mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            asChild
            className="mb-2"
          >
            <Link href="/auth/login" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </Button>
        </div>
        
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Mail className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-center pt-4">
              Forgot Password
            </CardTitle>
            <CardDescription className="text-center">
              Enter your email address and we&apos;ll send you instructions to reset your password
            </CardDescription>
          </CardHeader>
          
          {error && (
            <div className="px-6 mb-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}
          
          {success ? (
            <CardContent className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
              
              <div className="p-4 bg-muted rounded-md">
                <h3 className="font-medium mb-2">Next steps:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Check your email inbox (and spam folder)</li>
                  <li>Follow the link in the email or use the verification code</li>
                  <li>Create a new strong password</li>
                </ol>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Didn&apos;t receive the email? Check your spam folder or try again in a few minutes.
              </p>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSuccess("");
                  setEmail("");
                }}
              >
                Reset Another Account
              </Button>
            </CardContent>
          ) : (
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Reset Instructions"}
                </Button>
              </form>
            </CardContent>
          )}
          
          <CardFooter className="flex justify-center border-t px-6 py-4">
            <Button 
              variant="ghost" 
              size="sm" 
              asChild
            >
              <Link href="/auth/login" className="text-sm text-gray-500 hover:text-gray-700">
                Remember your password? Sign in
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 