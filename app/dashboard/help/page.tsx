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

export default function HelpCenterPage() {
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
    <div className="container py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Help Center</h1>
          <p className="text-muted-foreground">Find answers and support resources</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for help..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="faq" className="space-y-6" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full md:w-auto">
          <TabsTrigger value="faq">
            <HelpCircle className="h-4 w-4 mr-2" />
            FAQs
          </TabsTrigger>
          <TabsTrigger value="documentation">
            <BookOpen className="h-4 w-4 mr-2" />
            Documentation
          </TabsTrigger>
          <TabsTrigger value="support">
            <LifeBuoy className="h-4 w-4 mr-2" />
            Support
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>
                Find quick answers to common questions about using our platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredFAQs.length > 0 ? (
                filteredFAQs.map((faq, index) => (
                  <div
                    key={index}
                    className="border rounded-lg overflow-hidden"
                  >
                    <button
                      className="flex justify-between items-center w-full p-4 text-left font-medium focus:outline-none"
                      onClick={() => toggleFAQ(index)}
                    >
                      {faq.question}
                      {faq.isOpen ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                    {faq.isOpen && (
                      <div className="p-4 pt-0 border-t">
                        <p className="text-muted-foreground">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No results found</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    We couldn't find any FAQs matching your search query. Try using different keywords or browse our documentation.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Documentation</CardTitle>
              <CardDescription>
                Comprehensive guides and tutorials to help you use our platform effectively
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {documentationLinks.map((doc, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="bg-primary/10 p-2 rounded-full">
                            {doc.icon}
                          </div>
                          <div>
                            <h3 className="font-medium mb-1">{doc.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {doc.description}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="border-t px-6 py-4">
                        <Button variant="ghost" className="w-full justify-between">
                          View Documentation
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
              <CardDescription>
                Get in touch with our support team for personalized assistance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="bg-primary/10 p-3 rounded-full inline-block mb-4">
                        <Mail className="h-6 w-6" />
                      </div>
                      <h3 className="font-medium mb-2">Email Support</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Send us an email and we'll respond within 24 hours
                      </p>
                      <Button className="w-full">
                        Send Email
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="bg-primary/10 p-3 rounded-full inline-block mb-4">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <h3 className="font-medium mb-2">Live Chat</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Chat with our support team available during business hours
                      </p>
                      <Button className="w-full" variant="outline">
                        Start Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="bg-primary/10 p-3 rounded-full inline-block mb-4">
                        <PhoneCall className="h-6 w-6" />
                      </div>
                      <h3 className="font-medium mb-2">Phone Support</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Call us directly for urgent issues and real-time assistance
                      </p>
                      <Button className="w-full" variant="outline">
                        Call Support
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-6">
              <p className="text-sm text-center text-muted-foreground">
                Support hours: Monday to Friday, 9am - 5pm EST <br />
                Average response time: Under 24 hours
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 