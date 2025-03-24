'use client';

import { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell,
  Shield,
  Users,
  FileText,
  Settings,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Check,
} from 'lucide-react';

// Example notification data
type NotificationType = 'info' | 'success' | 'warning' | 'error';
type NotificationCategory = 'security' | 'account' | 'system' | 'content';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: NotificationType;
  category: NotificationCategory;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Security Alert',
    message: 'Your account was accessed from a new device. If this wasn\'t you, please change your password immediately.',
    timestamp: '2 hours ago',
    read: false,
    type: 'warning',
    category: 'security',
  },
  {
    id: '2',
    title: 'Welcome to OSINT Dashboard',
    message: 'Thank you for joining. Explore the dashboard to discover all available features.',
    timestamp: '1 day ago',
    read: true,
    type: 'info',
    category: 'system',
  },
  {
    id: '3',
    title: 'New User Registration',
    message: 'User john.doe@example.com has requested to join your organization.',
    timestamp: '2 days ago',
    read: false,
    type: 'info',
    category: 'account',
  },
  {
    id: '4',
    title: 'Password Changed',
    message: 'Your password was successfully changed. If you didn\'t make this change, please contact support.',
    timestamp: '1 week ago',
    read: true,
    type: 'success',
    category: 'security',
  },
  {
    id: '5',
    title: 'System Maintenance',
    message: 'The system will be undergoing maintenance on Saturday at 2 AM UTC. Expected downtime: 30 minutes.',
    timestamp: '1 week ago',
    read: true,
    type: 'info',
    category: 'system',
  },
  {
    id: '6',
    title: 'Failed Login Attempts',
    message: 'Multiple failed login attempts detected from IP 192.168.1.1. We\'ve temporarily locked your account.',
    timestamp: '2 weeks ago',
    read: true,
    type: 'error',
    category: 'security',
  },
  {
    id: '7',
    title: 'New Content Published',
    message: 'A new blog post "Introduction to OSINT" has been published by admin@osint.sa.',
    timestamp: '3 weeks ago',
    read: true,
    type: 'success',
    category: 'content',
  },
];

export default function NotificationsPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      window.location.href = '/auth/login';
    },
  });

  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');
  const [activeCategory, setActiveCategory] = useState<'all' | NotificationCategory>('all');

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getIconForCategory = (category: NotificationCategory) => {
    switch (category) {
      case 'security':
        return <Shield className="h-4 w-4" />;
      case 'account':
        return <Users className="h-4 w-4" />;
      case 'content':
        return <FileText className="h-4 w-4" />;
      case 'system':
        return <Settings className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getBgColorForType = (type: NotificationType) => {
    switch (type) {
      case 'info':
        return 'bg-blue-50 dark:bg-blue-950';
      case 'success':
        return 'bg-green-50 dark:bg-green-950';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950';
      case 'error':
        return 'bg-red-50 dark:bg-red-950';
      default:
        return 'bg-slate-50 dark:bg-slate-800';
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    // Filter by read status
    if (activeTab === 'unread' && notification.read) return false;
    if (activeTab === 'read' && !notification.read) return false;
    
    // Filter by category
    if (activeCategory !== 'all' && notification.category !== activeCategory) return false;
    
    return true;
  });

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
  };

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Manage system alerts and messages</p>
        </div>
        
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <Check className="mr-2 h-4 w-4" />
              Mark All as Read
            </Button>
          )}
          <Badge className="ml-2 bg-primary">
            {unreadCount} Unread
          </Badge>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          {/* Read/Unread filters */}
          <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="read">Read</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={activeCategory === 'all' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setActiveCategory('all')}
            >
              All
            </Button>
            <Button 
              variant={activeCategory === 'security' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setActiveCategory('security')}
            >
              <Shield className="mr-2 h-4 w-4" />
              Security
            </Button>
            <Button 
              variant={activeCategory === 'account' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setActiveCategory('account')}
            >
              <Users className="mr-2 h-4 w-4" />
              Account
            </Button>
            <Button 
              variant={activeCategory === 'system' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setActiveCategory('system')}
            >
              <Settings className="mr-2 h-4 w-4" />
              System
            </Button>
            <Button 
              variant={activeCategory === 'content' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setActiveCategory('content')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Content
            </Button>
          </div>
        </div>

        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No notifications</h3>
              <p className="text-sm text-muted-foreground">
                You don't have any {activeTab !== 'all' ? activeTab + ' ' : ''}
                notifications {activeCategory !== 'all' ? 'in the ' + activeCategory + ' category' : ''}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <Card 
                key={notification.id}
                className={`transition-colors ${notification.read ? '' : getBgColorForType(notification.type)}`}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {getIconForType(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                        <h3 className="text-base font-semibold">{notification.title}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            <span className="flex items-center gap-1">
                              {getIconForCategory(notification.category)}
                              <span className="capitalize">{notification.category}</span>
                            </span>
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {notification.timestamp}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{notification.message}</p>
                      
                      {!notification.read && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs" 
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="mr-1 h-3 w-3" />
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        <div className="text-center mt-6">
          <Button variant="outline">Load More</Button>
        </div>
      </div>
    </div>
  );
} 