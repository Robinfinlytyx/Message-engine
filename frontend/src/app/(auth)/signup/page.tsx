'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, User, Mail, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function SignupPage() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        orgName: '',
        name: '',
        email: '',
        password: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { data } = await api.auth.signup(formData);
            login(data, data.user, data.organization);
            toast.success('Organization created successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Signup failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const stepVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-indigo-500/10 via-background to-background overflow-hidden relative font-inter">
            {/* Animated backgrounds */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-xl"
            >
                <div className="text-center mb-8 space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight text-foreground font-outfit">Get Started</h1>
                    <p className="text-muted-foreground italic">Setup your organization in minutes.</p>
                </div>

                <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 flex">
                        <div className={cn("h-full bg-primary transition-all duration-500", step === 1 ? "w-1/2" : "w-full")} />
                    </div>

                    <CardHeader>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-primary">Step {step} of 2</span>
                            <div className="flex gap-1">
                                <div className={cn("h-1 w-8 rounded-full", step >= 1 ? "bg-primary" : "bg-muted")} />
                                <div className={cn("h-1 w-8 rounded-full", step >= 2 ? "bg-primary" : "bg-muted")} />
                            </div>
                        </div>
                        <CardTitle className="text-2xl">
                            {step === 1 ? 'Organization Details' : 'Account Security'}
                        </CardTitle>
                        <CardDescription>
                            {step === 1 
                                ? 'Tell us about your company or project.' 
                                : 'Create your admin credentials.'}
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="min-h-[220px]">
                        <AnimatePresence mode="wait">
                            {step === 1 ? (
                                <motion.div
                                    key="step1"
                                    variants={stepVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="space-y-4"
                                >
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                name="orgName"
                                                placeholder="Organization Name (e.g. Acme Corp)" 
                                                className="pl-10 h-11 bg-background/40 border-border/50"
                                                value={formData.orgName}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                name="name"
                                                placeholder="Your Full Name" 
                                                className="pl-10 h-11 bg-background/40 border-border/50"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="step2"
                                    variants={stepVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="space-y-4"
                                >
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                name="email"
                                                type="email"
                                                placeholder="Email Address" 
                                                className="pl-10 h-11 bg-background/40 border-border/50"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                name="password"
                                                type="password"
                                                placeholder="Secure Password" 
                                                className="pl-10 h-11 bg-background/40 border-border/50"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                    
                    <CardFooter className="flex justify-between border-t border-border/50 pt-6">
                        {step === 1 ? (
                            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
                                Already have an account?
                            </Link>
                        ) : (
                            <Button variant="ghost" onClick={prevStep}>
                                Back
                            </Button>
                        )}
                        
                        {step === 1 ? (
                            <Button className="px-8" onClick={nextStep} disabled={!formData.orgName || !formData.name}>
                                Next Step
                            </Button>
                        ) : (
                            <Button className="px-8" onClick={handleSubmit} disabled={isLoading || !formData.email || !formData.password}>
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Complete Setup'}
                            </Button>
                        )}
                    </CardFooter>
                </Card>
                
                <div className="mt-8 grid grid-cols-3 gap-4">
                    <div className="flex flex-col items-center text-center space-y-1">
                        <CheckCircle2 className="h-5 w-5 text-primary opacity-50" />
                        <span className="text-[10px] uppercase font-bold tracking-tighter opacity-50">Multi-Channel</span>
                    </div>
                    <div className="flex flex-col items-center text-center space-y-1">
                        <CheckCircle2 className="h-5 w-5 text-primary opacity-50" />
                        <span className="text-[10px] uppercase font-bold tracking-tighter opacity-50">Enterprise Auth</span>
                    </div>
                    <div className="flex flex-col items-center text-center space-y-1">
                        <CheckCircle2 className="h-5 w-5 text-primary opacity-50" />
                        <span className="text-[10px] uppercase font-bold tracking-tighter opacity-50">Admin Controls</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
