// File: pages/reset-password.tsx

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ResetPassword from '@/pages/views/ResetPassword';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = router.query;
  const [tokenValid, setTokenValid] = useState(true);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);

  // Verify token saat page load
  useEffect(() => {
    if (token && typeof token === 'string') {
      verifyToken(token);
    }
  }, [token]);

  const verifyToken = async (tokenString: string) => {
    try {
      const response = await fetch(`/api/auth/verify-reset-token?token=${tokenString}`);
      const data = await response.json();
      
      if (!data.success) {
        setTokenValid(false);
      }
    } catch (error) {
      console.error('Token verification error:', error);
      setTokenValid(false);
    } finally {
      setVerifying(false);
    }
  };

  const handleResetPassword = async (
    e: React.FormEvent, 
    newPassword: string, 
    token: string
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        return true; // Success - component akan show success screen
      } else {
        alert(data.message || 'Failed to reset password');
        return false;
      }
    } catch (error) {
      setLoading(false);
      console.error('Error:', error);
      alert('Something went wrong');
      return false;
    }
  };

  // Show loading saat verifying token
  if (verifying) {
    return (
      <div className="min-h-screen w-screen bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <ResetPassword
      token={token as string || ''}
      handleSubmit={handleResetPassword}
      loading={loading}
      initialTokenValid={tokenValid}
    />
  );
}