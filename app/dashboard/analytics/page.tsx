'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Calendar, Download, Users, BarChart2, TrendingUp, FileText, Eye, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function AnalyticsPage() {
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      window.location.href = '/auth/login';
    },
  });

  const [timeframe, setTimeframe] = useState('7d'); // 7d, 30d, 90d, 12m

  // Mock data
  const metrics = [
    {
      title: 'Total Visitors',
      value: '24,532',
      change: '+12.3%',
      trend: 'up',
      icon: <Eye className="h-5 w-5" />,
    },
    {
      title: 'Page Views',
      value: '56,789',
      change: '+8.1%',
      trend: 'up',
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: 'Avg. Session Duration',
      value: '3m 42s',
      change: '+5.7%',
      trend: 'up',
      icon: <Clock className="h-5 w-5" />,
    },
    {
      title: 'Bounce Rate',
      value: '42.3%',
      change: '-2.8%',
      trend: 'down',
      icon: <TrendingUp className="h-5 w-5" />,
    },
  ];

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-[150px]" />
          <Skeleton className="h-[150px]" />
          <Skeleton className="h-[150px]" />
          <Skeleton className="h-[150px]" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Track website performance and user engagement</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-muted rounded-md p-1">
            <TabsList>
              <TabsTrigger 
                value="7d" 
                onClick={() => setTimeframe('7d')}
                className={timeframe === '7d' ? 'bg-background' : ''}
              >
                7D
              </TabsTrigger>
              <TabsTrigger 
                value="30d" 
                onClick={() => setTimeframe('30d')}
                className={timeframe === '30d' ? 'bg-background' : ''}
              >
                30D
              </TabsTrigger>
              <TabsTrigger 
                value="90d" 
                onClick={() => setTimeframe('90d')}
                className={timeframe === '90d' ? 'bg-background' : ''}
              >
                90D
              </TabsTrigger>
              <TabsTrigger 
                value="12m" 
                onClick={() => setTimeframe('12m')}
                className={timeframe === '12m' ? 'bg-background' : ''}
              >
                12M
              </TabsTrigger>
            </TabsList>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Metrics cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  {metric.icon}
                </div>
                <span className={`flex items-center text-sm font-medium ${
                  metric.trend === 'up' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {metric.trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                  )}
                  {metric.change}
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-muted-foreground text-sm font-medium">{metric.title}</h3>
                <p className="text-3xl font-bold">{metric.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Visitors Overview</CardTitle>
          <CardDescription>Website traffic over time</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[350px] w-full flex items-center justify-center bg-muted/20 rounded-md">
            <div className="text-center">
              <BarChart2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Chart Visualization</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Interactive charts will be available in the next release. This placeholder
                represents where your visitor data visualization will appear.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most visited pages on your site</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">/{i === 0 ? '' : i === 1 ? 'about' : i === 2 ? 'services' : i === 3 ? 'blog' : 'contact'}</p>
                    <p className="text-sm text-muted-foreground">{(5000 - i * 1000).toLocaleString()} views</p>
                  </div>
                  <span className="text-sm text-green-500 flex items-center">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    {(10 - i).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Demographics</CardTitle>
            <CardDescription>Where your visitors are from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['United States', 'United Kingdom', 'Germany', 'France', 'Canada'].map((country, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-muted rounded-full mr-3"></div>
                    <span>{country}</span>
                  </div>
                  <span>{(40 - i * 5)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Clock component since it's used but not imported
function Clock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
} 