"use client";

import { Suspense } from "react";
import ResetPasswordForm from '@/components/auth/reset-password-form';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-1 lg:px-0">
        <ResetPasswordForm />
      </div>
    </Suspense>
  );
} 