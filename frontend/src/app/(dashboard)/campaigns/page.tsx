'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, Campaign, Project } from '@/lib/api';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import StatusBadge from '@/components/StatusBadge';
import { 
    Megaphone, 
    Search, 
    RefreshCw, 
    Calendar,
    ChevronRight,
    Users,
    TrendingUp,
    Briefcase,
    LayoutDashboard,
    Clock,
    PlayCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Pagination from '@/components/Pagination';

const PAGE_SIZE = 10;

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        fetchData();
    }, [currentPage]);

    // Reset pagination on search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [campRes, projRes] = await Promise.all([
                api.getAdminCampaigns({
                    limit: PAGE_SIZE,
                    offset: (currentPage - 1) * PAGE_SIZE
                }),
                api.projects.list()
            ]);
            setCampaigns(campRes.data.data || []);
            setTotalCount(campRes.data.count || 0);
            setProjects(projRes.data.data || []);
        } catch (err) {
            setError('Failed to load campaigns data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Not scheduled';
        return new Date(dateString).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getProjectName = (projectId: string) => {
        return projects.find(p => p.id === projectId)?.name || 'Unknown Project';
    };

    const filteredCampaigns = campaigns.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && campaigns.length === 0) {
        return (
            <div className="space-y-6">
                <div className="h-10 w-64 bg-muted animate-pulse rounded-xl" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
                    {[1, 2].map(i => <div key={i} className="h-48 bg-muted animate-pulse rounded-2xl border border-border/50" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100/50">
                        <TrendingUp className="h-7 w-7 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Campaign Analytics</h1>
                        <p className="text-sm text-slate-500">Track and monitor all marketing campaigns across your integrated projects.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={fetchData} className="rounded-xl border-slate-200 hover:bg-slate-50">
                        <RefreshCw className={cn("h-4 w-4 mr-2 text-slate-500", loading && "animate-spin")} />
                        Refresh Data
                    </Button>
                </div>
            </div>

            {/* Premium Filtering Toolbar */}
            <Card className="border-slate-200/60 shadow-sm overflow-hidden rounded-2xl">
                <CardContent className="p-4 bg-white flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Find specific campaign..."
                            className="pl-10 h-10 rounded-xl border-slate-200 bg-slate-50/30 focus:bg-white transition-all outline-none ring-offset-2 ring-indigo-100"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="text-xs text-slate-500 font-medium px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                        Total Campaigns: <span className="text-indigo-600 font-bold ml-1">{filteredCampaigns.length}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Campaign Cards */}
            {filteredCampaigns.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <div className="mx-auto h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                        <Megaphone className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">No campaigns detected</h3>
                    <p className="text-slate-500 mt-2 max-w-xs mx-auto">
                        Start by selecting a project and launching a new broadcast from the project workspace.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredCampaigns.map((campaign) => (
                        <Card key={campaign.id} className="group border-slate-200/60 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-100/50 transition-all duration-300 rounded-3xl overflow-hidden">
                            <CardContent className="p-0">
                                <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                                    {/* Left: Info & Context */}
                                    <div className="flex-1 p-6 md:p-8 space-y-6">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                            <div className="space-y-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 flex items-center gap-1.5 py-1 px-3 rounded-lg font-bold text-[10px] uppercase">
                                                        <Briefcase className="h-3 w-3" />
                                                        {getProjectName(campaign.projectId || '')}
                                                    </Badge>
                                                    <StatusBadge status={campaign.status} />
                                                </div>
                                                <h3 className="text-2xl font-bold text-slate-800 tracking-tight leading-tight">
                                                    {campaign.name}
                                                </h3>
                                                <div className="flex items-center gap-3 text-sm font-medium text-slate-400">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>Launched: {formatDate(campaign.scheduleTime || campaign.createdAt)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 group-hover:bg-white transition-colors">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                    <Users className="h-3 w-3" /> Audience
                                                </div>
                                                <div className="text-2xl font-bold text-slate-700">{campaign.totalRecipients || '0'}</div>
                                            </div>
                                            <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50 group-hover:bg-white transition-colors">
                                                <div className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                    <PlayCircle className="h-3 w-3" /> Delivered
                                                </div>
                                                <div className="text-2xl font-bold text-emerald-600">{campaign.deliveredCount || 0}</div>
                                            </div>
                                            <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100/50 group-hover:bg-white transition-colors">
                                                <div className="text-[10px] font-bold text-indigo-600/70 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                    <Clock className="h-3 w-3" /> Queued
                                                </div>
                                                <div className="text-2xl font-bold text-indigo-600">{campaign.sentCount || 0}</div>
                                            </div>
                                            <div className="bg-rose-50/30 p-4 rounded-2xl border border-rose-100/50 group-hover:bg-white transition-colors">
                                                <div className="text-[10px] font-bold text-rose-600/70 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                    <Megaphone className="h-3 w-3" /> Failed
                                                </div>
                                                <div className="text-2xl font-bold text-rose-600">{campaign.failedCount || 0}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="p-6 md:p-8 bg-slate-50/30 group-hover:bg-indigo-50/20 transition-colors flex flex-col justify-center gap-3 min-w-[220px]">
                                        <Link href={`/projects/${campaign.projectId || 'unknown'}/campaigns`} className="w-full">
                                            <Button className="w-full bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-600 hover:text-white shadow-sm font-bold rounded-xl transition-all h-11">
                                                View analytics <ChevronRight className="h-4 w-4 ml-2" />
                                            </Button>
                                        </Link>
                                        <div className="text-center">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                Project # {(campaign.projectId || 'N/A').slice(-6).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    
                    <div className="pt-4 border-t border-slate-100">
                        <Pagination
                            totalCount={totalCount}
                            pageSize={PAGE_SIZE}
                            currentPage={currentPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
