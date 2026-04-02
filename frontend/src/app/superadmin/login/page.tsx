'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, Loader2, ArrowRight, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function SuperadminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { data } = await api.auth.superAdminLogin({ email, password });
            login(data, data.user);
            toast.success('Super Admin authenticated');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Authentication failed. Administrative credentials required.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 overflow-hidden relative">
            {/* Dark administrative background pattern */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-indigo-500 opacity-20 blur-[100px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md z-10"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white mb-6 shadow-2xl shadow-indigo-600/30">
                        <ShieldAlert className="h-8 w-8" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white font-outfit">Platform Access</h1>
                    <p className="text-slate-400 mt-2 text-sm uppercase tracking-widest font-semibold italic">Administrative Environment</p>
                </div>

                <Card className="border-indigo-500/20 bg-slate-900/50 backdrop-blur-2xl shadow-[0_0_50px_rgba(79,70,229,0.1)]">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-indigo-400 text-lg">System Root Login</CardTitle>
                        <CardDescription className="text-slate-500">Authorized personnel only. Access is tracked and monitored.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                    <Input 
                                        type="email" 
                                        placeholder="admin@system.internal" 
                                        className="pl-10 h-11 bg-slate-950/50 border-slate-800 focus:border-indigo-500/50 text-slate-200 transition-all"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                    <Input 
                                        type="password" 
                                        placeholder="••••••••" 
                                        className="pl-10 h-11 bg-slate-950/50 border-slate-800 focus:border-indigo-500/50 text-slate-200 transition-all"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <Button 
                                type="submit" 
                                className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-600/20" 
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        Grant Access
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 border-t border-slate-800 pt-6 mt-2">
                        <Link href="/login" className="text-slate-500 hover:text-indigo-400 text-xs font-medium transition-colors text-center w-full uppercase tracking-tighter">
                            Return to Tenant Login
                        </Link>
                    </CardFooter>
                </Card>
                
                <div className="mt-12 flex items-center justify-center gap-4 text-[10px] text-slate-600 font-mono">
                    <span>ROOT_ACCESS_V1</span>
                    <span className="w-1 h-1 rounded-full bg-slate-800" />
                    <span>ENCRYPTED_TLS</span>
                    <span className="w-1 h-1 rounded-full bg-slate-800" />
                    <span>MFA_ENABLED</span>
                </div>
            </motion.div>
        </div>
    );
}
