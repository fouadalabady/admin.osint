import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { authOptions } from "@/lib/auth";
import { safeBuildExecution } from "@/lib/build-helpers";

/**
 * GET handler for listing users
 * This endpoint returns a list of users based on query parameters
 */
export async function GET(request: Request) {
  return safeBuildExecution(async () => {
    try {
      // Check authentication
      const session = await getServerSession(authOptions);
      if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      // Only admin users can list users
      const userRole = session.user.role;
      if (userRole !== 'admin' && userRole !== 'super_admin') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      
      // Get query parameters
      const url = new URL(request.url);
      const role = url.searchParams.get('role');
      const status = url.searchParams.get('status');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '10');
      
      // Calculate pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      // Get Supabase client
      const supabase = createServerSupabaseClient();
      
      // Build query
      let query = supabase.auth.admin.listUsers({ perPage: limit, page: page });
      
      // Execute query
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
      }
      
      // Filter results by role and status if provided
      let filteredUsers = data.users;
      
      if (role) {
        filteredUsers = filteredUsers.filter(user => 
          user.user_metadata?.role === role
        );
      }
      
      if (status) {
        filteredUsers = filteredUsers.filter(user => 
          user.user_metadata?.status === status
        );
      }
      
      return NextResponse.json({
        users: filteredUsers,
        count: filteredUsers.length,
        total: data.count
      });
    } catch (error: unknown) {
      const err = error instanceof Error 
        ? error 
        : new Error(String(error));
      
      console.error("Error in users listing:", err);
      return NextResponse.json(
        { error: err.message || "Failed to fetch users" },
        { status: 500 }
      );
    }
  });
}

/**
 * PATCH handler for updating user details
 * This endpoint allows updating user metadata and roles
 */
export async function PATCH(request: Request) {
  return safeBuildExecution(async () => {
    try {
      // Check authentication
      const session = await getServerSession(authOptions);
      if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      // Only admin users can update users
      const userRole = session.user.role;
      if (userRole !== 'admin' && userRole !== 'super_admin') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      
      // Get request body
      const { userId, updates } = await request.json();
      
      if (!userId || !updates) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
      
      // Get Supabase client
      const supabase = createServerSupabaseClient();
      
      // Get current user data
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userError || !userData?.user) {
        console.error("Error fetching user:", userError);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      
      const user = userData.user;
      
      // Prepare updates
      const userUpdates: any = {};
      
      if (updates.email && updates.email !== user.email) {
        userUpdates.email = updates.email;
      }
      
      if (updates.role || updates.status) {
        userUpdates.user_metadata = {
          ...user.user_metadata,
          ...(updates.role && { role: updates.role }),
          ...(updates.status && { status: updates.status })
        };
      }
      
      // Apply updates
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        userUpdates
      );
      
      if (updateError) {
        console.error("Error updating user:", updateError);
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
      }
      
      return NextResponse.json({
        message: "User updated successfully"
      });
    } catch (error: unknown) {
      const err = error instanceof Error 
        ? error 
        : new Error(String(error));
      
      console.error("Error updating user:", err);
      return NextResponse.json(
        { error: err.message || "Failed to update user" },
        { status: 500 }
      );
    }
  });
} 