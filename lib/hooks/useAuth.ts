"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

// Custom hook for handling authentication state
export function useAuth(
  { 
    redirectToLogin = true,
    requireAuth = true,
  }: { 
    redirectToLogin?: boolean; 
    requireAuth?: boolean;
  } = {}
) {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  
  // Track redirect attempts to prevent infinite redirects
  const [hasAttemptedRedirect, setHasAttemptedRedirect] = useState(false);
  
  // Handle authentication state
  useEffect(() => {
    console.log("Auth hook - status:", status, "has session:", !!session);
    
    // If authenticated, store that information in localStorage as fallback
    if (status === "authenticated" && session) {
      try {
        localStorage.setItem('auth-fallback-authenticated', 'true');
        localStorage.setItem('auth-fallback-timestamp', Date.now().toString());
      } catch (e) {
        console.error("Failed to set localStorage auth fallback", e);
      }
    }
    
    // Still loading, keep waiting
    if (status === "loading") {
      // Check if we have a recent authentication in localStorage as fallback
      try {
        const fallbackAuth = localStorage.getItem('auth-fallback-authenticated');
        const fallbackTimestamp = localStorage.getItem('auth-fallback-timestamp');
        
        // If we have a recent auth (less than 10 minutes old), consider user authenticated
        // This helps prevent flickering during page transitions
        if (fallbackAuth === 'true' && fallbackTimestamp) {
          const timestamp = parseInt(fallbackTimestamp);
          const now = Date.now();
          const diffMinutes = (now - timestamp) / (1000 * 60);
          
          if (diffMinutes < 10) {
            console.log("Using fallback authentication state from localStorage");
            setIsLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to check localStorage auth fallback", e);
      }
      return;
    }
    
    // Authentication check complete
    setIsLoading(false);
    
    // Only attempt redirect once to prevent loops
    if (requireAuth && status === "unauthenticated" && redirectToLogin && !hasAttemptedRedirect) {
      console.log("User is not authenticated, redirecting to login");
      setHasAttemptedRedirect(true);
      
      // Clear any stale fallback auth
      try {
        localStorage.removeItem('auth-fallback-authenticated');
        localStorage.removeItem('auth-fallback-timestamp');
      } catch (e) {
        console.error("Failed to clear localStorage auth fallback", e);
      }
      
      // Small delay before redirect to ensure all state updates are processed
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 100);
    }
  }, [status, redirectToLogin, requireAuth, session, hasAttemptedRedirect]);
  
  // Return auth state
  return {
    session,
    status,
    isLoading,
    isAuthenticated: status === "authenticated",
    isAdmin: session?.user?.role === "admin" || session?.user?.role === "super_admin",
    isSuperAdmin: session?.user?.role === "super_admin",
    userEmail: session?.user?.email,
    userRole: session?.user?.role,
    userId: session?.user?.id,
  };
} 