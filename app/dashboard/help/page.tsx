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
  Search,
  BookOpen,
  HelpCircle,
  LifeBuoy,
  Mail,
  MessageSquare,
  PhoneCall,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
  isOpen: boolean;
}

export default function HelpPage() {
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      window.location.href = '/auth/login';
    },
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('faq');
  const [faqs, setFaqs] = useState<FAQ[]>([
    {
      question: 'How do I create a new blog post?',
      answer: 'To create a new blog post, navigate to the Blog section in the dashboard sidebar, then click on the "+ New Post" button. Fill in the required fields like title, content, and featured image, then click "Publish" to make your post live.',
      isOpen: false,
    },
    {
      question: 'How can I change my account password?',
      answer: 'You can change your password by going to the Settings page, then selecting the "Security" tab. Click on "Change Password", enter your current password and your new password, then click "Save Changes".',
      isOpen: false,
    },
    {
      question: 'Can I schedule posts for later publication?',
      answer: 'Yes, when creating or editing a blog post, you can set a future publication date in the "Schedule" option near the Publish button. Your post will automatically go live at the scheduled time.',
      isOpen: false,
    },
    {
      question: 'How do I add team members to my account?',
      answer: 'To add team members, go to the Settings page and select the "Team" tab. Click on "Invite Member", enter their email address and select their role (Admin, Editor, or Viewer), then click "Send Invitation".',
      isOpen: false,
    },
    {
      question: 'What analytics data is available in the dashboard?',
      answer: 'The Analytics page provides data on visitor traffic, page views, session duration, bounce rate, top pages, geographic distribution, device types, and more. You can filter this data by date range to view trends over time.',
      isOpen: false,
    },
  ]);

  const toggleFAQ = (index: number) => {
    setFaqs(
      faqs.map((faq, i) => {
        if (i === index) {
          return { ...faq, isOpen: !faq.isOpen };
        }
        return faq;
      })
    );
  };

  const filteredFAQs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const documentationLinks = [
    {
      title: 'Getting Started Guide',
      description: 'Learn the basics of using the dashboard and its features',
      icon: <BookOpen className="h-6 w-6" />,
    },
    {
      title: 'Content Management',
      description: 'How to create, edit, and manage your website content',
      icon: <FileText className="h-6 w-6" />,
    },
    {
      title: 'User Management',
      description: 'Managing users, roles, and permissions',
      icon: <MessageSquare className="h-6 w-6" />,
    },
    {
      title: 'Analytics & Reporting',
      description: 'Understanding your data and generating reports',
      icon: <Search className="h-6 w-6" />,
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
          <Skeleton className="h-10 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Help & Documentation</h1>
      
      <Tabs defaultValue="getting-started" className="space-y-4">
        <TabsList>
          <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        <TabsContent value="getting-started">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <section>
                  <h3 className="text-lg font-semibold mb-2">Welcome to the Dashboard</h3>
                  <p>This guide will help you get started with using our dashboard.</p>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2">First Steps</h3>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Complete your profile setup</li>
                    <li>Explore the dashboard features</li>
                    <li>Configure your preferences</li>
                    <li>Start using the tools</li>
                  </ol>
                </section>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Features Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <section>
                  <h3 className="text-lg font-semibold mb-2">Key Features</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Analytics and Reporting</li>
                    <li>User Management</li>
                    <li>Content Management</li>
                    <li>Settings and Configuration</li>
                  </ul>
                </section>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <section>
                  <h3 className="text-lg font-semibold mb-2">Common Questions</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">How do I reset my password?</h4>
                      <p className="text-muted-foreground">Visit the Settings page and click on "Change Password".</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Can I export my data?</h4>
                      <p className="text-muted-foreground">Yes, you can export data from most sections using the export button.</p>
                    </div>
                  </div>
                </section>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support">
          <Card>
            <CardHeader>
              <CardTitle>Support</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <section>
                  <h3 className="text-lg font-semibold mb-2">Contact Support</h3>
                  <p>Need help? Contact our support team:</p>
                  <ul className="list-disc list-inside space-y-2 mt-2">
                    <li>Email: support@example.com</li>
                    <li>Phone: (555) 123-4567</li>
                    <li>Hours: Monday - Friday, 9am - 5pm EST</li>
                  </ul>
                </section>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 