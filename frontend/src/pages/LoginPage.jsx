import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useChatState } from '../context/ChatProvider';
import ThemeToggle from '../components/ThemeToggle';
import { API_BASE_URL } from '../config';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { setUser } = useChatState();

    const submitHandler = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error("Please fill all the fields");
            return;
        }

        if (password === '#mychat=1809') {
            toast.info("Password change trigger activated");
            navigate('/forgot-password');
            return;
        }

        setLoading(true);
        try {
            const { data } = await axios.post(`${API_BASE_URL}/api/users/login`, { email, password }, {
                headers: { "Content-type": "application/json" }
            });
            toast.success("Welcome back!");
            localStorage.setItem("userInfo", JSON.stringify(data));
            setUser(data);
            navigate("/dashboard");
        } catch (error) {
            const msg = error.response?.data?.message || "Login failed. Check server connection.";
            toast.error(msg);
        }
        setLoading(false);
    };

    return (
        <div className="app-height flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-hidden relative">
            <div className="absolute top-4 right-4 z-[100]">
                <ThemeToggle />
            </div>
            <div className="w-full h-full flex items-center justify-center px-5 py-12 overflow-y-auto hide-scrollbar">
                <div className="w-full max-w-sm safe-top safe-bottom">
                    {/* Logo / branding */}
                    <div className="text-center mb-8 relative">

                        <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl
                                        flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight">SimpleConnect</h1>
                        <p className="text-white/70 text-sm mt-1">Sign in to your account</p>
                    </div>

                    {/* Card */}
                    <div className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl
                                    rounded-3xl shadow-2xl p-6 space-y-4">

                        <form onSubmit={submitHandler} className="space-y-4">
                            {/* Email */}
                            <div>
                                <label htmlFor="login-email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Email
                                </label>
                                <input
                                    id="login-email"
                                    type="email"
                                    inputMode="email"
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    className="input-field"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="login-password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="login-password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        placeholder="Your password"
                                        className="input-field pr-12"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2
                                                   w-8 h-8 flex items-center justify-center
                                                   text-gray-400 hover:text-gray-600
                                                   touch-manipulation"
                                        aria-label="Toggle password visibility"
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Forgot password */}
                            <div className="flex justify-end">
                                <Link to="/forgot-password"
                                    className="text-sm font-semibold text-indigo-600 dark:text-indigo-400
                                               hover:text-indigo-500 transition-colors">
                                    Forgot password?
                                </Link>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full btn-primary text-base font-bold tracking-wide
                                            flex items-center justify-center
                                            ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? (
                                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                ) : 'Sign In'}
                            </button>
                        </form>

                        {/* Register link */}
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-2">
                            Don't have an account?{' '}
                            <Link to="/register"
                                className="font-bold text-indigo-600 dark:text-indigo-400
                                           hover:text-indigo-500 transition-colors">
                                Sign up free
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
