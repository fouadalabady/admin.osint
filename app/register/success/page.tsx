"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function RegistrationSuccessPage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Registration Successful!
          </CardTitle>
          <CardDescription className="text-center">
            Please check your email to verify your account
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">
            We&apos;ve sent you an email with a verification link. Please click the link
            to activate your account.
          </p>
          <p className="text-sm text-muted-foreground">
            If you don&apos;t see the email, please check your spam folder.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/auth">
            <Button>
              Go to auth
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
} 