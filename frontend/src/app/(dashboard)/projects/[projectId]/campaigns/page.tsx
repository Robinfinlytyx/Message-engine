'use client';

import { use, useState, useEffect } from 'react';
import { api, Campaign, Project } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
    Megaphone, 
    PlusCircle, 
    Users, 
    PlayCircle, 
    Clock, 
    Calendar,
    ChevronRight,
    TrendingUp,
    RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Pagination from '@/components/Pagination';

const PAGE_SIZE = 10;

export default function ProjectCampaignsPage({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = use(params);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        fetchCampaigns();
    }, [projectId, currentPage]);

    // Reset pagination on search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const fetchCampaigns = async () => {
        try {
            setLoading(true);
            const { data } = await api.admin.getCampaigns({ 
                projectId,
                limit: PAGE_SIZE,
                offset: (currentPage - 1) * PAGE_SIZE
            });
            setCampaigns(data.data || []);
            setTotalCount(data.count || 0);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load campaigns');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Now';
        return new Date(dateString).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', year: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                        <Megaphone className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Broadcast Campaigns</h1>
                        <p className="text-sm text-slate-500">Manage and monitor marketing communications for this project.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchCampaigns} disabled={loading} className="rounded-xl">
                        <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                    </Button>
                    <Link href={`/projects/${projectId}/campaigns/new`}>
                        <Button size="sm" className="rounded-xl">
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Create New Campaign
                        </Button>
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="grid gap-6">
                    {[1, 2].map(i => <div key={i} className="h-48 bg-muted animate-pulse rounded-2xl border border-border" />)}
                </div>
            ) : campaigns.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm border-b-4 border-b-indigo-500/5">
                    <div className="mx-auto h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                        <Megaphone className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">No active campaigns</h3>
                    <p className="text-slate-500 mt-2 max-w-xs mx-auto text-sm">
                        Launch your first marketing broadcast to see real-time performance analytics.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {campaigns.map((campaign) => (
                        <Card key={campaign.id} className="border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 rounded-3xl overflow-hidden group">
                            <CardContent className="p-0">
                                <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                                    <div className="flex-1 p-6 md:p-8 space-y-6">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <StatusBadge status={campaign.status} />
                                                <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                                                <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(campaign.scheduleTime || campaign.createdAt)}
                                                </div>
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{campaign.name}</h3>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 group-hover:bg-white transition-colors">
                                                <div className="text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1.5 uppercase tracking-widest leading-none mt-1">
                                                    <Users className="h-3 w-3" /> Audience
                                                </div>
                                                <div className="text-xl font-black text-slate-700">{campaign.totalRecipients || '0'}</div>
                                            </div>
                                            <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50 group-hover:bg-white transition-colors">
                                                <div className="text-[10px] font-bold text-emerald-600/70 mb-1 flex items-center gap-1.5 uppercase tracking-widest leading-none mt-1">
                                                    <PlayCircle className="h-3 w-3 text-emerald-500" /> Delivered
                                                </div>
                                                <div className="text-xl font-black text-emerald-600">{campaign.deliveredCount || 0}</div>
                                            </div>
                                            <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100/50 group-hover:bg-white transition-colors">
                                                <div className="text-[10px] font-bold text-indigo-600/70 mb-1 flex items-center gap-1.5 uppercase tracking-widest leading-none mt-1">
                                                    <Clock className="h-3 w-3 text-indigo-500" /> Queued
                                                </div>
                                                <div className="text-xl font-black text-indigo-600">{campaign.sentCount || 0}</div>
                                            </div>
                                            <div className="bg-rose-50/30 p-4 rounded-2xl border border-rose-100/50 group-hover:bg-white transition-colors">
                                                <div className="text-[10px] font-bold text-rose-600/70 mb-1 flex items-center gap-1.5 uppercase tracking-widest leading-none mt-1">
                                                    <TrendingUp className="h-3 w-3 text-rose-500" /> Engagement
                                                </div>
                                                <div className="text-xl font-black text-rose-600">0%</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 md:p-8 bg-slate-50/20 flex flex-col justify-center min-w-[200px]">
                                        <Link href={`/projects/${projectId}/campaigns/${campaign.id}`} className="w-full">
                                            <Button className="w-full bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-600 hover:text-white shadow-sm font-black rounded-xl transition-all h-12">
                                                Analytics <ChevronRight className="h-4 w-4 ml-2" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

function Button({ children, variant, size, onClick, disabled, className }: any) {
    return (
        <button 
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "inline-flex items-center justify-center rounded-md font-bold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
                variant === 'outline' ? "border border-slate-200 bg-white hover:bg-slate-100 text-slate-800" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md",
                size === 'sm' ? "h-9 px-3 text-xs" : "h-11 px-5 py-2",
                className
            )}
        >
            {children}
        </button>
    );
}
