import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Mail, Lock, ArrowRight, ArrowLeft, Key } from 'lucide-react';
import { API_BASE_URL } from '../config';

const ForgotPasswordPage = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [userId, setUserId] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [confPassword, setConfPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const verifyHandler = async (e) => {
        e.preventDefault();
        if (!email) {
            toast.error("Enter your recovery signal (email)");
            return;
        }
        setLoading(true);
        try {
            const { data } = await axios.post(`${API_BASE_URL}/api/users/forgot-password-verify`, { email });
            setUserId(data.userId);
            setStep(2);
            toast.success("Identity bridge found. Upgrade your security.");
        } catch (error) {
            toast.error("No operative found with this signal.");
        }
        setLoading(false);
    };

    const resetHandler = async (e) => {
        e.preventDefault();
        if (newPassword !== confPassword) {
            toast.error("Security codes do not match");
            return;
        }
        setLoading(true);
        try {
            await axios.put(`${API_BASE_URL}/api/users/reset-password`, { userId, newPassword });
            toast.success("Identity updated. Re-authenticate now.");
            navigate('/');
        } catch (error) {
            toast.error("Identity update failed.");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen app-shell bg-slate-950 flex flex-col items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-amber-600/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-amber-500/30">
                        <Key className="text-amber-500" size={40} />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Recovery Terminal</h1>
                    <p className="text-slate-400">Restoring access to secure channels...</p>
                </div>

                <div className="glass-stealth p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50" />

                    <div className="flex items-center justify-center gap-2 mb-8">
                        <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-white/5'}`} />
                        <div className={`w-8 h-[1px] ${step >= 2 ? 'bg-amber-500/50' : 'bg-white/5'}`} />
                        <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-white/5'}`} />
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.form
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={verifyHandler}
                                className="space-y-6"
                            >
                                <div className="stealth-input-group">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="email"
                                        placeholder="Identity Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="stealth-input pl-14"
                                        required
                                    />
                                    <label className="stealth-label left-14">Recovery Signal</label>
                                </div>

                                <button type="submit" disabled={loading} className="w-full btn-stealth bg-amber-600/20 border-amber-500/30 text-amber-500 flex items-center justify-center gap-2">
                                    {loading ? <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /> : <><span>Scan Identity</span><ArrowRight size={18} /></>}
                                </button>
                            </motion.form>
                        ) : (
                            <motion.form
                                key="step2"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={resetHandler}
                                className="space-y-4"
                            >
                                <div className="stealth-input-group">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="password"
                                        placeholder="New Code"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="stealth-input pl-14"
                                        required
                                    />
                                    <label className="stealth-label left-14">New Security Code</label>
                                </div>

                                <div className="stealth-input-group">
                                    <ShieldAlert className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="password"
                                        placeholder="Confirm Code"
                                        value={confPassword}
                                        onChange={(e) => setConfPassword(e.target.value)}
                                        className="stealth-input pl-14"
                                        required
                                    />
                                    <label className="stealth-label left-14">Verify Code</label>
                                </div>

                                <button type="submit" disabled={loading} className="w-full btn-stealth bg-emerald-600/20 border-emerald-500/30 text-emerald-500 flex items-center justify-center gap-2">
                                    {loading ? <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /> : <><span>Update Identity</span><ArrowRight size={18} /></>}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    <div className="mt-8 text-center">
                        <Link to="/" className="text-slate-500 text-sm flex items-center justify-center gap-2 hover:text-white transition-colors">
                            <ArrowLeft size={16} />
                            <span>Return to Portal</span>
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPasswordPage;

