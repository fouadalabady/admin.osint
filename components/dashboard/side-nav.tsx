import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Database,
  BarChart,
  Mail,
  MessageSquare,
  FilePlus,
  PieChart,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { ScrollArea } from "@/components/ui/scroll-area";

const sidebarNavItems = [
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

interface SideNavProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SideNav({ className, ...props }: SideNavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "super_admin";
  
  const filteredItems = sidebarNavItems.filter((item) => {
    if ('section' in item) {
      // Filter section's items
      item.items = item.items.filter(
        (subItem) =>
          (!subItem.requireAdmin && !subItem.requireSuperAdmin) ||
          (subItem.requireAdmin &&
            ["admin", "super_admin"].includes(session?.user?.role as string)) ||
          (subItem.requireSuperAdmin && isSuperAdmin)
      );
      // Only include section if it has items
      return item.items.length > 0;
    }
    
    // Filter regular items
    return (!item.requireAdmin && !item.requireSuperAdmin) ||
      (item.requireAdmin &&
        ["admin", "super_admin"].includes(session?.user?.role as string)) ||
      (item.requireSuperAdmin && isSuperAdmin);
  });

  return (
    <ScrollArea className={cn("h-full", className)} {...props}>
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
                      {item.items.map((subItem) => (
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