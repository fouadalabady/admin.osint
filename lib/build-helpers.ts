/**
 * build-helpers.ts
 * 
 * Utility functions for safely handling environment variables and build-time execution
 * in both Vercel and Coolify environments.
 */

/**
 * Safely access an environment variable with a fallback value
 * @param key The environment variable key
 * @param fallback Optional fallback value if the environment variable is not set
 * @returns The environment variable value or the fallback
 */
export function getEnv(key: string, fallback?: string): string {
  const value = process.env[key];
  if (value === undefined) {
    if (fallback !== undefined) {
      console.warn(`Environment variable ${key} not found, using fallback value.`);
      return fallback;
    }
    console.error(`Required environment variable ${key} is not defined.`);
    return '';
  }
  return value;
}

/**
 * Check if we're in a production environment
 * @returns true if we're in production, false otherwise
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if we're in a Vercel environment
 * @returns true if we're in Vercel, false otherwise
 */
export function isVercel(): boolean {
  return !!process.env.VERCEL;
}

/**
 * Check if we're in a Coolify environment
 * @returns true if we're in Coolify, false otherwise
 */
export function isCoolify(): boolean {
  return !!process.env.COOLIFY;
}

/**
 * Safely execute a function that relies on environment variables being defined
 * @param fn The function to execute
 * @param requiredEnvVars Array of required environment variables
 * @returns The result of the function or null if any required environment variables are missing
 */
export function safeBuildExecution<T>(
  fn: () => T,
  requiredEnvVars: string[] = []
): T | null {
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    if (isProduction()) {
      console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
      return null;
    } else {
      console.warn(`Development mode: Proceeding despite missing environment variables: ${missingVars.join(', ')}`);
    }
  }
  
  try {
    return fn();
  } catch (error) {
    console.error('Error during build execution:', error);
    return null;
  }
}

/**
 * Get deployment-specific configuration
 * @returns Configuration object with deployment-specific values
 */
export function getDeploymentConfig() {
  if (isVercel()) {
    return {
      buildCommand: 'npx next build',
      envPrefix: 'VERCEL_',
      cacheLocation: '.vercel/.cache',
    };
  }
  
  if (isCoolify()) {
    return {
      buildCommand: 'npm run coolify-build',
      envPrefix: 'COOLIFY_',
      cacheLocation: '/data/cache',
    };
  }
  
  // Default/local configuration
  return {
    buildCommand: 'npm run build',
    envPrefix: '',
    cacheLocation: '.next/cache',
  };
}

/**
 * Sanitize a value for safe logging (e.g., obscuring secrets)
 * @param key The environment variable key
 * @param value The value to sanitize
 * @returns Sanitized value safe for logging
 */
export function sanitizeForLogging(key: string, value: string): string {
  // List of environment variables that should be obscured
  const sensitiveKeys = [
    'SECRET',
    'KEY',
    'PASSWORD',
    'TOKEN',
    'AUTH',
  ];
  
  // Check if this is a sensitive key
  const isSensitive = sensitiveKeys.some(sensitive => 
    key.toUpperCase().includes(sensitive)
  );
  
  if (isSensitive && value) {
    // Return first and last character with asterisks in between
    if (value.length <= 4) {
      return '****';
    }
    return `${value.substring(0, 2)}****${value.substring(value.length - 2)}`;
  }
  
  return value;
}

/**
 * Log all environment variables with sensitive values obscured
 * Useful for debugging deployment issues
 */
export function logSafeEnvironment(): void {
  if (isProduction()) {
    console.log('Environment variables logging disabled in production for security');
    return;
  }
  
  const envEntries = Object.entries(process.env);
  const safeEnv = envEntries.reduce((acc, [key, value]) => {
    acc[key] = sanitizeForLogging(key, value || '');
    return acc;
  }, {} as Record<string, string>);
  
  console.log('Current environment configuration:', safeEnv);
} 