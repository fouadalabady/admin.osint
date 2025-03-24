'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface RegistrationRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'active' | 'rejected' | 'suspended';
  requested_role: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
  email_verified: boolean;
  // Join with users table
  user: {
    email: string;
  };
}

export default function RegistrationsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [registrations, setRegistrations] = useState<RegistrationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  // Check if user has admin permissions
  const isAdmin = ['admin', 'super_admin'].includes(session?.user?.role as string);

  const fetchRegistrations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/registrations');
      if (!response.ok) {
        throw new Error('Failed to fetch registrations');
      }
      const data = await response.json();
      setRegistrations(data);
    } catch (err) {
      setError('Error fetching registrations. Please try again.');
      console.error('Error fetching registrations:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session && isAdmin) {
      fetchRegistrations();
    } else if (session && !isAdmin) {
      setError('You do not have permission to view this page');
      setIsLoading(false);
    }
  }, [session, isAdmin, activeTab, fetchRegistrations]);

  const handleUpdateStatus = async (
    userId: string,
    status: 'active' | 'rejected',
    notes?: string
  ) => {
    try {
      const response = await fetch('/api/registrations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          status,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update registration status');
      }

      toast.success(
        status === 'active' ? 'User has been approved and activated' : 'User has been rejected'
      );

      fetchRegistrations();
    } catch (err) {
      console.error('Error updating registration:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update registration status';
      toast.error(errorMessage);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="mb-6 text-2xl font-bold">Registration Management</h1>
        <Card>
          <CardContent className="p-6">
            <p>You do not have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Loading registrations...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return <div className="p-4 mb-6 text-white bg-red-500 rounded-md">{error}</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Pending
          </Badge>
        );
      case 'active':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
            Active
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
            Rejected
          </Badge>
        );
      case 'suspended':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Suspended
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Registration Management</h1>
      </div>

      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="active">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === 'pending' && 'Pending Registrations'}
                {activeTab === 'active' && 'Approved Registrations'}
                {activeTab === 'rejected' && 'Rejected Registrations'}
              </CardTitle>
              <CardDescription>
                {activeTab === 'pending' && 'Review and approve new user registrations'}
                {activeTab === 'active' && 'List of all approved users'}
                {activeTab === 'rejected' && 'List of rejected registration requests'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left font-medium">Email</th>
                      <th className="px-4 py-2 text-left font-medium">Requested Role</th>
                      <th className="px-4 py-2 text-left font-medium">Email Verified</th>
                      <th className="px-4 py-2 text-left font-medium">Status</th>
                      <th className="px-4 py-2 text-left font-medium">Requested At</th>
                      <th className="px-4 py-2 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center">
                          {activeTab === 'pending' && 'No pending registrations found'}
                          {activeTab === 'active' && 'No approved registrations found'}
                          {activeTab === 'rejected' && 'No rejected registrations found'}
                        </td>
                      </tr>
                    ) : (
                      registrations.map(registration => (
                        <tr key={registration.id} className="border-b hover:bg-slate-50">
                          <td className="px-4 py-3">{registration.user?.email}</td>
                          <td className="px-4 py-3">{registration.requested_role}</td>
                          <td className="px-4 py-3">
                            {registration.email_verified ? (
                              <span className="text-green-600">Verified</span>
                            ) : (
                              <span className="text-red-600">Not Verified</span>
                            )}
                          </td>
                          <td className="px-4 py-3">{getStatusBadge(registration.status)}</td>
                          <td className="px-4 py-3">
                            {new Date(registration.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            {activeTab === 'pending' && (
                              <div className="flex gap-2">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <CheckCircle className="mr-1 h-4 w-4" />
                                      Approve
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Approve User Registration</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to approve this user? They will be
                                        granted the role:{' '}
                                        <strong>{registration.requested_role}</strong>
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="py-4">
                                      <label className="block text-sm font-medium mb-2">
                                        Admin Notes (Optional)
                                      </label>
                                      <textarea
                                        className="w-full p-2 border rounded-md"
                                        rows={3}
                                        value={adminNotes}
                                        onChange={e => setAdminNotes(e.target.value)}
                                        placeholder="Add any notes about this approval..."
                                      />
                                    </div>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel onClick={() => setAdminNotes('')}>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => {
                                          handleUpdateStatus(
                                            registration.user_id,
                                            'active',
                                            adminNotes
                                          );
                                          setAdminNotes('');
                                        }}
                                      >
                                        Approve User
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                    >
                                      <XCircle className="mr-1 h-4 w-4" />
                                      Reject
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Reject User Registration</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to reject this user&apos;s
                                        registration? This action can be reversed later if needed.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="py-4">
                                      <label className="block text-sm font-medium mb-2">
                                        Rejection Reason (Optional)
                                      </label>
                                      <textarea
                                        className="w-full p-2 border rounded-md"
                                        rows={3}
                                        value={adminNotes}
                                        onChange={e => setAdminNotes(e.target.value)}
                                        placeholder="Add the reason for rejection..."
                                      />
                                    </div>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel onClick={() => setAdminNotes('')}>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-red-600 hover:bg-red-700"
                                        onClick={() => {
                                          handleUpdateStatus(
                                            registration.user_id,
                                            'rejected',
                                            adminNotes
                                          );
                                          setAdminNotes('');
                                        }}
                                      >
                                        Reject User
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}
                            {(activeTab === 'active' || activeTab === 'rejected') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  router.push(`/dashboard/users/${registration.user_id}`)
                                }
                              >
                                View Details
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
