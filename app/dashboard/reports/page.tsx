'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  ChevronDown,
  Download,
  FileText,
  Filter,
  BarChart,
  PieChart,
  LineChart,
  Calendar,
  RefreshCw,
  Settings,
  CalendarDays,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      window.location.href = '/auth/login';
    },
  });

  const [activeReportType, setActiveReportType] = useState('traffic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [dateRange, setDateRange] = useState('last-30-days');
  const [reportFormat, setReportFormat] = useState('pdf');
  const [includeCharts, setIncludeCharts] = useState(true);

  const reportTypes = [
    {
      id: 'traffic',
      name: 'Traffic Report',
      description: 'Website visitor analytics and page performance',
      icon: <BarChart className="h-5 w-5" />,
    },
    {
      id: 'content',
      name: 'Content Performance',
      description: 'Performance metrics for your blog posts and pages',
      icon: <FileText className="h-5 w-5" />,
    },
    {
      id: 'engagement',
      name: 'User Engagement',
      description: 'User interaction patterns and engagement metrics',
      icon: <LineChart className="h-5 w-5" />,
    },
    {
      id: 'conversion',
      name: 'Conversion Metrics',
      description: 'Lead generation and conversion data',
      icon: <PieChart className="h-5 w-5" />,
    },
  ];

  const handleGenerateReport = () => {
    setIsGenerating(true);
    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false);
      // Here you would handle the download or display of the report
    }, 2500);
  };

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
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Generate and download detailed reports about your website</p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Download Reports
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Report Types Sidebar */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Report Types</CardTitle>
            <CardDescription>Select the type of report to generate</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {reportTypes.map((type) => (
                <button
                  key={type.id}
                  className={cn(
                    "flex items-start w-full p-4 text-left hover:bg-muted/50 transition-colors",
                    activeReportType === type.id && "bg-muted"
                  )}
                  onClick={() => setActiveReportType(type.id)}
                >
                  <div className={cn(
                    "mr-3 mt-0.5 p-1.5 rounded-md bg-primary/10",
                    activeReportType === type.id && "bg-primary/20"
                  )}>
                    {type.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{type.name}</h4>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Report Configuration */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>
              {reportTypes.find(type => type.id === activeReportType)?.name || 'Report'} Configuration
            </CardTitle>
            <CardDescription>
              Customize your report settings and filters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Range */}
            <div className="space-y-3">
              <Label>Date Range</Label>
              <Select defaultValue={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-7-days">Last 7 days</SelectItem>
                  <SelectItem value="last-30-days">Last 30 days</SelectItem>
                  <SelectItem value="last-90-days">Last 90 days</SelectItem>
                  <SelectItem value="last-12-months">Last 12 months</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
              {dateRange === 'custom' && (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="start-date" className="text-xs">Start Date</Label>
                    <div className="relative">
                      <Input id="start-date" type="date" />
                      <CalendarDays className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date" className="text-xs">End Date</Label>
                    <div className="relative">
                      <Input id="end-date" type="date" />
                      <CalendarDays className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Report Format */}
            <div className="space-y-3">
              <Label>Report Format</Label>
              <Select defaultValue={reportFormat} onValueChange={setReportFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                  <SelectItem value="csv">CSV File</SelectItem>
                  <SelectItem value="json">JSON Data</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data Filtering */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Data Filtering</Label>
                {activeReportType === 'traffic' && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="h-3.5 w-3.5 mr-1.5" />
                        Filters
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4">
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm">Traffic Filters</h4>
                        <div className="space-y-2">
                          <Label htmlFor="traffic-source" className="text-xs">Traffic Source</Label>
                          <Select defaultValue="all">
                            <SelectTrigger id="traffic-source">
                              <SelectValue placeholder="All sources" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All sources</SelectItem>
                              <SelectItem value="direct">Direct</SelectItem>
                              <SelectItem value="organic">Organic search</SelectItem>
                              <SelectItem value="referral">Referral</SelectItem>
                              <SelectItem value="social">Social media</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="device-type" className="text-xs">Device Type</Label>
                          <Select defaultValue="all">
                            <SelectTrigger id="device-type">
                              <SelectValue placeholder="All devices" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All devices</SelectItem>
                              <SelectItem value="desktop">Desktop</SelectItem>
                              <SelectItem value="mobile">Mobile</SelectItem>
                              <SelectItem value="tablet">Tablet</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}

                {activeReportType === 'content' && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="h-3.5 w-3.5 mr-1.5" />
                        Filters
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4">
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm">Content Filters</h4>
                        <div className="space-y-2">
                          <Label htmlFor="content-type" className="text-xs">Content Type</Label>
                          <Select defaultValue="all">
                            <SelectTrigger id="content-type">
                              <SelectValue placeholder="All content" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All content</SelectItem>
                              <SelectItem value="blog">Blog posts</SelectItem>
                              <SelectItem value="pages">Pages</SelectItem>
                              <SelectItem value="services">Services</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sort-by" className="text-xs">Sort By</Label>
                          <Select defaultValue="visits">
                            <SelectTrigger id="sort-by">
                              <SelectValue placeholder="Most visits" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="visits">Most visits</SelectItem>
                              <SelectItem value="newest">Newest first</SelectItem>
                              <SelectItem value="engagement">Highest engagement</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              <Card className="border border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="grow">
                      <p className="text-sm">
                        {activeReportType === 'traffic' && 'Filtered by page visits and user sessions data'}
                        {activeReportType === 'content' && 'Filtered by content type and performance metrics'}
                        {activeReportType === 'engagement' && 'Filtered by user interaction patterns'}
                        {activeReportType === 'conversion' && 'Filtered by conversion goals and attribution data'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Advanced Options Toggle */}
            <div>
              <button 
                className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              >
                <Settings className="h-4 w-4 mr-1.5" />
                Advanced Options
                <ChevronDown className={cn(
                  "h-4 w-4 ml-1.5 transition-transform",
                  showAdvancedOptions && "transform rotate-180"
                )} />
              </button>
              
              {showAdvancedOptions && (
                <div className="mt-4 space-y-4 p-4 border rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="include-charts" className="text-sm">Include Charts</Label>
                      <p className="text-xs text-muted-foreground">Add visual data charts to the report</p>
                    </div>
                    <Switch 
                      id="include-charts" 
                      checked={includeCharts}
                      onCheckedChange={setIncludeCharts}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="comparison" className="text-sm">Include Comparison</Label>
                      <p className="text-xs text-muted-foreground">Compare with previous period</p>
                    </div>
                    <Switch id="comparison" defaultChecked />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="report-title" className="text-sm">Custom Report Title</Label>
                    <Input id="report-title" placeholder="Enter a custom title for your report" />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:space-y-0 bg-muted/30 mt-4">
            <p className="text-sm text-muted-foreground">
              Generating a report may take a few moments
            </p>
            <Button onClick={handleGenerateReport} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Report Preview or History Section */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>
              Previously generated reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 transition-colors">
                      <th className="h-10 px-4 text-left font-medium">Report Name</th>
                      <th className="h-10 px-4 text-left font-medium">Type</th>
                      <th className="h-10 px-4 text-left font-medium">Generated</th>
                      <th className="h-10 px-4 text-left font-medium">Format</th>
                      <th className="h-10 px-4 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3].map((_, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          {index === 0 ? 'Monthly Traffic Analysis' : 
                           index === 1 ? 'Content Performance Q2' : 
                           'Conversion Metrics Report'}
                        </td>
                        <td className="p-4">
                          {index === 0 ? 'Traffic' : 
                           index === 1 ? 'Content' : 
                           'Conversion'}
                        </td>
                        <td className="p-4">
                          {index === 0 ? '2 days ago' : 
                           index === 1 ? '1 week ago' : 
                           '3 weeks ago'}
                        </td>
                        <td className="p-4">
                          {index === 0 ? 'PDF' : 
                           index === 1 ? 'Excel' : 
                           'PDF'}
                        </td>
                        <td className="p-4">
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 