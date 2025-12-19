import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, KeyRound, Sparkles } from 'lucide-react';
import Link from 'next/link';

type ResetPasswordViewProps = {
  token: string;
  handleSubmit?: (e: React.FormEvent, newPassword: string, token: string) => Promise<boolean> | boolean;
  loading?: boolean;
  initialTokenValid?: boolean;
};

export default function ResetPassword({ 
  token, 
  handleSubmit, 
  loading = false,
  initialTokenValid = true 
}: ResetPasswordViewProps) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({ newPassword: '', confirmPassword: '' });
    const [touched, setTouched] = useState({ newPassword: false, confirmPassword: false });
    const [success, setSuccess] = useState(false);
    const [tokenValid, setTokenValid] = useState(initialTokenValid);

    useEffect(() => {
        setTokenValid(initialTokenValid);
    }, [initialTokenValid]);

    const validateForm = () => {
        const newErrors = { newPassword: '', confirmPassword: '' };

        if (!newPassword && touched.newPassword) {
            newErrors.newPassword = 'Password is required';
        } else if (newPassword && newPassword.length < 8 && touched.newPassword) {
            newErrors.newPassword = 'Password must be at least 8 characters';
        }

        if (!confirmPassword && touched.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (confirmPassword && confirmPassword !== newPassword && touched.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched({ newPassword: true, confirmPassword: true });
        
        const newErrors = { newPassword: '', confirmPassword: '' };
        if (!newPassword) newErrors.newPassword = 'Password is required';
        else if (newPassword.length < 8) newErrors.newPassword = 'Password must be at least 8 characters';
        if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
        else if (confirmPassword !== newPassword) newErrors.confirmPassword = 'Passwords do not match';
        
        setErrors(newErrors);
        
        if (!newErrors.newPassword && !newErrors.confirmPassword) {
            if (handleSubmit) {
                const result = await handleSubmit(e, newPassword, token);
                if (result) {
                    setSuccess(true);
                }
            }
        }
    };

    // Invalid/Expired Token View
    if (!tokenValid) {
        return (
            <div className="min-h-screen w-screen bg-gradient-to-br from-red-500 via-pink-500 to-orange-500 flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
                </div>

                <div className="relative w-full max-w-md">
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden p-8 md:p-12 text-center">
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-red-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                            <AlertCircle className="w-12 h-12 md:w-14 md:h-14 text-red-500" />
                        </div>
                        
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">Invalid or Expired Link</h2>
                        <p className="text-gray-600 mb-6">This password reset link is no longer valid. It may have expired or already been used.</p>
                        
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6 text-left">
                            <p className="text-sm text-red-800 font-medium mb-2">What can you do?</p>
                            <ul className="text-sm text-red-700 space-y-1.5">
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 mt-0.5">•</span>
                                    <span>Request a new password reset link</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 mt-0.5">•</span>
                                    <span>Password reset links expire after 24 hours</span>
                                </li>
                            </ul>
                        </div>

                        <Link
                            href="/auth/forgotPassword"
                            className="inline-block w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                        >
                            Request New Link
                        </Link>

                        <Link 
                            href="/auth/login"
                            className="block text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors mt-4"
                        >
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Success View
    if (success) {
        return (
            <div className="min-h-screen w-screen bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
                </div>

                <div className="relative w-full max-w-md">
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden p-8 md:p-12 text-center">
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mx-auto mb-6 flex items-center justify-center animate-bounce">
                            <CheckCircle2 className="w-12 h-12 md:w-14 md:h-14 text-white" />
                        </div>
                        
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">Password Reset Successfully!</h2>
                        <p className="text-gray-600 mb-6">Your password has been reset. You can now login with your new password.</p>
                        
                        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg mb-6 text-left">
                            <p className="text-sm text-green-800 font-medium mb-2">✓ All set!</p>
                            <ul className="text-sm text-green-700 space-y-1.5">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">•</span>
                                    <span>Your password has been updated</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">•</span>
                                    <span>Use your new password to login</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">•</span>
                                    <span>Keep your password secure</span>
                                </li>
                            </ul>
                        </div>

                        <Link
                            href="/auth/login"
                            className="inline-block w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                        >
                            Go to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Reset Password Form
    return (
        <div className="min-h-screen w-screen bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            </div>

            {/* Main container */}
            <div className="relative w-full max-w-md">
                {/* Glass morphism card */}
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
                    {/* Header with gradient */}
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 md:p-10 text-center relative">
                        <div className="absolute top-4 right-4">
                            <Sparkles className="w-6 h-6 text-white/80 animate-pulse" />
                        </div>
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-white/20 backdrop-blur-sm rounded-full mx-auto mb-4 flex items-center justify-center">
                            <KeyRound className="w-10 h-10 md:w-12 md:h-12 text-white" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Reset Password</h1>
                        <p className="text-purple-100 text-sm md:text-base">Create a new secure password</p>
                    </div>

                    {/* Form section */}
                    <div className="p-6 md:p-10">
                        {/* Info box */}
                        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-lg mb-6">
                            <div className="flex gap-3">
                                <Lock className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm text-purple-800 font-medium mb-1">Choose a strong password</p>
                                    <p className="text-xs text-purple-700">Use at least 8 characters with a mix of letters and numbers</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {/* New Password input */}
                            <div className="space-y-2">
                                <label className="text-sm md:text-base font-semibold text-gray-700 flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-purple-600" />
                                    New Password
                                </label>
                                <div className="relative group">
                                    <input 
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => {
                                            setNewPassword(e.target.value);
                                            if (touched.newPassword) validateForm();
                                        }}
                                        onBlur={() => {
                                            setTouched(prev => ({ ...prev, newPassword: true }));
                                            validateForm();
                                        }}
                                        className={`w-full px-4 py-3 md:py-4 text-base bg-gray-50 border-2 ${errors.newPassword ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none ${errors.newPassword ? 'focus:border-red-500' : 'focus:border-purple-500'} focus:bg-white transition-all duration-300 placeholder:text-gray-400 pr-12`}
                                        placeholder="Enter new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl opacity-0 group-focus-within:opacity-20 blur transition-opacity duration-300"></div>
                                </div>
                                {errors.newPassword ? (
                                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                        <span>⚠️</span> {errors.newPassword}
                                    </p>
                                ) : (
                                    <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters long</p>
                                )}
                            </div>

                            {/* Confirm Password input */}
                            <div className="space-y-2">
                                <label className="text-sm md:text-base font-semibold text-gray-700 flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-purple-600" />
                                    Confirm Password
                                </label>
                                <div className="relative group">
                                    <input 
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => {
                                            setConfirmPassword(e.target.value);
                                            if (touched.confirmPassword) validateForm();
                                        }}
                                        onBlur={() => {
                                            setTouched(prev => ({ ...prev, confirmPassword: true }));
                                            validateForm();
                                        }}
                                        className={`w-full px-4 py-3 md:py-4 text-base bg-gray-50 border-2 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none ${errors.confirmPassword ? 'focus:border-red-500' : 'focus:border-purple-500'} focus:bg-white transition-all duration-300 placeholder:text-gray-400 pr-12`}
                                        placeholder="Confirm your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl opacity-0 group-focus-within:opacity-20 blur transition-opacity duration-300"></div>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                        <span>⚠️</span> {errors.confirmPassword}
                                    </p>
                                )}
                            </div>

                            {/* Submit button */}
                            <button 
                                onClick={onSubmit}
                                disabled={loading}
                                className="w-full bg-gradient-to-r cursor-pointer from-purple-600 to-indigo-600 text-white py-3.5 md:py-4 text-base md:text-lg rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                            >
                                <span className="relative z-10">{loading ? "Resetting Password..." : "Reset Password"}</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </button>

                            {/* Back to login */}
                            <Link
                                href="/auth/login"
                                className="block text-center text-sm md:text-base text-gray-600 hover:text-gray-900 font-medium transition-colors"
                            >
                                Back to Login
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Floating elements */}
                <div className="absolute -top-4 -left-4 w-20 h-20 bg-purple-400/20 rounded-full blur-xl animate-pulse pointer-events-none"></div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-indigo-400/20 rounded-full blur-xl animate-pulse pointer-events-none" style={{animationDelay: '0.5s'}}></div>
            </div>
        </div>
    );
}