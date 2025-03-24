/**
 * Alternative email service that uses direct API calls to email services
 * This is useful when SMTP is not working correctly
 */

// Resend.com API (simpler alternative to SendGrid)
export const sendEmailWithResend = async ({
  to,
  subject,
}: {
  to: string;
  subject: string;
}) => {
  try {
    // Use direct fetch to email service API
    // Example using browser fetch for testing - in production you should use server API endpoint
    const response = await fetch(
      `/api/test-email-alt?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}`
    );
    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to send email: ${result.error || 'Unknown error'}`);
    }

    return { success: true, result };
  } catch (error) {
    return { success: false, error };
  }
};

// If you don't have an email service API key, this function will provide fallback behavior
// This uses the browser's mailto: protocol as a last resort
export const fallbackEmailOption = (email: string, subject: string) => {
  // Create a mailto link that will open the user's email client
  const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

  return mailtoLink;
};
