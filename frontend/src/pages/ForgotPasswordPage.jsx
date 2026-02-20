import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import ThemeToggle from '../components/ThemeToggle';
import { API_BASE_URL } from '../config';

const ForgotPasswordPage = () => {
    const [step, setStep] = useState(1); // 1: Verify email, 2: Reset password
    const [email, setEmail] = useState('');
    const [userId, setUserId] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [confPassword, setConfPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const verifyHandler = async (e) => {
        e.preventDefault();
        if (!email) {
            toast.error("Please enter your email");
            return;
        }
        setLoading(true);
        try {
            const { data } = await axios.post(`${API_BASE_URL}/api/users/forgot-password-verify`, { email });
            setUserId(data.userId);
            setStep(2);
            toast.success("Email verified! Please set a new password.");
        } catch (error) {
            toast.error(error.response?.data?.message || "No account found with this email");
        }
        setLoading(false);
    };

    const resetHandler = async (e) => {
        e.preventDefault();
        if (newPassword !== confPassword) {
            toast.error("Passwords do not match");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        setLoading(true);
        try {
            await axios.put(`${API_BASE_URL}/api/users/reset-password`, { userId, newPassword });
            toast.success("Password Reset Successful! Please login.");
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.message || "Reset Failed");
        }
        setLoading(false);
    };

    return (
        <div className="app-height flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-hidden relative">
            <div className="absolute top-4 right-4 z-[100]">
                <ThemeToggle />
            </div>
            <div className="w-full h-full flex items-center justify-center px-5 py-12 overflow-y-auto hide-scrollbar">
                <div className="w-full max-w-md bg-white/90 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 transform transition-all safe-top safe-bottom">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                            {step === 1 ? 'Forgot Password?' : 'Set New Password'}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {step === 1 ? 'Enter your email to recover your account' : 'Choose a strong new password'}
                        </p>
                    </div>

                    {/* Step indicator */}
                    <div className="flex items-center justify-center mb-6 space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
                        <div className={`flex-1 h-1 rounded-full transition-all max-w-[60px] ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
                    </div>

                    {step === 1 ? (
                        <form onSubmit={verifyHandler} className="space-y-4">
                            <div>
                                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email Address
                                </label>
                                <input
                                    id="forgot-email"
                                    type="email"
                                    placeholder="Enter your registered email"
                                    className="input-field"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full btn-primary py-3 font-bold flex items-center justify-center"
                                disabled={loading}
                            >
                                {loading ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : 'Verify Email'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={resetHandler} className="space-y-4">
                            <div>
                                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    New Password
                                </label>
                                <input
                                    id="new-password"
                                    type="password"
                                    placeholder="New Password (min 6 characters)"
                                    className="input-field"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="conf-new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Confirm New Password
                                </label>
                                <input
                                    id="conf-new-password"
                                    type="password"
                                    placeholder="Confirm New Password"
                                    className="input-field"
                                    value={confPassword}
                                    onChange={(e) => setConfPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full btn-primary py-3 font-bold flex items-center justify-center"
                                disabled={loading}
                            >
                                {loading ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : 'Reset Password'}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 text-center">
                        <Link to="/" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                            ← Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
