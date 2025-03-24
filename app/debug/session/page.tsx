'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function SessionDebugPage() {
  // Use both direct session and our custom hook
  const { data: session, status, update } = useSession();
  const auth = useAuth({ redirectToLogin: false, requireAuth: false });

  const [sessionJson, setSessionJson] = useState<string>('Loading...');
  const [authJson, setAuthJson] = useState<string>('Loading...');
  const [storageInfo, setStorageInfo] = useState<string>('Loading...');
  const [testResults, setTestResults] = useState<{ message: string; success: boolean }[]>([]);

  useEffect(() => {
    setSessionJson(JSON.stringify({ session, status }, null, 2));
    setAuthJson(JSON.stringify(auth, null, 2));

    try {
      // Get localStorage info relevant to session
      const localSessionData = localStorage.getItem('next-auth.session-token');
      const localCsrfToken = localStorage.getItem('next-auth.csrf-token');
      const localCallbackUrl = localStorage.getItem('next-auth.callback-url');

      setStorageInfo(
        JSON.stringify(
          {
            hasSessionToken: !!localSessionData,
            sessionTokenLength: localSessionData ? localSessionData.length : 0,
            hasCsrfToken: !!localCsrfToken,
            callbackUrl: localCallbackUrl,
          },
          null,
          2
        )
      );
    } catch (error) {
      setStorageInfo(JSON.stringify({ error: 'Could not access localStorage' }, null, 2));
    }
  }, [session, status, auth]);

  const refreshSession = async () => {
    try {
      await update();
      setSessionJson(JSON.stringify({ session, status, refreshed: true }, null, 2));
      setTestResults([
        ...testResults,
        { message: 'Session refreshed successfully', success: true },
      ]);
    } catch (error) {
      console.error('Error refreshing session');
      setTestResults([...testResults, { message: 'Failed to refresh session', success: false }]);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
      setTestResults([...testResults, { message: 'Signed out successfully', success: true }]);
    } catch (error) {
      setTestResults([...testResults, { message: 'Failed to sign out', success: false }]);
    }
  };

  const attemptSignIn = async () => {
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: 'test@example.com',
        password: 'test123',
      });
      setTestResults([
        ...testResults,
        {
          message: result?.error ? `Sign in failed: ${result.error}` : 'Sign in attempt completed',
          success: !result?.error,
        },
      ]);
    } catch (error) {
      setTestResults([
        ...testResults,
        { message: 'Sign in attempt failed with exception', success: false },
      ]);
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Session Debug</h1>

      <div className="grid gap-6">
        {testResults.map((result, index) => (
          <Alert key={index} variant={result.success ? 'default' : 'destructive'}>
            {result.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        ))}

        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Session Status: {status}</span>
              <div className="flex gap-2">
                <Button onClick={refreshSession}>Refresh Session</Button>
                <Button onClick={handleSignOut} variant="outline">
                  Sign Out
                </Button>
                <Button onClick={attemptSignIn} variant="secondary">
                  Test Sign In
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Direct Session Data:</h3>
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[300px] text-xs">
                  {sessionJson}
                </pre>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Auth Hook Data:</h3>
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[300px] text-xs">
                  {authJson}
                </pre>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold mb-2">LocalStorage Info:</h3>
              <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[200px] text-xs">
                {storageInfo}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Navigation Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <Button onClick={() => (window.location.href = '/dashboard')}>
                Navigate to Dashboard (window.location)
              </Button>
              <Button onClick={() => (window.location.href = '/auth/login')}>
                Navigate to Login (window.location)
              </Button>
              <Button
                onClick={() => {
                  const url = '/dashboard?test=' + Date.now();
                  window.location.href = url;
                  setTestResults([
                    ...testResults,
                    { message: `Navigating to ${url}`, success: true },
                  ]);
                }}
              >
                Navigate with Timestamp (Cache Buster)
              </Button>
            </div>
            <div className="flex gap-4 flex-wrap">
              <a href="/dashboard" className="inline-block">
                <Button variant="outline">Navigate to Dashboard (a href)</Button>
              </a>
              <a href="/auth/login" className="inline-block">
                <Button variant="outline">Navigate to Login (a href)</Button>
              </a>
              <a href="/dashboard?reload=true" className="inline-block">
                <Button variant="outline">Dashboard with Reload Param</Button>
              </a>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Use these buttons to test different navigation methods
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
