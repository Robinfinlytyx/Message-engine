'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { api, Project } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LayoutTemplate, RefreshCw, PlusCircle, ExternalLink, Copy, ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Pagination from '@/components/Pagination';
import TemplatePreviewDialog from '@/components/TemplatePreviewDialog';

const PAGE_SIZE = 10;

export default function ProjectTemplatesPage({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = use(params);
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchTemplates();
    }, [projectId, currentPage, searchQuery]);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const { data: keyRes } = await api.projects.getApiKey(projectId);
            const apiKey = keyRes.apiKey;
            if (!apiKey) throw new Error('API Key not found');

            const res = await api.getWhatsAppTemplates(projectId, apiKey, {
                limit: PAGE_SIZE,
                offset: (currentPage - 1) * PAGE_SIZE,
                search: searchQuery || undefined
            });
            setTemplates(res.data || []);
            setTotalCount(res.count || 0);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const syncTemplates = async () => {
        try {
            setSyncing(true);
            const { data: keyRes } = await api.projects.getApiKey(projectId);
            await api.syncWhatsAppTemplates(projectId, keyRes.apiKey);
            toast.success('Templates synced successfully');
            fetchTemplates();
        } catch (err) {
            toast.error('Sync failed');
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                        <LayoutTemplate className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Message Templates</h1>
                        <p className="text-sm text-slate-500">Manage communication assets for this project.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={syncTemplates} disabled={syncing} className="rounded-xl">
                        <RefreshCw className={cn("h-4 w-4 mr-2", syncing && "animate-spin")} />
                        {syncing ? 'Syncing...' : 'Sync with Meta'}
                    </Button>
                    <Link href={`/projects/${projectId}/templates/new`}>
                        <Button size="sm" className="rounded-xl">
                            <PlusCircle className="h-4 w-4 mr-2" />
                            New Template
                        </Button>
                    </Link>
                </div>
            </div>

            <Card className="border-slate-200/60 shadow-sm overflow-hidden rounded-2xl">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-slate-200/60">
                            <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Name</TableHead>
                            <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Language</TableHead>
                            <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Category</TableHead>
                            <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider text-center">Status</TableHead>
                            <TableHead className="text-right font-bold text-slate-500 text-[11px] uppercase tracking-wider">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-20 text-slate-400">Loading templates...</TableCell></TableRow>
                        ) : templates.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-20 text-slate-400">No templates synced yet.</TableCell></TableRow>
                        ) : templates.map((template) => (
                            <TableRow key={template.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                                <TableCell className="font-bold text-slate-700 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className="truncate max-w-[250px]">{template.name}</span>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(template.name);
                                                toast.success('Name copied');
                                            }}
                                            className="text-slate-300 hover:text-indigo-500 transition-colors"
                                        >
                                            <Copy className="h-3 w-3" />
                                        </button>
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium text-slate-500 text-sm">{template.language}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wide border-slate-200 text-slate-500 bg-white">
                                        {template.category}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center"><StatusBadge status={template.status} /></TableCell>
                                <TableCell className="text-right whitespace-nowrap">
                                    <TemplatePreviewDialog template={template} />
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

function Button({ children, variant, size, onClick, disabled, className }: any) {
    return (
        <button 
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
                variant === 'outline' ? "border border-slate-200 bg-white hover:bg-slate-100 text-slate-900 shadow-sm" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md",
                size === 'sm' ? "h-9 px-3 text-xs" : "h-10 px-4 py-2",
                className
            )}
        >
            {children}
        </button>
    );
}
