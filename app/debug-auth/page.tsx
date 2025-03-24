'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut, getSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DebugAuthPage() {
  const { data: session, status } = useSession();
  const [cookies, setCookies] = useState<string>('Loading cookies...');
  const [tokens, setTokens] = useState<Record<string, string | null>>({});
  const [sessionData, setSessionData] = useState<string>('Loading session data...');
  const [directNavigationResults, setDirectNavigationResults] = useState<string[]>([]);
  const [envVars, setEnvVars] = useState<Record<string, string>>({});

  // Log session info
  useEffect(() => {
    console.log('Debug page - session status:', status);
    console.log('Debug page - session data:', session);

    setSessionData(JSON.stringify({ status, session }, null, 2));

    // Get session from server-side
    getSession().then(serverSession => {
      console.log('Server session:', serverSession);
      setSessionData(
        prev => prev + '\n\nServer Session:\n' + JSON.stringify(serverSession, null, 2)
      );
    });
  }, [session, status]);

  // Check cookies
  useEffect(() => {
    try {
      setCookies(document.cookie || 'No cookies found');

      // Check localStorage tokens
      const nextAuthSession = localStorage.getItem('next-auth.session-token');
      const csrfToken = localStorage.getItem('next-auth.csrf-token');
      const callbackUrl = localStorage.getItem('next-auth.callback-url');

      setTokens({
        'next-auth.session-token': nextAuthSession,
        'next-auth.csrf-token': csrfToken,
        'next-auth.callback-url': callbackUrl,
      });
    } catch (e) {
      setCookies(`Error reading cookies: ${e}`);
    }
  }, []);

  useEffect(() => {
    const fetchEnvVars = async () => {
      try {
        const response = await fetch('/api/debug-env');
        const data = await response.json();
        setEnvVars(data);
      } catch (error) {
        setEnvVars({ error: 'Failed to fetch environment variables' });
      }
    };

    fetchEnvVars();
  }, []);

  const testDashboardNavigation = () => {
    try {
      setDirectNavigationResults(prev => [...prev, 'Attempting to navigate to /dashboard...']);
      window.location.href = '/dashboard';
    } catch (e) {
      setDirectNavigationResults(prev => [...prev, `Error navigating: ${e}`]);
    }
  };

  const testLoginSignIn = async () => {
    try {
      setDirectNavigationResults(prev => [
        ...prev,
        'Attempting direct signIn with redirect: true...',
      ]);
      await signIn('credentials', {
        redirect: true,
        email: 'fouadelabady@gmail.com',
        password: 'example-password',
        callbackUrl: '/dashboard',
      });
    } catch (e) {
      setDirectNavigationResults(prev => [...prev, `Error signing in: ${e}`]);
    }
  };

  const handleSignOut = async () => {
    try {
      setDirectNavigationResults(prev => [...prev, 'Signing out...']);
      await signOut({ redirect: false });
      setDirectNavigationResults(prev => [...prev, 'Sign out successful']);
    } catch (e) {
      setDirectNavigationResults(prev => [...prev, `Error signing out: ${e}`]);
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Authentication Debugging</h1>

      <div className="grid gap-4 mb-6">
        <Button onClick={testDashboardNavigation}>Test Direct Navigation to Dashboard</Button>
        <Button onClick={testLoginSignIn} variant="secondary">
          Test Direct Sign In
        </Button>
        <Button onClick={handleSignOut} variant="destructive">
          Sign Out
        </Button>
      </div>

      <div className="grid gap-6">
        {directNavigationResults.map((result, i) => (
          <div key={i} className="p-2 bg-muted rounded text-sm">
            {result}
          </div>
        ))}

        <Card>
          <CardHeader>
            <CardTitle>Session Status: {status}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[300px] text-xs">
              {sessionData}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cookies</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[200px] text-xs">
              {cookies}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>LocalStorage Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[200px] text-xs">
              {JSON.stringify(tokens, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[200px] text-xs">
              {JSON.stringify(envVars, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
