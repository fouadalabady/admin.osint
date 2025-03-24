import { useState } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

enum RegistrationStage {
  INITIAL = 'initial',
  OTP_VERIFICATION = 'otp_verification',
  PENDING_APPROVAL = 'pending_approval',
}

export default function RegistrationForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [stage, setStage] = useState<RegistrationStage>(RegistrationStage.INITIAL);
  const [userId, setUserId] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess('Registration successful! Please verify your email.');
      setUserId(data.userId);
      setStage(RegistrationStage.OTP_VERIFICATION);
    } catch (err: Error | unknown) {
      console.error('Registration error:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create account. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email: formData.email,
          otp,
          purpose: 'email_verification',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'OTP verification failed');
      }

      setSuccess(data.message);
      setStage(RegistrationStage.PENDING_APPROVAL);
    } catch (err: Error | unknown) {
      console.error('OTP verification error:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to verify OTP. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderInitialForm = () => (
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect="off"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a password"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </Button>
    </form>
  );

  const renderOTPVerification = () => (
    <form onSubmit={handleVerifyOTP} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="otp">Verification Code</Label>
        <Input
          id="otp"
          type="text"
          placeholder="Enter the 6-digit code"
          value={otp}
          onChange={e => setOtp(e.target.value)}
          required
          disabled={isLoading}
          maxLength={6}
          className="text-center text-lg tracking-widest"
        />
      </div>
      <div className="text-sm text-muted-foreground">
        <p>
          We&apos;ve sent a verification code to <strong>{formData.email}</strong>
        </p>
        <p className="mt-2">Enter the code to verify your email address.</p>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Verifying...' : 'Verify Email'}
      </Button>
    </form>
  );

  const renderPendingApproval = () => (
    <div className="space-y-4">
      <div className="p-4 bg-yellow-50 rounded-md">
        <h3 className="text-lg font-semibold text-yellow-800">Registration Pending Approval</h3>
        <p className="mt-2">
          Your email has been verified. Your account is now pending administrator approval.
        </p>
        <p className="mt-2">You will receive an email when your account has been approved.</p>
      </div>
      <Button className="w-full" onClick={onSwitchToLogin}>
        Back to Login
      </Button>
    </div>
  );

  return (
    <Card className="w-full max-w-md">
      {(error || success) && (
        <div className="p-4 border-b">
          <Alert variant={error ? 'destructive' : 'default'}>
            {error ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            <AlertDescription>{error || success}</AlertDescription>
          </Alert>
        </div>
      )}

      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">
          {stage === RegistrationStage.INITIAL && 'Create an account'}
          {stage === RegistrationStage.OTP_VERIFICATION && 'Verify your email'}
          {stage === RegistrationStage.PENDING_APPROVAL && 'Registration pending'}
        </CardTitle>
        <CardDescription>
          {stage === RegistrationStage.INITIAL && 'Enter your details to create a new account'}
          {stage === RegistrationStage.OTP_VERIFICATION &&
            'Enter the verification code sent to your email'}
          {stage === RegistrationStage.PENDING_APPROVAL &&
            'Your account is awaiting administrator approval'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {stage === RegistrationStage.INITIAL && renderInitialForm()}
        {stage === RegistrationStage.OTP_VERIFICATION && renderOTPVerification()}
        {stage === RegistrationStage.PENDING_APPROVAL && renderPendingApproval()}
      </CardContent>

      {stage === RegistrationStage.INITIAL && (
        <CardFooter>
          <div className="text-sm text-center w-full">
            Already have an account?{' '}
            <button
              type="button"
              className="text-primary underline cursor-pointer"
              onClick={onSwitchToLogin}
            >
              Sign in
            </button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
