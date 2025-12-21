import { useState } from 'react';
import { Mail, ArrowLeft, KeyRound, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

type ForgotPasswordProps = {
  handleSubmit?: (e: React.FormEvent, email: string) => Promise<boolean> | boolean;
  loading?: boolean;
};

export default function ForgotPassword({ handleSubmit, loading = false }: ForgotPasswordProps) {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [touched, setTouched] = useState(false);

    const validateEmail = () => {
        if (!email && touched) {
            setError('Email is required');
            return false;
        } else if (email && !/\S+@\S+\.\S+/.test(email) && touched) {
            setError('Please enter a valid email');
            return false;
        }
        setError('');
        return true;
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setTouched(true);
        
        if (!email) {
            setError('Email is required');
            return;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email');
            return;
        }
        
        setError('');
        if (handleSubmit) {
            handleSubmit(e, email);
        }
        // Simulate success
        setSubmitted(true);
    };

    return (
        <div className="min-h-screen w-screen bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-400/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            </div>

            {/* Main container */}
            <div className="relative w-full max-w-md">
                {/* Glass morphism card */}
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
                    {!submitted ? (
                        <>
                            {/* Header with gradient */}
                            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-8 md:p-10 text-center relative">
                                <div className="absolute top-4 right-4">
                                    <Sparkles className="w-6 h-6 text-white/80 animate-pulse" />
                                </div>
                                <div className="w-20 h-20 md:w-24 md:h-24 bg-white/20 backdrop-blur-sm rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <KeyRound className="w-10 h-10 md:w-12 md:h-12 text-white" />
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Lupa Password?</h1>
                                <p className="text-cyan-100 text-sm md:text-base">Jangan khawatir, kami akan mengirimkan link untuk mereset password</p>
                            </div>

                            {/* Form section */}
                            <div className="p-6 md:p-10">
                                {/* Info box */}
                                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
                                    <div className="flex gap-3">
                                        <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-blue-800 font-medium mb-1">Masukkan alamat email Anda</p>
                                            <p className="text-xs text-blue-700">Kami akan mengirimkan link untuk mereset password</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    {/* Email input */}
                                    <div className="space-y-2">
                                        <label className="text-sm md:text-base font-semibold text-gray-700 flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-cyan-500" />
                                            Email
                                        </label>
                                        <div className="relative group">
                                            <input 
                                                type="email" 
                                                value={email}
                                                onChange={(e) => {
                                                    setEmail(e.target.value);
                                                    if (touched) validateEmail();
                                                }}
                                                onBlur={() => {
                                                    setTouched(true);
                                                    validateEmail();
                                                }}
                                                className={`w-full px-4 py-3 md:py-4 text-base bg-gray-50 border-2 ${error ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none ${error ? 'focus:border-red-500' : 'focus:border-cyan-500'} focus:bg-white transition-all duration-300 placeholder:text-gray-400`}
                                                placeholder="Email"
                                            />
                                            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl opacity-0 group-focus-within:opacity-20 blur transition-opacity duration-300"></div>
                                        </div>
                                        {error && (
                                            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                                <span>⚠️</span> {error}
                                            </p>
                                        )}
                                    </div>

                                    {/* Submit button */}
                                    <button 
                                        onClick={onSubmit}
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r cursor-pointer from-cyan-500 to-blue-600 text-white py-3.5 md:py-4 text-base md:text-lg rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                                    >
                                        <span className="relative z-10">{loading ? "Loading..." : "Kirim Link Reset"}</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </button>

                                    {/* Back to login */}
                                    <a 
                                        href="./login"
                                        className="flex items-center justify-center gap-2 text-sm md:text-base text-gray-600 hover:text-gray-900 font-medium transition-colors group"
                                    >
                                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                        Kembali ke Login
                                    </a>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Success state */}
                            <div className="p-8 md:p-12 text-center">
                                <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mx-auto mb-6 flex items-center justify-center animate-bounce">
                                    <CheckCircle2 className="w-12 h-12 md:w-14 md:h-14 text-white" />
                                </div>
                                
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">Cek Email Anda!</h2>
                                <p className="text-gray-600 mb-2">Kami telah mengirimkan link reset password ke:</p>
                                <p className="text-cyan-600 font-semibold mb-6">{email}</p>
                                
                                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                                    <p className="text-sm text-gray-700 mb-2 font-medium">📬 Apa selanjutnya?</p>
                                    <ul className="text-sm text-gray-600 space-y-1.5">
                                        <li className="flex items-start gap-2">
                                            <span className="text-cyan-500 mt-0.5">•</span>
                                            <span>Klik link di email Anda untuk mereset password</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-cyan-500 mt-0.5">•</span>
                                            <span>Link akan kedaluwarsa dalam 24 jam</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-cyan-500 mt-0.5">•</span>
                                            <span>Cek folder spam jika tidak menemukan email</span>
                                        </li>
                                    </ul>
                                </div>

                                <button 
                                    onClick={() => setSubmitted(false)}
                                    className="text-sm text-cyan-600 cursor-pointer hover:text-cyan-700 font-medium mb-4 hover:underline"
                                >
                                    Tidak menerima email? Kirim ulang
                                </button>

                                <a 
                                    href="./login"
                                    className="flex items-center justify-center gap-2 text-sm md:text-base text-gray-600 hover:text-gray-900 font-medium transition-colors group mt-4"
                                >
                                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                    Kembali ke Login
                                </a>
                            </div>
                        </>
                    )}
                </div>

                {/* Floating elements */}
                <div className="absolute -top-4 -left-4 w-20 h-20 bg-cyan-400/20 rounded-full blur-xl animate-pulse pointer-events-none"></div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-400/20 rounded-full blur-xl animate-pulse pointer-events-none" style={{animationDelay: '0.5s'}}></div>
            </div>
        </div>
    );
}