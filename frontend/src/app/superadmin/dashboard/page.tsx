'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import StatsCard from '@/components/StatsCard';
import { 
    LayoutDashboard, 
    Building2, 
    Users, 
    MessageSquare, 
    Activity, 
    RefreshCcw,
    Zap,
    ShieldCheck,
    ArrowUpRight,
    Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function SuperadminDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const { data } = await api.superadmin.getStats();
            setStats(data);
            setError(null);
        } catch (err) {
            setError('Failed to load platform statistics');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading && !stats) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="flex justify-between items-center">
                    <div className="h-10 w-48 bg-muted rounded-lg" />
                    <div className="h-10 w-32 bg-muted rounded-lg" />
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 rounded-2xl bg-card border border-border/50" />
                    ))}
                </div>
                <div className="h-[400px] w-full bg-card rounded-2xl border border-border/50" />
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {/* Admin Header */}
            <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-6 border-b border-border/50 pb-8">
                <div>
                    <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-widest mb-1"
                    >
                        <ShieldCheck className="h-3 w-3" /> System Root
                    </motion.div>
                    <h1 className="text-4xl font-bold tracking-tight text-foreground font-outfit">Platform Overview</h1>
                    <p className="text-muted-foreground mt-1">Global monitoring across all registered tenants and infrastructure.</p>
                </div>
                <div className="flex gap-3">
                    <Button 
                        variant="outline" 
                        onClick={() => {
                            fetchStats();
                            toast.success('Stats updated');
                        }} 
                        className="gap-2 border-indigo-500/20 hover:bg-indigo-500/5 hover:text-indigo-600 transition-colors"
                    >
                        <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
                        Sync Data
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 gap-2">
                        <Zap className="h-4 w-4 fill-white" />
                        System Config
                    </Button>
                </div>
            </div>

            {/* Platform Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Organizations"
                    value={stats?.totalOrganizations || 0}
                    icon={<Building2 className="h-5 w-5" />}
                    description="Active SaaS Tenants"
                    className="bg-indigo-600/5 border-indigo-600/10"
                />
                <StatsCard
                    title="Global Users"
                    value={stats?.totalUsers || 0}
                    icon={<Users className="h-5 w-5" />}
                    description="Across all organizations"
                />
                <StatsCard
                    title="System Projects"
                    value={stats?.totalProjects || 0}
                    icon={<Globe className="h-5 w-5" />}
                    description="Active API configurations"
                />
                <StatsCard
                    title="Total Messages"
                    value={(stats?.totalMessages || 0).toLocaleString()}
                    icon={<MessageSquare className="h-5 w-5" />}
                    description="Platform throughput"
                />
            </div>

            {/* System Health & Insights */}
            <div className="grid gap-6 md:grid-cols-7 mt-8">
                <Card className="col-span-4 border-indigo-500/10 bg-indigo-500/[0.02] backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Activity className="h-32 w-32" />
                    </div>
                    <CardHeader>
                        <CardTitle className="font-outfit text-xl">Infrastructure Performance</CardTitle>
                        <CardDescription>Real-time health status of core microservices.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            {[
                                { service: 'Auth Engine', status: 'Healthy', latency: 12 },
                                { service: 'WhatsApp Gateway', status: 'Healthy', latency: 45 },
                                { service: 'Email Provider (AWS)', status: 'Active', latency: 28 },
                                { service: 'Database Cluster', status: 'Optimal', latency: 4 },
                            ].map((s, i) => (
                                <div key={i} className="p-4 rounded-xl bg-background/50 border border-border/50 flex flex-col gap-2 hover:border-indigo-500/30 transition-all cursor-default">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-500 truncate uppercase tracking-tighter">{s.service}</span>
                                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <span className="text-sm font-bold">{s.status}</span>
                                        <span className="text-[10px] font-mono text-muted-foreground">{s.latency}ms</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-center justify-between group/alert">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600">
                                    <Activity className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold">Maintenance Window</p>
                                    <p className="text-xs text-muted-foreground">Scheduled database optimization in 3 hours.</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-orange-600 hover:bg-orange-500/10">Acknowledge</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3 border-border/50 bg-card/40 backdrop-blur-md shadow-xl">
                    <CardHeader>
                        <CardTitle className="font-outfit text-xl">Recent Tenant Activity</CardTitle>
                        <CardDescription>New registrations and state changes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {[
                                { title: 'New Org: TechFlow Solutions', time: '12 mins ago', type: 'registration' },
                                { title: 'Cloud Corp upgraded to PRO', time: '1 hour ago', type: 'billing' },
                                { title: 'New Org: Global Metrics Inc', time: '3 hours ago', type: 'registration' },
                                { title: 'System: 1.2k messages queued', time: '5 hours ago', type: 'load' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-4 group cursor-pointer">
                                    <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/20 transition-colors">
                                        <ArrowUpRight className="h-4 w-4 text-indigo-500" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-semibold leading-none group-hover:text-indigo-600 transition-colors">{item.title}</p>
                                        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70">{item.time}</p>
                                    </div>
                                </div>
                            ))}
                            <Button variant="ghost" className="w-full mt-4 text-xs font-bold uppercase tracking-widest h-10 text-indigo-600 hover:bg-indigo-500/5">
                                View Event Stream
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
