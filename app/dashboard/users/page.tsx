"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "next-auth/react";
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
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MoreHorizontal, Search, User, AlertCircle, CheckCircle, UserCheck, UserX, Shield } from "lucide-react";

interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  lastSignIn: string | null;
  status: string;
  emailConfirmed: boolean;
}

interface FetchError {
  message: string;
  code?: string;
  details?: string;
}

type UserRole = 'user' | 'admin' | 'super_admin';

export default function UsersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState("");
  const [dialogUserId, setDialogUserId] = useState("");
  const [dialogUserEmail, setDialogUserEmail] = useState("");
  const [dialogValue, setDialogValue] = useState("");

  // Check if current user is admin or super_admin
  const userRole = session?.user?.role as UserRole;
  const isAdmin = ['admin', 'super_admin'].includes(userRole);
  const isSuperAdmin = userRole === 'super_admin';

  // Add missing success state
  const [success, setSuccess] = useState("");

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setUsers(data.users);
    } catch (err: unknown) {
      console.error("Error fetching users:", err);
      const error = err as FetchError;
      setError(error.message || "Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch users if the session is loaded and the user has admin privileges
    if (status === 'authenticated' && isAdmin) {
      fetchUsers();
    } else if (status === 'authenticated') {
      // If authenticated but not admin, set loading to false
      setIsLoading(false);
    }
  }, [status, isAdmin]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const lowercaseQuery = searchQuery.toLowerCase();
    const filtered = users.filter(user => 
      user.email.toLowerCase().includes(lowercaseQuery) ||
      user.role.toLowerCase().includes(lowercaseQuery) ||
      user.status.toLowerCase().includes(lowercaseQuery)
    );
    
    setFilteredUsers(filtered);
  }, [users, searchQuery]);

  const handleDeleteUser = async (userId: string) => {
    try {
      setIsDeleting(true);
      const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      toast.success('User deleted successfully');
      // Refresh the users list
      fetchUsers();
    } catch (err: unknown) {
      console.error("Error deleting user:", err);
      const error = err as FetchError;
      toast.error(error.message || "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle user action (update status, role, or delete)
  const handleUserAction = async (action: string, userId: string, value?: string) => {
    try {
      setError("");
      setSuccess("");
      
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, action, value }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} user`);
      }
      
      // Update local state based on action
      if (action === "deleteUser") {
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        setSuccess(`User deleted successfully`);
      } else if (action === "updateStatus") {
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId ? { ...user, status: value as string } : user
          )
        );
        setSuccess(`User status updated to ${value}`);
      } else if (action === "updateRole") {
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId ? { ...user, role: value as string } : user
          )
        );
        setSuccess(`User role updated to ${value}`);
      }
      
    } catch (err) {
      console.error(`Error performing ${action}:`, err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsDialogOpen(false);
    }
  };

  // Open confirmation dialog
  const openDialog = (action: string, userId: string, userEmail: string, value?: string) => {
    setDialogAction(action);
    setDialogUserId(userId);
    setDialogUserEmail(userEmail);
    setDialogValue(value || "");
    setIsDialogOpen(true);
  };

  // Get badge color based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Get badge color based on role
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Badge variant="default" className="bg-purple-600">Super Admin</Badge>;
      case "admin":
        return <Badge variant="default" className="bg-blue-600">Admin</Badge>;
      case "user":
        return <Badge variant="outline">User</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="mb-6 text-2xl font-bold">User Management</h1>
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
          <p>Loading users...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <div className="p-4 mb-6 text-white bg-red-500 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="container py-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        {error && (
          <div className="px-6 pb-3">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Last Sign In</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No users found matching your search" : "No users found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{user.email}</span>
                        {user.emailConfirmed && (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell>{formatDate(user.lastSignIn)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          
                          <DropdownMenuSeparator />
                          
                          {/* Status actions */}
                          <DropdownMenuItem 
                            onClick={() => openDialog("updateStatus", user.id, user.email, "active")}
                            disabled={user.status === "active"}
                          >
                            <UserCheck className="h-4 w-4 mr-2 text-green-500" />
                            Activate User
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => openDialog("updateStatus", user.id, user.email, "pending")}
                            disabled={user.status === "pending"}
                          >
                            <User className="h-4 w-4 mr-2 text-amber-500" />
                            Set to Pending
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => openDialog("updateStatus", user.id, user.email, "rejected")}
                            disabled={user.status === "rejected"}
                          >
                            <UserX className="h-4 w-4 mr-2 text-red-500" />
                            Reject User
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          {/* Role actions */}
                          <DropdownMenuItem 
                            onClick={() => openDialog("updateRole", user.id, user.email, "user")}
                            disabled={user.role === "user"}
                          >
                            <User className="h-4 w-4 mr-2" />
                            Set as User
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => openDialog("updateRole", user.id, user.email, "admin")}
                            disabled={user.role === "admin"}
                          >
                            <Shield className="h-4 w-4 mr-2 text-blue-500" />
                            Set as Admin
                          </DropdownMenuItem>
                          
                          {isSuperAdmin && (
                            <DropdownMenuItem 
                              onClick={() => openDialog("updateRole", user.id, user.email, "super_admin")}
                              disabled={user.role === "super_admin"}
                            >
                              <Shield className="h-4 w-4 mr-2 text-purple-500" />
                              Set as Super Admin
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          {/* Delete action */}
                          <DropdownMenuItem 
                            onClick={() => openDialog("deleteUser", user.id, user.email)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogAction === "deleteUser" 
                ? "Delete User" 
                : dialogAction === "updateStatus" 
                  ? "Change User Status" 
                  : "Change User Role"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogAction === "deleteUser" 
                ? `Are you sure you want to delete the user ${dialogUserEmail}? This action cannot be undone.` 
                : dialogAction === "updateStatus" 
                  ? `Are you sure you want to change the status of user ${dialogUserEmail} to "${dialogValue}"?` 
                  : `Are you sure you want to change the role of user ${dialogUserEmail} to "${dialogValue}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleUserAction(dialogAction, dialogUserId, dialogValue)}
              className={dialogAction === "deleteUser" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 