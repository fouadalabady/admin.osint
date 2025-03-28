import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart,
  FileText,
  Users,
  Settings,
  Database,
  LayoutDashboard,
  Mail,
  MessageSquare,
  FilePlus,
  PieChart,
} from "lucide-react";

const sidebarNavItems: Array<NavItem | NavSection> = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-4 w-4 mr-2" />,
    requireAdmin: false,
    requireSuperAdmin: false,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: <BarChart className="h-4 w-4 mr-2" />,
    requireAdmin: false,
    requireSuperAdmin: false,
  },
  {
    title: "Users",
    href: "/dashboard/users",
    icon: <Users className="h-4 w-4 mr-2" />,
    requireAdmin: true,
    requireSuperAdmin: false,
  },
  {
    section: "Content",
    items: [
      {
        title: "Blog Posts",
        href: "/dashboard/blog",
        icon: <FileText className="h-4 w-4 mr-2" />,
        requireAdmin: false,
        requireSuperAdmin: false,
      },
      {
        title: "New Post",
        href: "/dashboard/blog/new",
        icon: <FilePlus className="h-4 w-4 mr-2" />,
        requireAdmin: false,
        requireSuperAdmin: false,
      },
    ],
  },
  {
    section: "Communication",
    items: [
      {
        title: "Messages",
        href: "/dashboard/messages",
        icon: <MessageSquare className="h-4 w-4 mr-2" />,
        requireAdmin: false,
        requireSuperAdmin: false,
      },
      {
        title: "Email Campaigns",
        href: "/dashboard/email",
        icon: <Mail className="h-4 w-4 mr-2" />,
        requireAdmin: true,
        requireSuperAdmin: false,
      },
    ],
  },
  {
    title: "Database",
    href: "/dashboard/database",
    icon: <Database className="h-4 w-4 mr-2" />,
    requireAdmin: false,
    requireSuperAdmin: true,
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: <PieChart className="h-4 w-4 mr-2" />,
    requireAdmin: true,
    requireSuperAdmin: false,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="h-4 w-4 mr-2" />,
    requireAdmin: false,
    requireSuperAdmin: false,
  },
];

// Types for sidebar items or sections
interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
}

// Section of items
interface NavSection {
  section: string;
  items?: NavItem[];
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
}

// Props for SideNav
interface SideNavProps {
  className?: string;
}

export function SideNav({ className }: SideNavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "super_admin";
  
  const filteredItems = sidebarNavItems.filter((item) => {
    if ('section' in item) {
      // Filter section's items if they exist
      if (item.items && item.items.length > 0) {
        item.items = item.items.filter(
          (subItem) =>
            (!subItem.requireAdmin && !subItem.requireSuperAdmin) ||
            (subItem.requireAdmin &&
              ["admin", "super_admin"].includes(session?.user?.role as string)) ||
            (subItem.requireSuperAdmin && isSuperAdmin)
        );
      }
      // Only include section if it has items
      return item.items && item.items.length > 0;
    }
    
    // Filter regular items
    return (!item.requireAdmin && !item.requireSuperAdmin) ||
      (item.requireAdmin &&
        ["admin", "super_admin"].includes(session?.user?.role as string)) ||
      (item.requireSuperAdmin && isSuperAdmin);
  });

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Dashboard
          </h2>
          <div className="space-y-1">
            {filteredItems.map((item, index) => {
              // If it's a section with items
              if ('section' in item) {
                return (
                  <div key={`section-${index}`} className="pt-2">
                    <h3 className="mb-2 px-4 text-sm font-medium text-muted-foreground">
                      {item.section}
                    </h3>
                    <div className="space-y-1">
                      {item.items?.map((subItem) => (
                        <Button
                          key={subItem.href}
                          variant={pathname === subItem.href ? "secondary" : "ghost"}
                          size="sm"
                          className={cn(
                            "w-full justify-start",
                            pathname === subItem.href && "bg-muted font-medium"
                          )}
                          asChild
                        >
                          <Link href={subItem.href}>
                            {subItem.icon}
                            {subItem.title}
                          </Link>
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              }
              
              // Regular item
              return (
                <Button
                  key={item.href}
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-full justify-start",
                    pathname === item.href && "bg-muted font-medium"
                  )}
                  asChild
                >
                  <Link href={item.href}>
                    {item.icon}
                    {item.title}
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
} 