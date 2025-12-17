import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { signIn } from "next-auth/react";

type LoginViewProps = {
  handleSubmit: (e: React.FormEvent, email: string, password: string) => void;
  loading: boolean;
};

export default function LoginView({ handleSubmit, loading }: LoginViewProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSubmit(e, email, password);
    };

    return (
        <div className="min-h-screen w-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            </div>

            {/* Main container - Responsive */}
            <div className="relative w-full max-w-6xl flex flex-col lg:flex-row items-center gap-8 lg:gap-0">
                {/* Left side - Image/Illustration (Hidden on mobile) */}
                <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="relative bg-white/10 backdrop-blur-sm p-12 rounded-3xl">
                            <div className="space-y-6 text-white">
                                <h2 className="text-4xl font-bold">Welcome to Our Platform</h2>
                                <p className="text-lg text-white/90">Connect, collaborate, and create amazing things together.</p>
                                <div className="space-y-4 pt-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                            <Sparkles className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">Secure & Safe</h3>
                                            <p className="text-sm text-white/80">Your data is protected</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                            <Lock className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">Easy Access</h3>
                                            <p className="text-sm text-white/80">Login from anywhere</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right side - Login Form (Full width on mobile) */}
                <div className="w-full lg:w-1/2 flex items-center justify-center">
                    <div className="w-full max-w-md">
                        {/* Glass morphism card */}
                        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
                            {/* Header with gradient */}
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 md:p-10 text-center relative">
                                <div className="absolute top-4 right-4">
                                    <Sparkles className="w-6 h-6 text-white/80 animate-pulse" />
                                </div>
                                <div className="w-20 h-20 md:w-24 md:h-24 bg-white/20 backdrop-blur-sm rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <Lock className="w-10 h-10 md:w-12 md:h-12 text-white" />
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Welcome Back</h1>
                                <p className="text-indigo-100 text-sm md:text-base">Sign in to continue your journey</p>
                            </div>

                            {/* Form section */}
                            <div className="p-6 md:p-10">
                                <div className="space-y-5">
                                    {/* Email input */}
                                    <div className="space-y-2">
                                        <label className="text-sm md:text-base font-semibold text-gray-700 flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-indigo-600" />
                                            Email Address
                                        </label>
                                        <div className="relative group">
                                            <input 
                                                type="email" 
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full px-4 py-3 md:py-4 text-base bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all duration-300 placeholder:text-gray-400"
                                                placeholder="your.email@example.com"
                                                required
                                            />
                                            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl opacity-0 group-focus-within:opacity-20 blur transition-opacity duration-300"></div>
                                        </div>
                                    </div>

                                    {/* Password input */}
                                    <div className="space-y-2">
                                        <label className="text-sm md:text-base font-semibold text-gray-700 flex items-center gap-2">
                                            <Lock className="w-4 h-4 text-indigo-600" />
                                            Password
                                        </label>
                                        <div className="relative group">
                                            <input 
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full px-4 py-3 md:py-4 text-base bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all duration-300 placeholder:text-gray-400 pr-12"
                                                placeholder="Enter your password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl opacity-0 group-focus-within:opacity-20 blur transition-opacity duration-300"></div>
                                        </div>
                                    </div>

                                    {/* Forgot password */}
                                    <div className="flex justify-end">
                                        <a href="./forgotPassword" className="text-sm md:text-base font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                                            Forgot password?
                                        </a>
                                    </div>

                                    {/* Login button */}
                                    <button 
                                        onClick={onSubmit}
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 md:py-4 cursor-pointer text-base md:text-lg rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                                    >
                                        <span className="relative z-10">{loading ? "Signing in..." : "Sign In"}</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </button>
                                </div>

                                {/* Divider */}
                                <div className="flex items-center gap-4 my-6 md:my-8">
                                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                                    <span className="text-sm md:text-base text-gray-500 font-medium">OR</span>
                                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                                </div>

                                {/* Google login */}
                                <button
                                    onClick={() =>
                                        signIn("google", {
                                            callbackUrl: "/",
                                        })
                                    }
                                    className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 px-4 cursor-pointer py-3 md:py-4 rounded-xl hover:border-gray-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group">
                                    <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                    </svg>
                                    <span className="text-sm md:text-base font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Continue with Google</span>
                                </button>

                                {/* Sign up link */}
                                <p className="text-center text-sm md:text-base text-gray-600 mt-6">
                                    Don&apos;t have an account?{' '}
                                    <a href="./register" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                                        Create one now
                                    </a>
                                </p>
                            </div>
                        </div>

                        {/* Floating elements */}
                        <div className="absolute -top-4 -left-4 w-20 h-20 bg-yellow-400/20 rounded-full blur-xl animate-pulse pointer-events-none"></div>
                        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-pink-400/20 rounded-full blur-xl animate-pulse pointer-events-none" style={{animationDelay: '0.5s'}}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}