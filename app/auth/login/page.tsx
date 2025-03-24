"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const timeoutParam = searchParams.get('timeout');
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const error = searchParams.get('error');
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Show session timeout alert if applicable
  const [showTimeoutAlert, setShowTimeoutAlert] = useState(false);
  
  useEffect(() => {
    if (timeoutParam === '1') {
      setShowTimeoutAlert(true);
      // Auto-hide the alert after 10 seconds
      const timer = setTimeout(() => setShowTimeoutAlert(false), 10000);
      return () => clearTimeout(timer);
    }
    
    if (error) {
      setFormError(decodeURIComponent(error));
    }
  }, [timeoutParam, error]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormError("");
    setSuccess("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccess("");
    setIsLoading(true);

    try {
      console.log("Attempting to sign in with credentials");
      console.log("Destination after login:", callbackUrl);
      
      // Use signIn with redirect:true for a complete browser-handled redirect
      // This skips client-side routing entirely and lets the server handle session
      await signIn("credentials", {
        redirect: true,
        email: formData.email,
        password: formData.password,
        callbackUrl,
      });
      
      // Code below won't execute due to the redirect, but keeping it
      // as a fallback just in case
      setSuccess("Login successful! Redirecting...");
    } catch (err) {
      console.error("Login error:", err);
      setFormError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex justify-center items-center min-h-screen py-8">
      {showTimeoutAlert && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 w-full max-w-md z-50">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your session has expired due to inactivity. Please log in again to continue.
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      <div className="w-full max-w-md mx-auto">
        <div className="mb-6 flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
        
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Dashboard</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          
          {(formError || success) && (
            <div className="px-6">
              <Alert variant={formError ? "destructive" : "default"}>
                {formError ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                <AlertDescription>
                  {formError || success}
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <CardContent className="pt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  name="email"
                  type="email"
                  placeholder="Your email address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password">Password</Label>
                  <Button
                    variant="link"
                    className="px-0 font-normal text-sm"
                    type="button"
                    onClick={() => router.push("/auth/forgot-password")}
                  >
                    Forgot password?
                  </Button>
                </div>
                <Input
                  id="login-password"
                  name="password"
                  type="password"
                  placeholder="Your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-2"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center w-full">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Button
                  variant="link"
                  className="px-0"
                  type="button"
                  onClick={() => router.push("/auth/signup")}
                >
                  Create one
                </Button>
              </p>
            </div>
            
            <div className="text-center w-full">
              <p className="text-xs text-muted-foreground">
                By signing in, you agree to our{" "}
                <Link href="/terms" className="underline hover:text-primary">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline hover:text-primary">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 