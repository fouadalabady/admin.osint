"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  LayoutDashboard,
  Users,
  Settings,
  Menu,
  LogOut,
  Bell,
  Database,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  
  // Check if user is super admin
  const isSuperAdmin = session?.user?.role === "super_admin";

  // Create navigation items based on user role
  const getNavItems = () => {
    const items: NavItem[] = [
      {
        title: "Overview",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Users",
        href: "/dashboard/users",
        icon: Users,
      },
      {
        title: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
      },
    ];

    // Add setup link for super admins only
    if (isSuperAdmin) {
      items.push({
        title: "Database Setup",
        href: "/admin/setup",
        icon: Database,
      });
    }

    return items;
  };

  const navItems = getNavItems();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar for desktop */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-background">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-semibold">Admin</h2>
        </div>
        <ScrollArea className="flex-1 py-4">
          <nav className="grid gap-1 px-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  pathname === item.href ? "bg-accent" : "transparent"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            ))}
          </nav>
        </ScrollArea>
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session?.user?.email}</p>
              <p className="text-xs text-muted-foreground">{session?.user?.role}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => signOut({ callbackUrl: "/auth" })}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="lg:hidden fixed left-4 top-4 z-40"
            size="icon"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-semibold">Admin</h2>
          </div>
          <ScrollArea className="flex-1 py-4">
            <nav className="grid gap-1 px-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    pathname === item.href ? "bg-accent" : "transparent"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              ))}
            </nav>
          </ScrollArea>
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{session?.user?.email}</p>
                <p className="text-xs text-muted-foreground">{session?.user?.role}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => signOut({ callbackUrl: "/auth" })}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex items-center justify-between h-16 px-4">
            <div className="lg:hidden w-6" /> {/* Spacer for mobile menu button */}
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="flex-1 bg-muted/20">{children}</main>
      </div>
    </div>
  );
} 