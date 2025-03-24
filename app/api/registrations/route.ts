import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { safeBuildExecution } from "@/lib/build-helpers";

// GET handler for listing registration requests
export async function GET(request: Request) {
  return safeBuildExecution(async () => {
    try {
      // Check authentication
      const session = await getServerSession(authOptions);
      if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      // Only admin users can view registrations
      const userRole = session.user.role;
      if (userRole !== 'admin' && userRole !== 'super_admin') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      
      // Get query parameters
      const url = new URL(request.url);
      const status = url.searchParams.get('status') || 'pending';
      
      // Get Supabase client
      const supabase = createServerSupabaseClient();
      
      // Fetch registration requests with user data
      const { data, error } = await supabase
        .from('user_registration_requests')
        .select(`
          *,
          user:user_id (
            id,
            email,
            created_at,
            user_metadata
          )
        `)
        .eq('status', status);
      
      if (error) {
        console.error("Error fetching registration requests:", error);
        return NextResponse.json({ error: "Failed to fetch registration requests" }, { status: 500 });
      }
      
      return NextResponse.json({ registrations: data });
    } catch (error: unknown) {
      const err = error instanceof Error 
        ? error 
        : new Error(String(error));
      
      console.error("Error in registrations listing:", err);
      return NextResponse.json(
        { error: err.message || "Failed to fetch registration requests" },
        { status: 500 }
      );
    }
  });
}

// PUT handler for approving/rejecting registration requests
export async function PUT(request: Request) {
  return safeBuildExecution(async () => {
    try {
      // Check authentication
      const session = await getServerSession(authOptions);
      if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      // Only admin users can update registrations
      const userRole = session.user.role;
      if (userRole !== 'admin' && userRole !== 'super_admin') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      
      // Get request body
      const { registrationId, userId, action, email } = await request.json();
      
      if (!registrationId || !userId || !action || !email) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
      
      // Validate action
      if (action !== 'approve' && action !== 'reject') {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
      }
      
      // Get Supabase client
      const supabase = createServerSupabaseClient();
      
      // Get the user
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userError || !userData?.user) {
        console.error("Error fetching user:", userError);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      
      const user = userData.user;
      
      if (action === 'approve') {
        // Update user status and role in auth
        const requestedRole = user.user_metadata?.requested_role || 'user';
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...user.user_metadata,
            status: 'active',
            role: requestedRole
          }
        });
        
        if (updateError) {
          console.error("Error updating user:", updateError);
          return NextResponse.json({ error: "Failed to update user status" }, { status: 500 });
        }
        
        // Update registration request status
        const { error: registrationError } = await supabase
          .from('user_registration_requests')
          .update({ 
            status: 'approved',
            approved_by: session.user.id,
            approved_at: new Date().toISOString()
          })
          .eq('id', registrationId);
        
        if (registrationError) {
          console.error("Error updating registration request:", registrationError);
          return NextResponse.json({ error: "Failed to update registration request" }, { status: 500 });
        }
        
        // Send approval email
        try {
          await sendEmail({
            to: email,
            subject: "Your Account Has Been Approved",
            html: `
              <h1>Account Approved</h1>
              <p>Congratulations! Your account registration has been approved.</p>
              <p>You can now log in with your credentials at <a href="${process.env.NEXTAUTH_URL}/auth/login">${process.env.NEXTAUTH_URL}/auth/login</a>.</p>
              <p>Thank you,<br>The Admin Dashboard Team</p>
            `
          });
        } catch (emailError) {
          console.error("Error sending approval email:", emailError);
          // Don't fail the request if email fails
        }
        
        return NextResponse.json({
          message: "Registration approved successfully",
          status: 'approved'
        });
      } else if (action === 'reject') {
        // Update registration request status
        const { error: registrationError } = await supabase
          .from('user_registration_requests')
          .update({ 
            status: 'rejected',
            approved_by: session.user.id,
            approved_at: new Date().toISOString()
          })
          .eq('id', registrationId);
        
        if (registrationError) {
          console.error("Error updating registration request:", registrationError);
          return NextResponse.json({ error: "Failed to update registration request" }, { status: 500 });
        }
        
        // Delete user from auth
        const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
        
        if (deleteError) {
          console.error("Error deleting user:", deleteError);
          return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
        }
        
        // Send rejection email
        try {
          await sendEmail({
            to: email,
            subject: "Account Registration Rejected",
            html: `
              <h1>Registration Rejected</h1>
              <p>We regret to inform you that your account registration request has been rejected.</p>
              <p>If you believe this is an error, please contact our support team.</p>
              <p>Thank you,<br>The Admin Dashboard Team</p>
            `
          });
        } catch (emailError) {
          console.error("Error sending rejection email:", emailError);
          // Don't fail the request if email fails
        }
        
        return NextResponse.json({
          message: "Registration rejected successfully",
          status: 'rejected'
        });
      }
      
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error: unknown) {
      const err = error instanceof Error 
        ? error 
        : new Error(String(error));
      
      console.error("Error processing registration action:", err);
      return NextResponse.json(
        { error: err.message || "Failed to process registration action" },
        { status: 500 }
      );
    }
  });
}