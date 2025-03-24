'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  // Redirect authenticated users to dashboard, unauthenticated to auth
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    } else if (status === 'unauthenticated') {
      router.push('/auth');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <h1 className="text-3xl font-bold">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
      <h1 className="text-3xl font-bold">Welcome to the Admin Dashboard</h1>
      <p className="text-xl text-center">
        {status === 'authenticated' ? 'Redirecting to Dashboard...' : 'Redirecting to auth...'}
      </p>
      <div className="flex gap-4 mt-4">
        <Button onClick={() => router.push('/auth')} className="px-6 py-2">
          auth
        </Button>
        <Button onClick={() => router.push('/dashboard')} className="px-6 py-2" variant="outline">
          Dashboard
        </Button>
      </div>
    </div>
  );
}
