'use client';

import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, BookOpen, MessageSquare, Newspaper, Users } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  // Placeholder stats - these would come from your API in a real app
  const stats = {
    totalCases: 24,
    openCases: 12,
    totalUsers: 15,
    totalPosts: 34,
    totalArticles: 8,
    totalComments: 56,
    recentArticles: [
      { id: 1, title: "Intelligence Gathering Techniques", date: "2023-05-15" },
      { id: 2, title: "Analyzing Social Media Data", date: "2023-05-10" },
      { id: 3, title: "Threat Intelligence Updates", date: "2023-05-05" }
    ],
    recentLeads: [
      { id: 1, name: "John Doe", email: "john@example.com", date: "2023-05-14" },
      { id: 2, name: "Jane Smith", email: "jane@example.com", date: "2023-05-12" },
      { id: 3, name: "Alex Johnson", email: "alex@example.com", date: "2023-05-09" }
    ]
  };

  if (status === "loading") {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            {new Date().toLocaleDateString()}
          </Badge>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCases}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.openCases} open cases
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Active platform users
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Articles</CardTitle>
                <Newspaper className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalArticles}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats.totalPosts} total posts
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Comments</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalComments}</div>
                <p className="text-xs text-muted-foreground">
                  User engagement metrics
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  System-wide activity for the past 30 days
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="flex items-center justify-center h-[200px]">
                  <Activity className="h-16 w-16 text-muted-foreground" />
                  <span className="ml-4 text-muted-foreground">Activity chart placeholder</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Articles</CardTitle>
                <CardDescription>
                  Latest published content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentArticles.map((article) => (
                    <div key={article.id} className="flex items-center">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{article.title}</p>
                        <p className="text-sm text-muted-foreground">{article.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <Button asChild size="sm" className="w-full">
                  <Link href="/dashboard/content/articles">View all articles</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Leads</CardTitle>
                <CardDescription>
                  Latest contact form submissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{lead.name}</p>
                        <p className="text-sm text-muted-foreground">{lead.email}</p>
                        <p className="text-xs text-muted-foreground">{lead.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <Button asChild size="sm" className="w-full">
                  <Link href="/dashboard/leads">View all leads</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks and shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/content/create">
                    <Newspaper className="mr-2 h-4 w-4" />
                    New Article
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/users">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Users
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/cases/create">
                    <BookOpen className="mr-2 h-4 w-4" />
                    New Case
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/settings">
                    <Activity className="mr-2 h-4 w-4" />
                    System Settings
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="h-[400px] flex items-center justify-center">
          <div className="text-center space-y-2">
            <Activity className="h-16 w-16 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-medium">Analytics Module</h3>
            <p className="text-muted-foreground">Detailed analytics will be displayed here.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="reports" className="h-[400px] flex items-center justify-center">
          <div className="text-center space-y-2">
            <Activity className="h-16 w-16 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-medium">Reports Module</h3>
            <p className="text-muted-foreground">Generated reports will be displayed here.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
