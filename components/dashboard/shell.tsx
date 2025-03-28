import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardShell({
  children,
  className,
}: DashboardShellProps) {
  return (
    <div className={cn("flex-1 space-y-4 p-4 pt-6 md:p-8", className)}>
      {children}
    </div>
  );
} 