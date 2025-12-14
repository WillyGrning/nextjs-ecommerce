import { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Sparkles, CheckCircle } from 'lucide-react';
import { signIn } from "next-auth/react";

type LoginViewProps = {
  handleSubmit: (e: React.FormEvent, name: string, email: string, password: string) => void;
  loading: boolean;
};

export default function RegisterView({ handleSubmit, loading }: LoginViewProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({ name: '', email: '', password: '' });
    const [touched, setTouched] = useState({ name: false, email: false, password: false });

    const validateForm = () => {
        const newErrors = { name: '', email: '', password: '' };
        let isValid = true;

        if (!name && touched.name) {
            newErrors.name = 'Name is required';
            isValid = false;
        }

        if (!email && touched.email) {
            newErrors.email = 'Email is required';
            isValid = false;
        } else if (email && !/\S+@\S+\.\S+/.test(email) && touched.email) {
            newErrors.email = 'Please enter a valid email';
            isValid = false;
        }

        if (!password && touched.password) {
            newErrors.password = 'Password is required';
            isValid = false;
        } else if (password && password.length < 8 && touched.password) {
            newErrors.password = 'Password must be at least 8 characters';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    }

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setTouched({ name: true, email: true, password: true });

        const newErrors = { name: '', email: '', password: '' };
        if (!name) newErrors.name = 'Name is required';
        if (!email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Please enter a valid email';
        if (!password) newErrors.password = 'Password is required';
        else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';

        setErrors(newErrors);
        

        if (!newErrors.name && !newErrors.email && !newErrors.password) {
            if (handleSubmit) {
                handleSubmit(e, name, email, password);
            }
        }
    };

    return (
        <div className="min-h-screen w-screen bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            </div>

            {/* Main container - Responsive */}
            <div className="relative w-full max-w-6xl flex flex-col lg:flex-row-reverse items-center gap-8 lg:gap-0">
                {/* Right side - Image/Illustration (Hidden on mobile) */}
                <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="relative bg-white/10 backdrop-blur-sm p-12 rounded-3xl">
                            <div className="space-y-6 text-white">
                                <h2 className="text-4xl font-bold">Join Our Community</h2>
                                <p className="text-lg text-white/90">Start your journey with us today and unlock amazing features.</p>
                                <div className="space-y-4 pt-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                            <CheckCircle className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">Quick Setup</h3>
                                            <p className="text-sm text-white/80">Get started in minutes</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                            <Sparkles className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">Premium Features</h3>
                                            <p className="text-sm text-white/80">Access all features instantly</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                            <Lock className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">100% Secure</h3>
                                            <p className="text-sm text-white/80">Your privacy is our priority</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Left side - Register Form (Full width on mobile) */}
                <div className="w-full lg:w-1/2 flex items-center justify-center">
                    <div className="w-full max-w-md">
                        {/* Glass morphism card */}
                        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
                            {/* Header with gradient */}
                            <div className="bg-gradient-to-r from-rose-500 to-orange-500 p-8 md:p-10 text-center relative">
                                <div className="absolute top-4 right-4">
                                    <Sparkles className="w-6 h-6 text-white/80 animate-pulse" />
                                </div>
                                <div className="w-20 h-20 md:w-24 md:h-24 bg-white/20 backdrop-blur-sm rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <User className="w-10 h-10 md:w-12 md:h-12 text-white" />
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Create Account</h1>
                                <p className="text-rose-100 text-sm md:text-base">Join us and start your journey</p>
                            </div>

                            {/* Form section */}
                            <div className="p-6 md:p-10">
                                <div className="space-y-4">
                                    {/* Name input */}
                                    <div className="space-y-2">
                                        <label className="text-sm md:text-base font-semibold text-gray-700 flex items-center gap-2">
                                            <User className="w-4 h-4 text-rose-500" />
                                            Full Name
                                        </label>
                                        <div className="relative group">
                                            <input 
                                                type="text" 
                                                value={name}
                                                onChange={(e) => {
                                                    setName(e.target.value);
                                                    if (touched.name) validateForm();
                                                }}
                                                onBlur={() => {
                                                    setTouched(prev => ({ ...prev, name: true }));
                                                    validateForm();
                                                }}
                                                className={`w-full px-4 py-3 md:py-4 text-base bg-gray-50 border-2 ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none ${errors.name ? 'focus:border-red-500' : 'focus:border-rose-500'} focus:bg-white transition-all duration-300 placeholder:text-gray-400`}
                                                placeholder="John Doe"
                                            />
                                            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-rose-500 to-orange-500 rounded-xl opacity-0 group-focus-within:opacity-20 blur transition-opacity duration-300"></div>
                                        </div>
                                        {errors.name && (
                                            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                                <span>⚠️</span> {errors.name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Email input */}
                                    <div className="space-y-2">
                                        <label className="text-sm md:text-base font-semibold text-gray-700 flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-rose-500" />
                                            Email Address
                                        </label>
                                        <div className="relative group">
                                            <input 
                                                type="email" 
                                                value={email}
                                                onChange={(e) => {
                                                    setEmail(e.target.value);
                                                    if (touched.email) validateForm();
                                                }}
                                                onBlur={() => {
                                                    setTouched(prev => ({ ...prev, email: true }));
                                                    validateForm();
                                                }}
                                                className={`w-full px-4 py-3 md:py-4 text-base bg-gray-50 border-2 ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none ${errors.email ? 'focus:border-red-500' : 'focus:border-rose-500'} focus:bg-white transition-all duration-300 placeholder:text-gray-400`}
                                                placeholder="your.email@example.com"
                                            />
                                            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-rose-500 to-orange-500 rounded-xl opacity-0 group-focus-within:opacity-20 blur transition-opacity duration-300"></div>
                                        </div>
                                        {errors.email && (
                                            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                                <span>⚠️</span> {errors.email}
                                            </p>
                                        )}
                                    </div>

                                    {/* Password input */}
                                    <div className="space-y-2">
                                        <label className="text-sm md:text-base font-semibold text-gray-700 flex items-center gap-2">
                                            <Lock className="w-4 h-4 text-rose-500" />
                                            Password
                                        </label>
                                        <div className="relative group">
                                            <input 
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => {
                                                    setPassword(e.target.value);
                                                    if (touched.password) validateForm();
                                                }}
                                                onBlur={() => {
                                                    setTouched(prev => ({ ...prev, password: true }));
                                                    validateForm();
                                                }}
                                                className={`w-full px-4 py-3 md:py-4 text-base bg-gray-50 border-2 ${errors.password ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none ${errors.password ? 'focus:border-red-500' : 'focus:border-rose-500'} focus:bg-white transition-all duration-300 placeholder:text-gray-400 pr-12`}
                                                placeholder="Create a strong password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-rose-500 to-orange-500 rounded-xl opacity-0 group-focus-within:opacity-20 blur transition-opacity duration-300"></div>
                                        </div>
                                        {errors.password ? (
                                            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                                <span>⚠️</span> {errors.password}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters long</p>
                                        )}
                                    </div>

                                    {/* Register button */}
                                    <button 
                                        onClick={onSubmit}
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-rose-500 to-orange-500 text-white py-3.5 md:py-4 text-base md:text-lg rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group mt-2"
                                    >
                                        <span className="relative z-10">{loading ? "Creating Account..." : "Create Account"}</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </button>
                                </div>

                                {/* Sign in link */}
                                <p className="text-center text-sm md:text-base text-gray-600 mt-4">
                                    Already have an account?{' '}
                                    <a href="./login" className="font-semibold text-rose-500 hover:text-rose-600 transition-colors">
                                        Sign in
                                    </a>
                                </p>

                                {/* Divider */}
                                <div className="flex items-center gap-4 my-6 md:my-8">
                                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                                    <span className="text-sm md:text-base text-gray-500 font-medium">OR</span>
                                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                                </div>

                                {/* Google signup */}
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
                                    <span className="text-sm md:text-base font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Sign up with Google</span>
                                </button>

                                {/* Terms */}
                                <p className="text-xs md:text-sm text-gray-500 text-center mt-6">
                                    By signing up, you agree to our{' '}
                                    <a href="#" className="text-rose-500 hover:text-rose-600 underline">Terms of Service</a>
                                    {' '}and{' '}
                                    <a href="#" className="text-rose-500 hover:text-rose-600 underline">Privacy Policy</a>
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
    )
}