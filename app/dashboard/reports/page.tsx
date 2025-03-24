import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Overview } from '@/components/dashboard/overview';

export default function ReportsPage() {
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Reports</h1>

            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Overview />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h3 className="text-sm font-medium text-gray-600">Total Users</h3>
                                <p className="text-2xl font-bold">1,234</p>
                                <span className="text-sm text-green-600">+12% from last month</span>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h3 className="text-sm font-medium text-gray-600">Active Sessions</h3>
                                <p className="text-2xl font-bold">856</p>
                                <span className="text-sm text-green-600">+5% from last month</span>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h3 className="text-sm font-medium text-gray-600">Conversion Rate</h3>
                                <p className="text-2xl font-bold">24.8%</p>
                                <span className="text-sm text-red-600">-2% from last month</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 