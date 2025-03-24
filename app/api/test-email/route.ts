import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get('email') || 'fouadelabady@gmail.com';

  try {
    // Log the SMTP configuration for debugging
    console.log('SMTP Configuration:', {
      host: process.env.SMTP_SERVER_HOST,
      user: process.env.SMTP_SERVER_USERNAME || process.env.EMAIL_USER,
      // Don't log the actual password, just whether it exists
      hasPassword: Boolean(process.env.SMTP_SERVER_PASSWORD || process.env.EMAIL_PASS),
    });

    const result = await sendEmail({
      to: email,
      subject: 'Test Email from Admin Dashboard',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from the Admin Dashboard to verify that the SMTP configuration is working correctly.</p>
        <p>If you're seeing this, the email functionality is working!</p>
        <p>Sent at: ${new Date().toLocaleString()}</p>
      `,
    });

    if (result.success) {
      return NextResponse.json({ success: true, message: `Test email sent to ${email}` });
    } else {
      console.error('Failed to send email:', result.error);
      return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
