"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="container flex justify-center items-center min-h-screen">
        <p>Loading...</p>
      </div>
    }>
      <AuthRedirect />
    </Suspense>
  );
}

function AuthRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  
  useEffect(() => {
    // Redirect to login or signup based on tab parameter
    if (tab === 'register') {
      router.replace('/auth/signup');
    } else {
      router.replace('/auth/login');
    }
  }, [router, tab]);

  // Return loading state while redirecting
  return (
    <div className="container flex justify-center items-center min-h-screen">
      <p>Redirecting...</p>
    </div>
  );
} 