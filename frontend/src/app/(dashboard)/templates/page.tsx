'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { api, Project } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from '@/components/StatusBadge';
import { Globe, RefreshCw, LayoutTemplate, Search, Copy, ExternalLink, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import Pagination from '@/components/Pagination';
import TemplatePreviewDialog from '@/components/TemplatePreviewDialog';

const PAGE_SIZE = 10;

interface ProjectTemplates {
    project: Project;
    templates: any[];
}

export default function GlobalTemplatesPage() {
    const [projectTemplates, setProjectTemplates] = useState<ProjectTemplates[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        fetchAllTemplates();
    }, []);

    const fetchAllTemplates = async () => {
        setLoading(true);
        try {
            // 1. Get all projects
            const { data: projRes } = await api.projects.list();
            const projects: Project[] = projRes.data || [];

            // 2. For each project, fetch its templates
            const templatePromises = projects.map(async (project) => {
                try {
                    // We need the raw API key to fetch templates
                    const { data: keyRes } = await api.projects.getApiKey(project.id);
                    const apiKey = keyRes.apiKey;
                    
                    if (!apiKey) return null;

                    const templateRes = await api.getWhatsAppTemplates(project.id, apiKey);
                    return {
                        project,
                        templates: templateRes.data || []
                    };
                } catch (err) {
                    console.error(`Failed to fetch templates for project ${project.id}`, err);
                    return null;
                }
            });

            const results = await Promise.all(templatePromises);
            setProjectTemplates(results.filter((r): r is ProjectTemplates => r !== null));
        } catch (err) {
            console.error('Failed to load global templates', err);
            toast.error('Failed to aggregate templates across projects');
        } finally {
            setLoading(false);
        }
    };

    const filteredProjects = useMemo(() => {
        if (!searchQuery) return projectTemplates;
        const query = searchQuery.toLowerCase();
        
        return projectTemplates.map(pt => ({
            ...pt,
            templates: pt.templates.filter(t => 
                t.name.toLowerCase().includes(query) || 
                t.category.toLowerCase().includes(query)
            )
        })).filter(pt => pt.templates.length > 0 || pt.project.name.toLowerCase().includes(query));
    }, [projectTemplates, searchQuery]);

    const totalTemplates = useMemo(() => 
        projectTemplates.reduce((acc, pt) => acc + pt.templates.length, 0), 
    [projectTemplates]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
                        <LayoutTemplate className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Template Catalog</h1>
                        <p className="text-sm text-slate-500">Centrally view and manage all WhatsApp templates across your organization.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchAllTemplates} disabled={loading} className="rounded-xl">
                        <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                        Refresh Catalog
                    </Button>
                </div>
            </div>

            {/* Filtering */}
            <Card className="border-slate-200/60 shadow-sm overflow-hidden rounded-2xl">
                <CardContent className="p-4 bg-white flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by name or category..."
                            className="pl-10 h-10 rounded-xl border-slate-200 bg-slate-50/30 focus:bg-white transition-all outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="text-xs text-slate-500 font-medium px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                            Total Templates: <span className="text-indigo-600 font-bold ml-1">{totalTemplates}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                            Projects: <span className="text-indigo-600 font-bold ml-1">{projectTemplates.length}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {loading && projectTemplates.length === 0 ? (
                <div className="grid gap-6">
                    {[1, 2].map(i => <div key={i} className="h-64 bg-muted animate-pulse rounded-2xl border border-slate-100" />)}
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <div className="mx-auto h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                        <LayoutTemplate className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">No templates found</h3>
                    <p className="text-slate-500 mt-2 max-w-xs mx-auto">
                        Make sure you have projects configured with correct WhatsApp credentials to sync templates.
                    </p>
                </div>
            ) : (
                <div className="space-y-10">
                    {filteredProjects.map((pt) => (
                        <div key={pt.project.id} className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                                        <Globe className="h-4 w-4 text-slate-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-700 leading-none">{pt.project.name}</h2>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Active Project</span>
                                    </div>
                                    <Badge variant="secondary" className="ml-2 bg-indigo-50 text-indigo-700 border-indigo-100 rounded-full px-2 py-0">
                                        {pt.templates.length} Assets
                                    </Badge>
                                </div>
                                <Link href={`/projects/${pt.project.id}/templates`}>
                                    <Button variant="ghost" size="sm" className="text-indigo-600 font-semibold hover:bg-indigo-50 rounded-xl group">
                                        Project Console <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </Link>
                            </div>

                            <Card className="border-slate-200/60 shadow-sm overflow-hidden rounded-2xl">
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow className="hover:bg-transparent border-slate-200/60">
                                            <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Template Name</TableHead>
                                            <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Category</TableHead>
                                            <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Language</TableHead>
                                            <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider text-center">Status</TableHead>
                                            <TableHead className="text-right font-bold text-slate-500 text-[11px] uppercase tracking-wider">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pt.templates.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-slate-400 italic text-sm">
                                                    No templates synced for this project yet.
                                                </TableCell>
                                            </TableRow>
                                        ) : pt.templates.map((template) => (
                                            <TableRow key={template.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="font-bold text-slate-700 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="truncate max-w-[250px]">{template.name}</span>
                                                        <button 
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(template.name);
                                                                toast.success('Template name copied');
                                                            }}
                                                            className="text-slate-300 hover:text-indigo-500 transition-colors"
                                                        >
                                                            <Copy className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wide border-slate-200 text-slate-500 bg-white">
                                                        {template.category}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-medium text-slate-500 text-sm">
                                                    {template.language}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <StatusBadge status={template.status} />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <TemplatePreviewDialog template={template} />
                                                        <Link href={`/projects/${pt.project.id}/templates`}>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                                                                <ExternalLink className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Card>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
