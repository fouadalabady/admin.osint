'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from 'next-auth/react';

export default function ProfilePage() {
    const { data: session } = useSession();

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Profile</h1>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div>
                                <label className="text-sm font-medium">Email</label>
                                <p className="text-gray-600">{session?.user?.email}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Name</label>
                                <p className="text-gray-600">{session?.user?.name || 'Not set'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Role</label>
                                <p className="text-gray-600">{session?.user?.role || 'User'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Account Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div>
                                <label className="text-sm font-medium">Account Status</label>
                                <p className="text-green-600">Active</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Member Since</label>
                                <p className="text-gray-600">March 2024</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Last Login</label>
                                <p className="text-gray-600">Today</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 