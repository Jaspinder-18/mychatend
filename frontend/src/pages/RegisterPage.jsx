import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useChatState } from '../context/ChatProvider';
import ThemeToggle from '../components/ThemeToggle';
import { API_BASE_URL } from '../config';

const RegisterPage = () => {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confPassword, setConfPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setUser } = useChatState();

    const submitHandler = async (e) => {
        e.preventDefault();
        if (!name || !username || !email || !password || !confPassword) {
            toast.error("Please fill all the fields");
            return;
        }
        if (password !== confPassword) {
            toast.error("Passwords do not match");
            return;
        }
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        setLoading(true);
        try {
            const { data } = await axios.post(`${API_BASE_URL}/api/users`, { name, username, email, password }, {
                headers: { "Content-type": "application/json" }
            });
            toast.success("Account created! Welcome 🎉");
            localStorage.setItem("userInfo", JSON.stringify(data));
            setUser(data);
            navigate("/dashboard");
        } catch (error) {
            toast.error(error.response?.data?.message || "Registration failed");
        }
        setLoading(false);
    };

    return (
        <div className="app-height flex items-center justify-center bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 overflow-hidden relative">
            <div className="absolute top-4 right-4 z-[100]">
                <ThemeToggle />
            </div>
            <div className="w-full h-full flex items-center justify-center px-5 py-12 overflow-y-auto hide-scrollbar">
                <div className="w-full max-w-sm safe-top safe-bottom">
                    {/* Branding */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl
                                        flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight">Create Account</h1>
                        <p className="text-white/70 text-sm mt-1">Just the basics — quick & easy</p>
                    </div>

                    {/* Card */}
                    <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl
                                    rounded-3xl shadow-2xl p-6 space-y-4">
                        <form onSubmit={submitHandler} className="space-y-4">
                            {/* Name */}
                            <div>
                                <label htmlFor="reg-name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Full Name
                                </label>
                                <input
                                    id="reg-name"
                                    type="text"
                                    inputMode="text"
                                    placeholder="Your name"
                                    className="input-field"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Username (Personal ID) */}
                            <div>
                                <label htmlFor="reg-id" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Personal ID (Username)
                                </label>
                                <input
                                    id="reg-id"
                                    type="text"
                                    inputMode="text"
                                    placeholder="Unique ID e.g. king123"
                                    className="input-field"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="reg-email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Email
                                </label>
                                <input
                                    id="reg-email"
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
                                <label htmlFor="reg-password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="reg-password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        placeholder="Min 6 characters"
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
                                                   text-gray-400 hover:text-gray-600 touch-manipulation"
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

                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="reg-conf-password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Confirm Password
                                </label>
                                <input
                                    id="reg-conf-password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    placeholder="Repeat password"
                                    className="input-field"
                                    value={confPassword}
                                    onChange={(e) => setConfPassword(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full btn-primary text-base font-bold tracking-wide
                                            flex items-center justify-center mt-2
                                            ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? (
                                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                ) : 'Create Account'}
                            </button>
                        </form>

                        <p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-2">
                            Already have an account?{' '}
                            <Link to="/"
                                className="font-bold text-emerald-600 dark:text-emerald-400
                                           hover:text-emerald-500 transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
