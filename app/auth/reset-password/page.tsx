"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PasswordStrengthIndicator } from "@/components/auth/password-strength-indicator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="container flex justify-center items-center min-h-screen">
        <p>Loading...</p>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check for different parameters in URL
  const supabaseCode = searchParams.get("code") || ""; // PKCE flow code from Supabase
  const email = searchParams.get("email") || "";
  const verificationCode = searchParams.get("code") || "";
  
  // Initialize form data with URL parameters if available
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
    verificationCode: verificationCode,
    email: email,
  });
  
  // Determine which tab should be active by default
  const initialTab = supabaseCode ? "link" : "code";
  const [activeTab, setActiveTab] = useState<"link" | "code">(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordScore, setPasswordScore] = useState(0);
  
  // Check if the reset code is valid on component mount
  useEffect(() => {
    if (supabaseCode) {
      // If we have a Supabase code in the URL, default to the link tab
      setActiveTab("link");
    } else if (verificationCode && email) {
      // If we have both verification code and email, default to the code tab
      setActiveTab("code");
    }
  }, [supabaseCode, verificationCode, email]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    // Validate passwords
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }
    
    if (passwordScore < 3) {
      return setError("Please use a stronger password");
    }
    
    setLoading(true);
    
    try {
      if (activeTab === "link") {
        // Link-based reset (Supabase Auth PKCE flow)
        if (!supabaseCode) {
          return setError("Invalid reset link. Please request a new password reset.");
        }
        
        const { error: updateError } = await supabase.auth.updateUser({
          password: formData.password,
        }, {
          authFlow: {
            flowType: "pkce",
            code: supabaseCode
          }
        });
        
        if (updateError) throw updateError;
        
        setSuccess("Password has been reset successfully. You can now login with your new password.");
        
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      } else {
        // Code-based reset (our custom flow)
        if (!formData.verificationCode) {
          return setError("Please enter the verification code");
        }
        
        if (!formData.email) {
          return setError("Please enter your email address");
        }
        
        // Verify code and update password
        const response = await fetch("/api/auth/verify-reset-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            code: formData.verificationCode,
            password: formData.password,
          }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Verification failed");
        }
        
        setSuccess("Password has been reset successfully. You can now login with your new password.");
        
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      }
    } catch (err: any) {
      console.error("Reset password error:", err);
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
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
        
        <Card>
          <CardHeader>
            <CardTitle>Reset Your Password</CardTitle>
            <CardDescription>
              Enter a new password for your account
            </CardDescription>
          </CardHeader>
          
          {(error || success) && (
            <div className="px-6 mb-4">
              <Alert variant={error ? "destructive" : "default"}>
                {error ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                <AlertDescription>
                  {error || success}
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "link" | "code")} className="w-full">
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="link">Magic Link</TabsTrigger>
                <TabsTrigger value="code">Verification Code</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="link">
              <CardContent>
                {!supabaseCode ? (
                  <div className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        This option is only available when you click the reset link sent to your email.
                      </AlertDescription>
                    </Alert>
                    <p className="text-sm text-muted-foreground">
                      Use the verification code method instead, or <Link href="/auth/forgot-password" className="text-primary underline">request a new password reset</Link>.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">New Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Create a new password"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={loading}
                        required
                      />
                      <PasswordStrengthIndicator 
                        password={formData.password} 
                        onScoreChange={setPasswordScore}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm your new password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={loading}
                        required
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? "Updating Password..." : "Reset Password"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </TabsContent>
            
            <TabsContent value="code">
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Your Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    />
                  </div>
                
                  <div className="space-y-2">
                    <Label htmlFor="verificationCode">Verification Code</Label>
                    <Input
                      id="verificationCode"
                      name="verificationCode"
                      type="text"
                      placeholder="Enter the code from the email"
                      value={formData.verificationCode}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="passwordCode">New Password</Label>
                    <Input
                      id="passwordCode"
                      name="password"
                      type="password"
                      placeholder="Create a new password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    />
                    <PasswordStrengthIndicator 
                      password={formData.password} 
                      onScoreChange={setPasswordScore}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPasswordCode">Confirm Password</Label>
                    <Input
                      id="confirmPasswordCode"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm your new password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Updating Password..." : "Reset Password"}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
          
          <CardFooter className="flex justify-center border-t px-6 py-4">
            <Button 
              variant="ghost" 
              size="sm" 
              asChild
            >
              <Link href="/auth/forgot-password" className="text-sm text-gray-500 hover:text-gray-700">
                Request a new reset link
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 