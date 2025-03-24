'use client';

import { useRouter } from 'next/navigation';
import RegistrationForm from '../components/registration-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();

  const handleSwitchToLogin = () => {
    router.push('/auth?tab=login');
  };

  return (
    <div className="container flex justify-center items-center min-h-screen py-8">
      <div className="w-full max-w-md mx-auto">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>

        <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>

        <RegistrationForm onSwitchToLogin={handleSwitchToLogin} />

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Already have an account?{' '}
            <Button variant="link" className="px-0" type="button" onClick={handleSwitchToLogin}>
              Sign in
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}
