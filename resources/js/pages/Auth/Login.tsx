import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Sparkles, Shield, ArrowRight, Lock, Mail, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LoginProps {
    sso_login_url: string;
}

export default function Login({ sso_login_url }: LoginProps) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: true,
    });

    const [showLocalForm, setShowLocalForm] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 sm:px-6 relative overflow-hidden">
            <Head title="Sign in to Dynime AI" />

            {/* Background ambient lighting */}
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#635bff]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                {/* Brand Logo & Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-tr from-[#5465ff] via-[#635bff] to-[#788bff] shadow-xl shadow-[#635bff]/25 mb-4">
                        <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
                        Dynime AI Studio
                    </h1>
                    <p className="text-sm text-slate-400 mt-2">
                        Next-generation enterprise intelligence & orchestration
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-xl p-6 sm:p-8 shadow-2xl space-y-6">
                    {/* SSO Single Sign-On Button */}
                    <div>
                        <a
                            href={sso_login_url}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-[#635bff] via-[#5465ff] to-[#434ee0] hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-sm shadow-lg shadow-[#635bff]/25 transition-all duration-200 transform hover:-translate-y-0.5"
                        >
                            <Shield className="w-4 h-4 text-[#bfd7ff]" />
                            <span>Continue with Dynime Account Center</span>
                            <ArrowRight className="w-4 h-4 ml-auto text-[#bfd7ff]" />
                        </a>
                        <p className="text-center text-[11px] text-slate-500 mt-2.5">
                            Unified SSO identity across Dynime ERP, AI & Cloud tools
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="relative flex items-center justify-center">
                        <div className="border-t border-slate-800 w-full" />
                        <span className="bg-slate-900 px-3 text-xs text-slate-500 uppercase tracking-wider">
                            Or administrator credentials
                        </span>
                        <div className="border-t border-slate-800 w-full" />
                    </div>

                    {/* Local Admin Login Accordion / Form */}
                    {!showLocalForm ? (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowLocalForm(true)}
                            className="w-full rounded-lg text-xs border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/80"
                        >
                            Sign in with Local Admin Account
                        </Button>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="email" className="text-xs text-slate-300">
                                    Email Address
                                </Label>
                                <div className="relative mt-1">
                                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="admin@dynime.com"
                                        required
                                        className="pl-9 rounded-lg bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:border-[#635bff] text-xs h-9"
                                    />
                                </div>
                                {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email}</p>}
                            </div>

                            <div>
                                <Label htmlFor="password" className="text-xs text-slate-300">
                                    Password
                                </Label>
                                <div className="relative mt-1">
                                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="••••••••••••"
                                        required
                                        className="pl-9 rounded-lg bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:border-[#635bff] text-xs h-9"
                                    />
                                </div>
                                {errors.password && <p className="text-xs text-rose-400 mt-1">{errors.password}</p>}
                            </div>

                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full rounded-lg text-xs bg-slate-100 hover:bg-white text-slate-950 font-semibold h-9"
                            >
                                {processing ? 'Verifying...' : 'Sign In as Admin'}
                            </Button>
                        </form>
                    )}
                </div>

                {/* Footer security badge */}
                <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>256-bit Encrypted Session • ISO-Grade Security</span>
                </div>
            </div>
        </div>
    );
}
