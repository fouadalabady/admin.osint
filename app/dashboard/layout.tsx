'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useSession } from 'next-auth/react';
import { ThemeToggle } from '@/components/theme-toggle';
import { LayoutDashboard, Users, Settings, Menu, LogOut, Bell, Database } from 'lucide-react';
import { UserRole } from '@/types/auth';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  
  // Fix the type comparison issue using type assertion
  const isSuperAdmin = (session?.user?.role as UserRole) === 'super_admin';
  
  // Create navigation items based on user role
  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
    },
    {
      title: 'Users',
      href: '/dashboard/users',
      icon: <Users className="mr-2 h-4 w-4" />,
      requireAdmin: true,
    },
    {
      title: 'Database Setup',
      href: '/admin/setup',
      icon: <Database className="mr-2 h-4 w-4" />,
      requireSuperAdmin: true,
    },
    {
      title: 'Settings',
      href: '/dashboard/settings',
      icon: <Settings className="mr-2 h-4 w-4" />,
    },
  ];

  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4 md:hidden"
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">Toggle Menu</span>
            </button>
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="hidden font-bold sm:inline-block">OSINT Dashboard</span>
            </Link>
          </div>
          <nav className="hidden gap-6 md:flex">
            {navItems
              .filter(
                (item) =>
                  (!item.requireAdmin && !item.requireSuperAdmin) ||
                  (item.requireAdmin &&
                    ['admin', 'super_admin'].includes(session?.user?.role as string)) ||
                  (item.requireSuperAdmin && isSuperAdmin)
              )
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    buttonVariants({ variant: 'ghost' }),
                    pathname === item.href
                      ? 'bg-muted hover:bg-muted'
                      : 'hover:bg-transparent hover:underline',
                    'justify-start'
                  )}
                >
                  {item.icon}
                  {item.title}
                </Link>
              ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/api/auth/signout"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                'hover:bg-transparent'
              )}
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Sign Out</span>
            </Link>
            <Link
              href="/dashboard/notifications"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                'hover:bg-transparent'
              )}
            >
              <Bell className="h-4 w-4" />
              <span className="sr-only">Notifications</span>
            </Link>
          </div>
        </div>
      </header>
      <div className="container grid flex-1 md:grid-cols-[220px_1fr] lg:grid-cols-[240px_1fr]">
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-30 w-full shrink-0 overflow-y-auto border-r bg-background md:static md:block',
            isOpen ? 'block' : 'hidden'
          )}
        >
          <div className="sticky top-0 pt-16">
            <nav className="grid gap-2 p-4 text-lg font-medium">
              {navItems
                .filter(
                  (item) =>
                    (!item.requireAdmin && !item.requireSuperAdmin) ||
                    (item.requireAdmin &&
                      ['admin', 'super_admin'].includes(session?.user?.role as string)) ||
                    (item.requireSuperAdmin && isSuperAdmin)
                )
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      buttonVariants({ variant: 'ghost' }),
                      pathname === item.href
                        ? 'bg-muted hover:bg-muted'
                        : 'hover:bg-transparent hover:underline',
                      'justify-start'
                    )}
                  >
                    {item.icon}
                    {item.title}
                  </Link>
                ))}
            </nav>
          </div>
        </aside>
        <main className="flex flex-1 flex-col overflow-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
