'use client';

import { use } from 'react';
import { api, Message, Project } from '@/lib/api';
import { useState, useEffect } from 'react';
import StatusBadge from '@/components/StatusBadge';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MessageSquare, Search, RefreshCw, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import Pagination from '@/components/Pagination';

const PAGE_SIZE = 20;

export default function ProjectMessagesPage({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = use(params);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [statusFilter, setStatusFilter] = useState('All');

    useEffect(() => {
        fetchMessages();
    }, [projectId, statusFilter, currentPage]);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const { data: responseData } = await api.admin.getMessages({
                projectId,
                status: statusFilter === 'All' ? undefined : statusFilter,
                limit: PAGE_SIZE,
                offset: (currentPage - 1) * PAGE_SIZE
            });
            setMessages(responseData.data || []);
            setTotalCount(responseData.count || 0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const statusFilters = ['All', 'QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED'];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Project Messages</h1>
                        <p className="text-sm text-slate-500">Full communication history for this project.</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={fetchMessages} disabled={loading} className="rounded-xl">
                    <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                    Refresh
                </Button>
            </div>

            <Card className="border-slate-200/60 shadow-sm overflow-hidden rounded-2xl">
                <CardContent className="p-4 bg-white flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mr-2">Filter Status</span>
                    {statusFilters.map((s) => (
                        <button
                            key={s}
                            onClick={() => {
                                setStatusFilter(s);
                                setCurrentPage(1);
                            }}
                            className={cn(
                                "px-3 py-1.5 text-xs font-semibold rounded-full transition-all",
                                statusFilter === s 
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" 
                                    : "text-slate-500 hover:bg-slate-100"
                            )}
                        >
                            {s}
                        </button>
                    ))}
                </CardContent>
            </Card>

            <Card className="border-slate-200/60 shadow-sm overflow-hidden rounded-2xl mt-6">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-slate-200/60">
                            <TableHead className="w-[180px] font-bold text-slate-500 text-[11px] uppercase tracking-wider">Recipient</TableHead>
                            <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Template</TableHead>
                            <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Status</TableHead>
                            <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Channel</TableHead>
                            <TableHead className="text-right font-bold text-slate-500 text-[11px] uppercase tracking-wider">Timestamp</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-20 text-slate-400">Loading history...</TableCell></TableRow>
                        ) : messages.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-20 text-slate-400">No messages found for this project.</TableCell></TableRow>
                        ) : messages.map((message) => (
                            <TableRow key={message.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                                <TableCell className="font-mono text-xs font-semibold text-slate-600">{message.to}</TableCell>
                                <TableCell className="font-medium text-slate-700">{message.templateName || '—'}</TableCell>
                                <TableCell><StatusBadge status={message.status} /></TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wide border-slate-200 text-slate-500 bg-white">
                                        {message.channel}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right text-[11px] font-semibold text-slate-400">
                                    {new Date(message.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            <Pagination
                totalCount={totalCount}
                pageSize={PAGE_SIZE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
            />
        </div>
    );
}

// Internal Button component since I can't import easily while writing multiple blocks
function Button({ children, variant, size, onClick, disabled, className }: any) {
    return (
        <button 
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
                variant === 'outline' ? "border border-slate-200 bg-white hover:bg-slate-100 text-slate-900" : "bg-indigo-600 text-white hover:bg-indigo-700",
                size === 'sm' ? "h-9 px-3 text-xs" : "h-10 px-4 py-2",
                className
            )}
        >
            {children}
        </button>
    );
}
