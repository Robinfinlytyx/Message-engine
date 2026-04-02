'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { api, Message, Project } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from '@/components/StatusBadge';
import Pagination from '@/components/Pagination';
import {
    MessageCircle,
    Filter,
    ChevronRight,
    MessageSquare,
    ExternalLink,
    Search,
    RefreshCw,
    FileText
} from 'lucide-react';

interface GroupedMessages {
    [projectId: string]: {
        project: Project | null;
        messages: Message[];
        stats: {
            total: number;
            sent: number;
            failed: number;
            queued: number;
        }
    };
}

const statusFilters = ['All', 'QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED'];
const PAGE_SIZE = 20;

export default function MessagesPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('All');
    const [projectFilter, setProjectFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        fetchMessages();
    }, [statusFilter, projectFilter, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, projectFilter]);

    const fetchProjects = async () => {
        try {
            const { data: responseData } = await api.projects.list();
            setProjects(responseData.data || []);
        } catch (err) {
            console.error('Failed to load projects', err);
        }
    };

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const { data: responseData } = await api.admin.getMessages({
                status: statusFilter === 'All' ? undefined : statusFilter,
                projectId: projectFilter !== 'All' ? projectFilter : undefined,
                limit: PAGE_SIZE,
                offset: (currentPage - 1) * PAGE_SIZE
            });
            setMessages(responseData.data || []);
            setTotalCount(responseData.count || 0);
            setError(null);
        } catch (err) {
            setError('Failed to load messages');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const groupedMessages = useMemo(() => {
        const grouped: GroupedMessages = {};

        messages.forEach((message) => {
            const projectId = message.projectId || 'unknown';
            if (!grouped[projectId]) {
                const project = projects.find(p => p.id === projectId) || null;
                grouped[projectId] = {
                    project,
                    messages: [],
                    stats: { total: 0, sent: 0, failed: 0, queued: 0 }
                };
            }
            grouped[projectId].messages.push(message);
            grouped[projectId].stats.total++;
            if (message.status === 'SENT' || message.status === 'DELIVERED' || message.status === 'READ') grouped[projectId].stats.sent++;
            if (message.status === 'FAILED') grouped[projectId].stats.failed++;
            if (message.status === 'QUEUED' || message.status === 'PENDING') grouped[projectId].stats.queued++;
        });

        return grouped;
    }, [messages, projects]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
                        <MessageCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Communication Logs</h1>
                        <p className="text-sm text-slate-500">Real-time message history across all integrated projects.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchMessages} disabled={loading} className="rounded-xl">
                        <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                        Refresh Logs
                    </Button>
                </div>
            </div>

            {/* Premium Filtering Toolbar */}
            <Card className="border-slate-200/60 shadow-sm overflow-hidden rounded-2xl">
                <CardContent className="p-4 bg-white">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mr-2">Delivery Status</span>
                            {statusFilters.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-semibold rounded-full transition-all",
                                        statusFilter === s 
                                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" 
                                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                    )}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 w-full lg:w-auto border-t lg:border-t-0 pt-3 lg:pt-0">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider whitespace-nowrap">Filter by Project</span>
                            <select
                                value={projectFilter}
                                onChange={(e) => setProjectFilter(e.target.value)}
                                className="h-9 w-full lg:min-w-[200px] rounded-xl border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 outline-none transition-all"
                            >
                                <option value="All">All Active Projects</option>
                                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Content Area */}
            {messages.length === 0 && !loading ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <div className="mx-auto h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                        <MessageSquare className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Silence in the logs</h3>
                    <p className="text-slate-500 mt-2 max-w-xs mx-auto">
                        No messages matched your current filters. Try selecting a different project or status.
                    </p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(groupedMessages).map(([projectId, { project, messages: projectMessages, stats }]) => (
                        <div key={projectId} className="space-y-4">
                            {/* Project Section Header */}
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                                        <FileText className="h-4 w-4 text-slate-600" />
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-700">{project?.name || 'Unknown Project'}</h2>
                                    <div className="flex items-center gap-4 ml-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{stats.sent} Delivered</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{stats.failed} Failed</span>
                                        </div>
                                    </div>
                                </div>
                                <Link href={`/projects/${projectId}/messages`}>
                                    <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-semibold group rounded-xl">
                                        Project Workspace <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </Link>
                            </div>

                            {/* Messages Table Card */}
                            <Card className="border-slate-200/60 shadow-sm overflow-hidden rounded-2xl">
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow className="hover:bg-transparent border-slate-200/60">
                                            <TableHead className="w-[180px] font-bold text-slate-500 text-[11px] uppercase tracking-wider">Recipient</TableHead>
                                            <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Template Path</TableHead>
                                            <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Delivery</TableHead>
                                            <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Channel</TableHead>
                                            <TableHead className="text-right font-bold text-slate-500 text-[11px] uppercase tracking-wider">Timestamp</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {projectMessages.map((message) => (
                                            <TableRow key={message.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="font-mono text-[11px] font-semibold text-slate-600 tracking-tighter">
                                                    {message.to}
                                                </TableCell>
                                                <TableCell className="font-medium text-slate-700">
                                                    {message.templateName || <span className="text-slate-300">—</span>}
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge status={message.status} />
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wide border-slate-200 text-slate-500 bg-white">
                                                        {message.channel}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right text-[11px] font-semibold text-slate-400">
                                                    {new Date(message.createdAt).toLocaleString(undefined, {
                                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Card>
                        </div>
                    ))}
                    <Pagination
                        totalCount={totalCount}
                        pageSize={PAGE_SIZE}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                        className="bg-slate-50/30 border-t border-slate-100"
                    />
                </div>
            )}
        </div>
    );
}
