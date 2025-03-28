import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, FileText, Settings, Database } from "lucide-react";
import { useSession } from "next-auth/react";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-4 w-4 mr-2" />,
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
    title: "Blog",
    href: "/dashboard/blog",
    icon: <FileText className="h-4 w-4 mr-2" />,
    requireAdmin: false,
    requireSuperAdmin: false,
  },
  {
    title: "Database",
    href: "/dashboard/database",
    icon: <Database className="h-4 w-4 mr-2" />,
    requireAdmin: false,
    requireSuperAdmin: true,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="h-4 w-4 mr-2" />,
    requireAdmin: false,
    requireSuperAdmin: false,
  },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "super_admin";
  
  return (
    <nav className="flex items-center gap-4">
      {navItems
        .filter(
          (item) =>
            (!item.requireAdmin && !item.requireSuperAdmin) ||
            (item.requireAdmin &&
              ["admin", "super_admin"].includes(session?.user?.role as string)) ||
            (item.requireSuperAdmin && isSuperAdmin)
        )
        .map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center text-sm font-medium transition-colors hover:text-primary",
              pathname === item.href
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            {item.title}
          </Link>
        ))}
    </nav>
  );
} 