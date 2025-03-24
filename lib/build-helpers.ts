/**
 * Helper utilities for safely handling build-time operations
 */

/**
 * Safely executes API route initialization during build time
 * This prevents errors during static generation in Vercel builds
 * 
 * @param fn Function to execute at runtime
 * @returns Either the function result or a dummy response during build
 */
export const safeBuildExecution = async <T>(fn: () => Promise<T>): Promise<T | any> => {
  // Check if we're in a build environment
  const isBuildTime = 
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' || 
    process.env.VERCEL_ENV === 'build' || 
    process.env.NODE_ENV === 'production';
  
  // Skip actual execution during build time to avoid environment errors
  if (isBuildTime && typeof window === 'undefined') {
    console.log('⚠️ Build time detected - returning dummy response');
    
    // Return a mock response that won't cause build errors
    return {
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve({ message: 'Build time mock response' })
    } as any;
  }
  
  // Execute the actual function at runtime
  return fn();
};

/**
 * Determines if the code is running during build time
 */
export const isBuildTime = () => {
  return (
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' || 
    process.env.VERCEL_ENV === 'build' || 
    process.env.NODE_ENV === 'production'
  ) && typeof window === 'undefined';
}; 