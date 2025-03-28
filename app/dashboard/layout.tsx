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
import { DashboardNav } from "@/components/dashboard/nav";
import { UserNav } from "@/components/dashboard/user-nav";
import { SideNav } from "@/components/dashboard/side-nav";
import { ModeToggle } from "@/components/mode-toggle";

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
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg md:text-xl tracking-tight">
            OSINT Dashboard
          </span>
        </div>
        <div className="flex items-center gap-2">
          <nav className="hidden md:flex items-center gap-6">
            <DashboardNav />
          </nav>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <UserNav />
          </div>
        </div>
      </header>
      
      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <aside className="hidden md:flex w-64 shrink-0 border-r bg-muted/40 md:sticky md:top-16 md:self-start md:h-[calc(100vh-4rem)]">
          <SideNav className="w-full p-4" />
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto max-w-full">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
