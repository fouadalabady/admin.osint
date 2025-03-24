"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, HomeIcon } from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <div className="space-y-5 max-w-md">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Page Not Found</h2>
          
          <p className="text-muted-foreground">
            Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, 
            or perhaps you entered an incorrect URL.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            
            <Button asChild size="lg">
              <Link href="/dashboard">
                <HomeIcon className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 