import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, LogIn, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useChatState } from '../context/ChatProvider';
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

        setLoading(true);
        try {
            const { data } = await axios.post(`${API_BASE_URL}/api/users/login`, { email, password }, {
                headers: { "Content-type": "application/json" }
            });

            // Check if private key exists (E2EE)
            const privateKey = localStorage.getItem('privateKey');
            if (!privateKey) {
                toast.warning("Private key not found on this device. E2EE messages will be unreadable.");
            }

            toast.success("Identity Verified.");
            localStorage.setItem("userInfo", JSON.stringify(data));
            setUser(data);
            navigate("/dashboard");
        } catch (error) {
            const msg = error.response?.data?.message || "Login failed.";
            toast.error(msg);

            if (msg.includes("verify your email")) {
                // Potential redirect or helper
            }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen app-shell bg-slate-950 flex flex-col items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-indigo-600/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/30">
                        <Shield className="text-indigo-500" size={40} />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Access Portal</h1>
                    <p className="text-slate-400">Verifying secure communication channel...</p>
                </div>

                <div className="glass-stealth p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />

                    <form onSubmit={submitHandler} className="space-y-2">
                        <div className="stealth-input-group">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="stealth-input pl-14"
                                required
                            />
                            <label className="stealth-label left-14">Email Address</label>
                        </div>

                        <div className="stealth-input-group">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="stealth-input pl-14 pr-12"
                                required
                            />
                            <label className="stealth-label left-14">Security Code</label>
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <div className="flex justify-end pb-4">
                            <Link to="/forgot-password" size="sm" className="text-xs font-semibold text-slate-500 hover:text-indigo-400 transition-colors">
                                Recover Identity?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-stealth flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Initiate Session</span>
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-slate-500 text-sm">
                            New operative?{' '}
                            <Link to="/register" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">
                                Create Identity
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="mt-12 flex justify-center gap-8 text-slate-600">
                    <div className="flex items-center gap-2 text-xs">
                        <Shield size={14} />
                        <span>E2EE Active</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <Zap size={14} />
                        <span>Stealth Mode</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;

