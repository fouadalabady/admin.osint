'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { 
  Settings, 
  Mail, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  ChevronRight 
} from 'lucide-react';

export default function ProfilePage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      window.location.href = '/auth/login';
    },
  });
  
  const [lastLoginDate] = useState(() => {
    return new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  });
  
  // User initials for avatar
  const getInitials = () => {
    if (!session?.user?.email) return 'U';
    return session.user.email.charAt(0).toUpperCase();
  };
  
  // Role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'admin':
        return 'bg-red-500 hover:bg-red-600';
      case 'editor':
        return 'bg-blue-500 hover:bg-blue-600';
      default:
        return 'bg-green-500 hover:bg-green-600';
    }
  };

  if (status === 'loading') {
    return (
      <div className="container py-6 max-w-4xl">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">View and manage your account information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
        {/* Left column - User profile card */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src="" alt={session?.user?.email || "User"} />
                  <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
                </Avatar>
                
                <h2 className="text-xl font-bold">{session?.user?.name || session?.user?.email}</h2>
                
                <div className="flex items-center gap-2 mt-1 mb-3">
                  <Badge className={getRoleBadgeColor(session?.user?.role as string)}>
                    {session?.user?.role || 'User'}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  {session?.user?.email}
                </p>
                
                <Button asChild className="w-full" variant="outline">
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Account Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm">{session?.user?.email}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm">Joined March 2025</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm">Last login: {lastLoginDate}</span>
              </div>
              <div className="flex items-center">
                <ShieldCheck className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm">2FA: Not Enabled</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" asChild className="w-full">
                <Link href="/dashboard/settings/security">
                  <span className="flex items-center justify-between w-full">
                    Security Settings
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right column - Tabs with activity and other content */}
        <div>
          <Tabs defaultValue="activity">
            <TabsList className="mb-4">
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Activity History</CardTitle>
                  <CardDescription>
                    Your recent actions and system events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Activity items */}
                    {[1, 2, 3, 4, 5].map((item) => (
                      <div key={item} className="flex gap-4 pb-4 border-b last:border-0">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {item === 1 
                              ? 'You logged in to your account' 
                              : item === 2
                              ? 'Password changed successfully'
                              : item === 3
                              ? 'Profile information updated'
                              : item === 4
                              ? 'New notification settings saved'
                              : 'You commented on a blog post'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item === 1 
                              ? '2 hours ago' 
                              : item === 2
                              ? '2 days ago'
                              : item === 3
                              ? 'Last week'
                              : item === 4
                              ? '2 weeks ago'
                              : 'Last month'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    View All Activity
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Notifications</CardTitle>
                  <CardDescription>
                    Your latest notifications and alerts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex gap-4 pb-4 mb-4 border-b last:border-0">
                      <div className={`h-2 w-2 mt-2 rounded-full ${item === 1 ? 'bg-blue-500' : 'bg-muted'}`} />
                      <div>
                        <p className="text-sm font-medium">
                          {item === 1 
                            ? 'Your account was logged in from a new device' 
                            : item === 2
                            ? 'Welcome to the OSINT Dashboard'
                            : 'Your account has been created successfully'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item === 1 ? '2 hours ago' : item === 2 ? '1 day ago' : '2 days ago'}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    View All Notifications
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="sessions">
              <Card>
                <CardHeader>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>
                    Devices where you're currently logged in
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 border rounded-md">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-xs text-green-600 font-medium">MAC</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Current Device</p>
                          <p className="text-xs text-muted-foreground">Mac OS • Chrome • IP: 192.168.1.1</p>
                        </div>
                      </div>
                      <Badge className="bg-green-500">Current</Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full text-destructive hover:text-destructive">
                    Sign Out All Other Devices
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 