import ForgotPassword from "@/pages/views/ForgotPassword";

export default function ForgotPasswordPage() {
  
  const handleForgotPassword = async (e: React.FormEvent, email: string) => {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        return true; // Success - component akan show success message
      } else {
        alert(data.message || 'Failed to send reset email');
        return false;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong');
      return false;
    }
  };

  return (
    <ForgotPassword
      handleSubmit={handleForgotPassword}
    />
  );
}