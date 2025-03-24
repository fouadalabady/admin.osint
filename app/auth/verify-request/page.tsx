"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MailCheck, ArrowLeft, Check, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function VerifyRequestPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Suspense fallback={<div>Loading...</div>}>
        <VerifyRequestContent />
      </Suspense>
    </div>
  );
}

function VerifyRequestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleResendEmail = async () => {
    if (!email) {
      setError('No email address provided. Please go back to login and try again.');
      return;
    }
    
    setIsResending(true);
    setResendSuccess(false);
    setError('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification email');
      }

      setResendSuccess(true);
    } catch (err) {
      console.error("Failed to resend verification email:", err);
      setError(err instanceof Error ? err.message : 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-6 flex items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2"
          onClick={() => router.push("/auth/login")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Button>
      </div>
      
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <MailCheck className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center pt-4">
            Check your email
          </CardTitle>
          <CardDescription className="text-center">
            We&apos;ve sent you a verification link to <strong>{email}</strong>. Please check your email and click the link to verify your account.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            If you don&apos;t see the email, check your spam folder or try resending the verification email.
          </p>

          {resendSuccess && (
            <div className="p-3 rounded-md bg-green-50 flex items-center justify-center gap-2 text-green-600">
              <Check className="h-4 w-4" />
              <span className="text-sm">Verification email resent!</span>
            </div>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={handleResendEmail}
            disabled={isResending}
          >
            {isResending ? "Resending..." : "Resend verification email"}
          </Button>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center w-full">
            <p className="text-xs text-muted-foreground">
              Having trouble? Contact our support team for assistance.
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 