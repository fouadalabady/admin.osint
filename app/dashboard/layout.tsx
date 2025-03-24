'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Menu, 
  LogOut, 
  Bell, 
  FileText, 
  BarChart, 
  UserPlus,
  X,
  HelpCircle,
  LifeBuoy
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserRole } from '@/types/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
}

// Custom FileBarChart icon since it's not in Lucide
function FileBarChart(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M8 13v5" />
      <path d="M12 9v9" />
      <path d="M16 11v7" />
    </svg>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // Fix the type comparison issue using type assertion
  const isSuperAdmin = (session?.user?.role as UserRole) === 'super_admin';
  const isAdmin = ['admin', 'super_admin'].includes(session?.user?.role as string);
  
  // Handle sign out
  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);
  
  // User initials for avatar
  const getInitials = () => {
    if (!session?.user?.email) return 'U';
    return session.user.email.charAt(0).toUpperCase();
  };

  // Create navigation items based on user role
  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: 'Users',
      href: '/dashboard/users',
      icon: <Users className="h-5 w-5" />,
      requireAdmin: true,
    },
    {
      title: 'Blog Posts',
      href: '/dashboard/blog',
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: 'Analytics',
      href: '/dashboard/analytics',
      icon: <BarChart className="h-5 w-5" />,
    },
    {
      title: 'Reports',
      href: '/dashboard/reports',
      icon: <FileBarChart className="h-5 w-5" />,
    },
    {
      title: 'Help Center',
      href: '/dashboard/help',
      icon: <HelpCircle className="h-5 w-5" />,
    },
    {
      title: 'Settings',
      href: '/dashboard/settings',
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Mobile menu overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Top navbar */}
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
              aria-label="Toggle Menu"
            >
              {isOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="font-bold">OSINT Dashboard</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/dashboard/notifications"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                'relative hover:bg-transparent'
              )}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">3</span>
              <span className="sr-only">Notifications</span>
            </Link>
            
            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={session?.user?.email || "User"} />
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                {isSuperAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/users/new">
                      Add New User
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    Account Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      
      {/* Main content area with sidebar */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-30 w-64 transform overflow-y-auto border-r bg-background transition-transform duration-200 ease-in-out md:translate-x-0 md:static',
            isOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="sticky top-0 pt-16">
            <nav className="flex flex-col gap-1 p-4">
              {navItems
                .filter(
                  (item) =>
                    (!item.requireAdmin && !item.requireSuperAdmin) ||
                    (item.requireAdmin && isAdmin) ||
                    (item.requireSuperAdmin && isSuperAdmin)
                )
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      pathname === item.href
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                    )}
                  >
                    {item.icon}
                    {item.title}
                  </Link>
                ))}
              
              {/* Super admin specific actions */}
              {isSuperAdmin && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground">Admin Actions</h3>
                  <Link
                    href="/dashboard/users/new"
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      pathname === '/dashboard/users/new'
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                    )}
                  >
                    <UserPlus className="h-5 w-5" />
                    Add New User
                  </Link>
                </div>
              )}
              
              {/* Logout button at bottom of sidebar */}
              <button
                onClick={handleSignOut}
                className="mt-auto flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Log Out
              </button>
            </nav>
          </div>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
