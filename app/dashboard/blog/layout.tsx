"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { DashboardShell } from "@/components/dashboard/shell"
import { cn } from "@/lib/utils"

interface BlogTabItem {
  label: string
  value: string
  path: string
}

const blogTabs: BlogTabItem[] = [
  {
    label: "Posts",
    value: "posts",
    path: "/dashboard/blog/posts"
  },
  {
    label: "Categories",
    value: "categories",
    path: "/dashboard/blog/categories"
  },
  {
    label: "Tags",
    value: "tags",
    path: "/dashboard/blog/tags"
  },
  {
    label: "Media",
    value: "media",
    path: "/dashboard/blog/media"
  }
]

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Check if we're on the root blog path (dashboard/blog)
  // and redirect to posts tab by default
  if (pathname === "/dashboard/blog") {
    return children
  }
  
  return (
    <DashboardShell>
      <div className="flex flex-col space-y-8 pb-10">
        <div className="flex flex-col space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Blog Dashboard</h2>
          <p className="text-muted-foreground">
            Manage your blog posts, categories, tags, and media
          </p>
        </div>
        
        <div className="space-y-4">
          <nav className="flex overflow-x-auto border-b">
            {blogTabs.map((tab) => (
              <Link
                key={tab.value}
                href={tab.path}
                className={cn(
                  "flex items-center px-4 py-2 -mb-px text-sm font-medium transition-colors",
                  pathname.startsWith(tab.path)
                    ? "border-b-2 border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
          
          <div className="mt-2">{children}</div>
        </div>
      </div>
    </DashboardShell>
  )
} 