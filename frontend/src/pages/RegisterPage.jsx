import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, User, Zap, ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { generateKeyPair } from '../services/encryptionService';

const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [triggerCode, setTriggerCode] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const submitHandler = async (e) => {
        e.preventDefault();
        if (!username || !email || !password || !triggerCode) {
            toast.error("Please fill all the fields");
            return;
        }

        setLoading(true);
        try {
            // Generate E2EE Keys
            const { publicKey, privateKey } = await generateKeyPair();

            // Store private key locally
            localStorage.setItem('privateKey', privateKey);

            const { data } = await axios.post(`${API_BASE_URL}/api/users`, {
                username,
                email,
                password,
                triggerCode,
                public_key: publicKey
            });

            toast.success(data.message || "Account created! Please verify your email.");
            navigate("/");
        } catch (error) {
            toast.error(error.response?.data?.message || "Registration failed");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen app-shell bg-slate-950 flex flex-col items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-indigo-600/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/30">
                        <Shield className="text-indigo-500" size={40} />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Create Identity</h1>
                    <p className="text-slate-400">Join the invisible communication network.</p>
                </div>

                <div className="glass-stealth p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
                    <form onSubmit={submitHandler} className="space-y-1">
                        <div className="stealth-input-group">
                            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="stealth-input pl-14"
                                required
                            />
                            <label className="stealth-label left-14">Username</label>
                        </div>

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
                            <label className="stealth-label left-14">Email</label>
                        </div>

                        <div className="stealth-input-group">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="stealth-input pl-14"
                                required
                            />
                            <label className="stealth-label left-14">Password</label>
                        </div>

                        <div className="stealth-input-group">
                            <Zap className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500" size={18} />
                            <input
                                type="text"
                                placeholder="Trigger Code"
                                value={triggerCode}
                                onChange={(e) => setTriggerCode(e.target.value)}
                                className="stealth-input pl-14 border-amber-500/20 focus:border-amber-500/50"
                                required
                            />
                            <label className="stealth-label left-14">Trigger Code (Secret Access)</label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-stealth flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Initialize Genesis</span>
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-slate-500 text-sm">
                            Already identified?{' '}
                            <Link to="/" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">
                                Access Portal
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default RegisterPage;

