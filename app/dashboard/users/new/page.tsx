'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/types/auth';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function CreateUserPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isSuperAdmin = (session?.user?.role as UserRole) === 'super_admin';
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user', // Default role
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };
  
  const handleRoleChange = (value: string) => {
    setFormData(prevData => ({
      ...prevData,
      role: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Create user in Supabase Auth
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: formData.role,
            status: 'pending', // Default status for new users
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      // Success! Redirect back to users list
      router.push('/dashboard/users');
      router.refresh();
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to create user. Please try again.';
      console.error('Registration error:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="mb-6 text-2xl font-bold">Create New User</h1>

      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
          <CardDescription>Add a new user to the system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Create a secure password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">User Role</Label>
              <Select 
                value={formData.role} 
                onValueChange={handleRoleChange}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Available Roles</SelectLabel>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    {isSuperAdmin && (
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.role === 'super_admin' 
                  ? 'Super Admins have full control over the entire system' 
                  : formData.role === 'admin'
                  ? 'Admins can manage users and content'
                  : formData.role === 'editor'
                  ? 'Editors can create and edit content'
                  : 'Users have limited access to content'}
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/users')}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? 'Creating User...' : 'Create User'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
