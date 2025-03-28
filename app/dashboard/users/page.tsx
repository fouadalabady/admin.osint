'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trash2, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MoreHorizontal,
  Search,
  User,
  AlertCircle,
  CheckCircle,
  UserCheck,
  UserX,
  Shield,
  Plus,
  UserPlus,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { UserRole } from '@/types/auth';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Define User type
type User = {
  id: string;
  email: string;
  role: UserRole;
  status: string;
  createdAt: string;
  lastSignIn: string | null;
  emailConfirmed: boolean;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Invite user dialog state
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteUserEmail, setInviteUserEmail] = useState('');
  const [inviteUserName, setInviteUserName] = useState('');
  const [inviteUserRole, setInviteUserRole] = useState<UserRole>('user');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.users) {
        setUsers(data.users);
        setFilteredUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery) {
      setFilteredUsers(users);
      return;
    }

    const lowercaseQuery = searchQuery.toLowerCase();
    const filtered = users.filter((user) =>
      user.email.toLowerCase().includes(lowercaseQuery) ||
      user.role.toLowerCase().includes(lowercaseQuery) ||
      user.status?.toLowerCase().includes(lowercaseQuery)
    );

    setFilteredUsers(filtered);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userToDelete,
          action: 'deleteUser'
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      setUsers(users.filter(user => user.id !== userToDelete));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleInviteUser = async () => {
    setIsInviting(true);
    setInviteError('');
    
    try {
      if (!inviteUserEmail || !inviteUserName) {
        throw new Error('Email and name are required');
      }
      
      const response = await fetch('/api/auth/invite-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteUserEmail,
          name: inviteUserName,
          role: inviteUserRole,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to invite user');
      }
      
      toast.success('User invited successfully! An email has been sent with instructions.');
      setIsInviteDialogOpen(false);
      
      // Reset form
      setInviteUserEmail('');
      setInviteUserName('');
      setInviteUserRole('user');
      
      // Refresh user list
      fetchUsers();
      
    } catch (error) {
      console.error('Error inviting user:', error);
      setInviteError(error instanceof Error ? error.message : 'Failed to invite user');
      toast.error(error instanceof Error ? error.message : 'Failed to invite user');
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateUserStatus = async (userId: string, status: string) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'updateStatus',
          value: status
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user status');
      }

      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, status } 
          : user
      ));
      
      toast.success(`User status updated to ${status}`);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update user status');
    }
  };

  const handleUpdateUserRole = async (userId: string, role: UserRole) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'updateRole',
          value: role
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user role');
      }

      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role } 
          : user
      ));
      
      toast.success(`User role updated to ${role}`);
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update user role');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge variant="destructive">Super Admin</Badge>;
      case 'admin':
        return <Badge variant="default">Admin</Badge>;
      case 'editor':
        return <Badge variant="secondary">Editor</Badge>;
      default:
        return <Badge variant="outline">User</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-600">Active</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-amber-500 text-amber-600">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Users</CardTitle>
            <CardDescription className="mt-1">
              Manage users and permissions
            </CardDescription>
          </div>
          <Button onClick={() => setIsInviteDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 pb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center my-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>{formatDate(user.lastSignIn)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              
                              <DropdownMenuSeparator />
                              
                              {/* Status Updates */}
                              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                                Status
                              </DropdownMenuLabel>
                              <DropdownMenuItem 
                                onClick={() => handleUpdateUserStatus(user.id, 'active')}
                                disabled={user.status === 'active'}
                              >
                                <UserCheck className="mr-2 h-4 w-4 text-green-600" />
                                Set as Active
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleUpdateUserStatus(user.id, 'suspended')}
                                disabled={user.status === 'suspended'}
                              >
                                <UserX className="mr-2 h-4 w-4 text-red-600" />
                                Suspend User
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              {/* Role Updates - Only for admins/super admins */}
                              {['admin', 'super_admin'].includes(session?.user?.role as string) && (
                                <>
                                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                                    Role
                                  </DropdownMenuLabel>
                                  
                                  <DropdownMenuItem 
                                    onClick={() => handleUpdateUserRole(user.id, 'user')}
                                    disabled={user.role === 'user'}
                                  >
                                    <User className="mr-2 h-4 w-4" />
                                    Set as User
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuItem 
                                    onClick={() => handleUpdateUserRole(user.id, 'editor')}
                                    disabled={user.role === 'editor'}
                                  >
                                    <UserCog className="mr-2 h-4 w-4" />
                                    Set as Editor
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuItem 
                                    onClick={() => handleUpdateUserRole(user.id, 'admin')}
                                    disabled={user.role === 'admin'}
                                  >
                                    <Shield className="mr-2 h-4 w-4" />
                                    Set as Admin
                                  </DropdownMenuItem>
                                  
                                  {/* Super Admin option only for super admins */}
                                  {session?.user?.role === 'super_admin' && (
                                    <DropdownMenuItem 
                                      onClick={() => handleUpdateUserRole(user.id, 'super_admin')}
                                      disabled={user.role === 'super_admin'}
                                    >
                                      <Shield className="mr-2 h-4 w-4 text-red-600" />
                                      Set as Super Admin
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}
                              
                              <DropdownMenuSeparator />
                              
                              {/* Delete option - Only for admins/super admins */}
                              {['admin', 'super_admin'].includes(session?.user?.role as string) && (
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    setUserToDelete(user.id);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete User
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        {searchQuery ? (
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <Search className="h-6 w-6 mb-2" />
                            <p>No users found matching "{searchQuery}"</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <User className="h-6 w-6 mb-2" />
                            <p>No users found</p>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteUser();
              }}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Invite User Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
            <DialogDescription>
              Send an invitation email to a new user. They will receive a magic link to complete their profile.
            </DialogDescription>
          </DialogHeader>
          
          {inviteError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{inviteError}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="user@example.com"
                value={inviteUserEmail}
                onChange={(e) => setInviteUserEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="invite-name">Full Name</Label>
              <Input
                id="invite-name"
                placeholder="John Doe"
                value={inviteUserName}
                onChange={(e) => setInviteUserName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select
                value={inviteUserRole}
                onValueChange={(value) => setInviteUserRole(value as UserRole)}
              >
                <SelectTrigger id="invite-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  {session?.user?.role === 'super_admin' && (
                    <>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)} disabled={isInviting}>
              Cancel
            </Button>
            <Button onClick={handleInviteUser} disabled={isInviting || !inviteUserEmail || !inviteUserName}>
              {isInviting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></span>
                  Sending Invitation...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
