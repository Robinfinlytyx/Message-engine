'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { api, Project, Message, Campaign } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Copy,
    Terminal,
    Shield,
    ShieldOff,
    MessageSquare,
    Megaphone,
    FileText,
    Loader2,
    LayoutTemplate,
    ExternalLink,
    Zap,
    TrendingUp,
    ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ProjectOverviewDashboard({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = use(params);
    const [project, setProject] = useState<Project | null>(null);
    const [messagesCount, setMessagesCount] = useState<number>(0);
    const [campaignsCount, setCampaignsCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [toggling, setToggling] = useState(false);

    useEffect(() => {
        fetchData();
    }, [projectId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [projRes, msgRes, campRes] = await Promise.all([
                api.projects.get(projectId),
                api.admin.getMessages({ projectId, limit: 1 }),
                api.admin.getCampaigns({ projectId, limit: 1 })
            ]);
            setProject(projRes.data);
            setMessagesCount(msgRes.data.count || 0);
            setCampaignsCount(campRes.data.count || 0);
        } catch (err) {
            console.error('Failed to load project dashboard', err);
            toast.error('Dashboard synchronization failed');
        } finally {
            setLoading(false);
        }
    };

    const copyApiKey = async () => {
        if (!project) return;
        try {
            const { data } = await api.projects.getApiKey(projectId);
            await navigator.clipboard.writeText(data.apiKey);
            setCopied(true);
            toast.success('API Key secured in clipboard');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Failed to capture API key');
        }
    };

    const toggleStatus = async () => {
        if (!project) return;
        const newStatus = project.status === 'active' ? 'suspended' : 'active';
        try {
            setToggling(true);
            await api.projects.updateStatus(projectId, newStatus);
            setProject({ ...project, status: newStatus });
            toast.success(`Project ${newStatus === 'active' ? 'activated' : 'suspended'}`);
        } catch {
            toast.error('Failed to update project status');
        } finally {
            setToggling(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-20 w-1/2 bg-muted animate-pulse rounded-2xl" />
                <div className="h-64 bg-muted animate-pulse rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-2xl" />)}
                </div>
            </div>
        );
    }

    if (!project) return <div className="p-8 text-center bg-rose-50 text-rose-600 rounded-2xl font-bold">Project missing from context</div>;

    return (
        <div className="space-y-10 pb-20">
            {/* Context Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="h-16 w-16 bg-white rounded-3xl flex items-center justify-center border border-slate-100 shadow-[0_4px_15px_-2px_rgba(0,0,0,0.05)]">
                        <Zap className="h-8 w-8 text-indigo-600 fill-indigo-600/10" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black tracking-tighter text-slate-800">{project.name}</h1>
                            <StatusBadge status={project.status} />
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1 leading-none">
                            Active Project Hub · ID: {projectId.slice(-8).toUpperCase()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={toggleStatus}
                        disabled={toggling}
                        className={cn(
                            "rounded-2xl h-11 px-6 font-black transition-all text-xs uppercase tracking-widest shadow-sm",
                            project.status === 'active' 
                                ? 'text-rose-600 border-rose-100 hover:bg-rose-50' 
                                : 'text-emerald-600 border-emerald-100 hover:bg-emerald-50'
                        )}
                    >
                        {toggling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : project.status === 'active' ? <ShieldOff className="h-4 w-4 mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
                        {project.status === 'active' ? 'Suspend Node' : 'Activate Node'}
                    </Button>
                </div>
            </div>

            {/* Performance Snapshot */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-slate-200/60 shadow-xl shadow-indigo-500/5 border-b-4 border-b-indigo-500 rounded-3xl group hover:scale-[1.01] transition-all">
                    <CardHeader className="pb-3">
                        <CardDescription className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <MessageSquare className="h-3 w-3" /> Throughput
                        </CardDescription>
                        <CardTitle className="text-4xl font-black text-slate-800">{messagesCount}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Link href={`/projects/${projectId}/messages`}>
                            <Button variant="ghost" className="p-0 text-indigo-600 h-auto font-black text-xs uppercase tracking-widest hover:bg-transparent">
                                Full History <ChevronRight className="ml-1 h-3 w-3" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/60 shadow-xl shadow-indigo-500/5 border-b-4 border-b-indigo-500 rounded-3xl group hover:scale-[1.01] transition-all">
                    <CardHeader className="pb-3">
                        <CardDescription className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <Megaphone className="h-3 w-3" /> Campaigns
                        </CardDescription>
                        <CardTitle className="text-4xl font-black text-slate-800">{campaignsCount}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Link href={`/projects/${projectId}/campaigns`}>
                            <Button variant="ghost" className="p-0 text-indigo-600 h-auto font-black text-xs uppercase tracking-widest hover:bg-transparent">
                                Live Tracking <ChevronRight className="ml-1 h-3 w-3" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/60 shadow-xl shadow-indigo-500/5 border-b-4 border-b-indigo-500 rounded-3xl group hover:scale-[1.01] transition-all">
                    <CardHeader className="pb-3">
                        <CardDescription className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <LayoutTemplate className="h-3 w-3" /> Templates
                        </CardDescription>
                        <CardTitle className="text-4xl font-black text-slate-800 flex items-center justify-between">
                            <span>Synced</span>
                            <div className="h-8 w-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                                <TrendingUp className="h-4 w-4 text-indigo-500" />
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Link href={`/projects/${projectId}/templates`}>
                            <Button variant="ghost" className="p-0 text-indigo-600 h-auto font-black text-xs uppercase tracking-widest hover:bg-transparent">
                                Assets Manager <ChevronRight className="ml-1 h-3 w-3" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Infrastructure Insight */}
            <Card className="border-slate-200/60 shadow-2xl shadow-slate-200/40 rounded-3xl overflow-hidden">
                <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
                        <div className="p-10 bg-slate-50/30 flex items-center gap-8 min-w-0 flex-1">
                            <div className="h-14 w-14 bg-white rounded-2xl border border-slate-200 flex items-center justify-center shadow-sm">
                                <Terminal className="h-6 w-6 text-slate-400" />
                            </div>
                            <div className="min-w-0 space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Project API Credentials</span>
                                <div className="flex items-center gap-4">
                                    <code className="text-lg font-black font-mono text-slate-500 tracking-tighter truncate selection:bg-indigo-100 italic">
                                        {project.apiKey.slice(0, 10)}****************{project.apiKey.slice(-10)}
                                    </code>
                                </div>
                            </div>
                        </div>
                        <div className="p-10 px-14 flex items-center">
                            <Button variant="outline" onClick={copyApiKey} className="rounded-2xl h-12 px-8 font-black text-xs uppercase tracking-widest border-slate-200 bg-white shadow-sm hover:scale-105 transition-all">
                                <Copy className="h-4 w-4 mr-2" />
                                {copied ? 'Secured' : 'Access Key'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Description Card */}
            <Card className="border-slate-200/60 shadow-sm rounded-3xl bg-slate-50/20 p-8">
                <div className="flex items-start gap-5">
                    <div className="h-10 w-10 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-black text-slate-800 tracking-tight">Project Mandate</h3>
                        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl font-medium">
                            {project.description || 'This corridor is configured for high-priority enterprise communication. All activity is logged and monitored for compliance.'}
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
