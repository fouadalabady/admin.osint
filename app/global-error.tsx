"use client";

import { Button } from "@/components/ui/button";
import { AlertOctagon } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen px-6 py-24">
          <div className="flex flex-col items-center text-center max-w-md">
            <div className="p-4 rounded-full bg-destructive/10 mb-6">
              <AlertOctagon className="h-12 w-12 text-destructive" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Application Error</h1>
            <p className="text-gray-500 mb-6">
              We're sorry, but a critical error occurred in the application. Our team has been notified.
            </p>
            <Button 
              onClick={() => reset()}
              className="flex items-center gap-2"
            >
              Try again
            </Button>
            {error.digest && (
              <p className="mt-6 text-sm text-gray-500">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
} 