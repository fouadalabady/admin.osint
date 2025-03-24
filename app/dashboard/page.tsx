"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, FileText, BarChart4, Settings, ChevronRight } from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession({
    required: true, 
    onUnauthenticated() {
      window.location.href = "/auth/login";
    }
  });
  
  const [stats, setStats] = useState({
    userCount: 0,
    blogPosts: 0,
    totalLeads: 0,
  });

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // In a real implementation, this would be an API call
        // For now, just use placeholder data
        setStats({
          userCount: 5,
          blogPosts: 12,
          totalLeads: 42,
        });
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      }
    };
    
    if (session) {
      console.log("User is authenticated, fetching stats");
      fetchStats();
    }
  }, [session]);

  // Loading state while session is being fetched
  if (!session) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <h2 className="mt-4 text-xl font-semibold">Loading Dashboard...</h2>
      </div>
    );
  }
  
  const isAdmin = ["admin", "super_admin"].includes(session?.user?.role as string);
  
  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>
      <div className="flex items-end justify-between mb-8">
        <p className="text-muted-foreground">
          Welcome back, {session.user?.email}
        </p>
        <p className="text-xs text-muted-foreground">
          Role: {session.user?.role}
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* Stats Cards */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Users</CardTitle>
            <CardDescription>Registered user accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{stats.userCount}</span>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
          {isAdmin && (
            <CardFooter>
              <Button variant="ghost" size="sm" className="w-full" asChild>
                <Link href="/dashboard/users">
                  <span className="flex items-center justify-between w-full">
                    View All Users
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </Link>
              </Button>
            </CardFooter>
          )}
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Blog Posts</CardTitle>
            <CardDescription>Published articles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{stats.blogPosts}</span>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" className="w-full" asChild>
              <Link href="/dashboard/blog">
                <span className="flex items-center justify-between w-full">
                  Manage Blog
                  <ChevronRight className="h-4 w-4" />
                </span>
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Leads</CardTitle>
            <CardDescription>Across all forms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{stats.totalLeads}</span>
              <BarChart4 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" className="w-full" asChild>
              <Link href="/dashboard/leads">
                <span className="flex items-center justify-between w-full">
                  View Leads
                  <ChevronRight className="h-4 w-4" />
                </span>
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Quick Actions */}
      <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Button className="h-auto py-4 px-6 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/users">
            <Users className="h-6 w-6 mb-1" />
            <span>User Management</span>
          </Link>
        </Button>
        
        <Button className="h-auto py-4 px-6 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/blog/new">
            <FileText className="h-6 w-6 mb-1" />
            <span>Create Blog Post</span>
          </Link>
        </Button>
        
        <Button className="h-auto py-4 px-6 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/leads">
            <BarChart4 className="h-6 w-6 mb-1" />
            <span>View Leads</span>
          </Link>
        </Button>
        
        <Button className="h-auto py-4 px-6 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/settings">
            <Settings className="h-6 w-6 mb-1" />
            <span>Settings</span>
          </Link>
        </Button>
      </div>

      {/* Recent Activity (Placeholder) */}
      <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Recent system activities and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-b pb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">New user registered</span>
                <span className="text-xs text-muted-foreground">2 hours ago</span>
              </div>
              <p className="text-sm text-muted-foreground">User john.doe@example.com has registered</p>
            </div>
            
            <div className="border-b pb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Blog post published</span>
                <span className="text-xs text-muted-foreground">Yesterday</span>
              </div>
              <p className="text-sm text-muted-foreground">New post &quot;Getting Started with OSINT&quot; was published</p>
            </div>
            
            <div className="pb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Lead form submission</span>
                <span className="text-xs text-muted-foreground">2 days ago</span>
              </div>
              <p className="text-sm text-muted-foreground">New contact form submission from jane.smith@company.com</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">View All Activity</Button>
        </CardFooter>
      </Card>
    </div>
  );
} 