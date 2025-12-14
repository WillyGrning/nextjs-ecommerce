import { useState } from 'react';
import Image from "next/image";
import { Mail, Lock } from 'lucide-react';
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";

type LoginViewProps = {
  handleSubmit: (e: React.FormEvent, email: string, password: string) => void;
  loading: boolean;
};

export default function LoginView({ handleSubmit, loading }: LoginViewProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
        <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
        }} className="w-screen h-screen flex justify-center items-center">
            <div style={{
                background: 'linear-gradient(to bottom, #beb3a2 50%, #ebdecc 100%)'
            }} className="h-11/12 w-3/4 max-w-5xl flex overflow-hidden shadow-[0_0_20px_20px_rgba(0,0,0,0.6),0_10px_80px_rgba(0,0,0,0.6)]">
                {/* Left side - Image */}
                <div className="relative h-full w-1/2 bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden">
                    <Image
                        src="/image/woman.png"
                        alt="woman"
                        fill
                        className="object-auto object-center" 
                        priority
                    />
                </div>  

                {/* Right side - Form */}
                <div className="bg-white h-full w-1/2 flex flex-col align-center px-16 border-tl rounded-l-3xl">
                    <div className="mb-2">
                        <h1 className="text-3xl font-bold text-gray-800 mb-5 mt-15">Sign In to your account</h1>
                    </div>

                    <form onSubmit={(e) => handleSubmit(e, email, password)}>
                        <div className="flex flex-col gap-2 mb-5">
                            <label className="text-sm font-semibold text-gray-700">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="border border-gray-300 pl-12 pr-4 py-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-gray-50 hover:bg-white"
                                    placeholder="name@gmail.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 mb-5">
                            <label className="text-sm font-semibold text-gray-700">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input 
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="border border-gray-300 pl-12 pr-4 py-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-gray-50 hover:bg-white"
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            
                            <a href="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">
                                Forgot password?
                            </a>
                        </div>

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 font-semibold transition duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                            {loading ? "Loading..." : "Login"}
                        </button>
                    </form>

                    <p className="text-sm text-gray-600 text-center mt-2">
                        Dont have an account? <Link href="./register" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">Sign up</Link>
                    </p>

                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 mt-4 mb-4">
                        <div className="border-t border-gray-300"></div>
                        <span className="text-sm text-gray-600">OR</span>
                        <div className="border-t border-gray-300"></div>
                    </div>

                    <button className="w-full flex items-center justify-center gap-3 border border-gray-300 px-4 py-3 rounded-lg hover:bg-gray-50 transition duration-200">
                        {/* <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg> */}
                        <FcGoogle className="w-5 h-5" />
                        <span className="text-sm font-medium text-gray-700">Continue with Google</span>
                    </button>
                </div>
            </div>
        </div>
    )
}