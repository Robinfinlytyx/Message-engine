'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import { api, Message, Project, EmailMessage, EmailBatch } from '@/lib/api';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';

const statusFilters = ['All', 'QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED'];
const PAGE_SIZE = 20;

type TabType = 'whatsapp' | 'emails' | 'batches';

export default function ProjectMessagesPage() {
    const params = useParams();
    const projectId = params.projectId as string;

    const [project, setProject] = useState<Project | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [emails, setEmails] = useState<EmailMessage[]>([]);
    const [batches, setBatches] = useState<EmailBatch[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('All');
    const [activeTab, setActiveTab] = useState<TabType>('whatsapp');

    const [count, setCount] = useState(0);
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchProject();
    }, [projectId]);

    useEffect(() => {
        if (project) {
            fetchData();
        }
    }, [projectId, statusFilter, page, activeTab, project]);

    const fetchProject = async () => {
        try {
            const { data: responseData } = await api.projects.list();
            const projectList = responseData.data || [];
            const found = projectList.find((p: Project) => p.id === projectId);
            setProject(found || null);
        } catch (err) {
            console.error('Failed to load project', err);
            setError('Failed to load project details');
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const offset = (page - 1) * PAGE_SIZE;

            if (activeTab === 'whatsapp') {
                const { data: responseData } = await api.admin.getMessages({
                    projectId,
                    status: statusFilter === 'All' ? undefined : statusFilter,
                    limit: PAGE_SIZE,
                    offset
                });
                setMessages(responseData.data || []);
                setCount(responseData.count || 0);
            } else if (activeTab === 'emails') {
                if (!project?.apiKey) {
                    setError('API Key not found for this project. Cannot fetch emails.');
                    return;
                }
                const { data, count } = await api.getProjectEmails(projectId, project.apiKey, {
                    status: statusFilter,
                    limit: PAGE_SIZE,
                    offset
                });
                setEmails(data);
                setCount(count);
            } else if (activeTab === 'batches') {
                if (!project?.apiKey) {
                    setError('API Key not found for this project. Cannot fetch batches.');
                    return;
                }
                const { data, count } = await api.getProjectBatches(projectId, project.apiKey, {
                    limit: PAGE_SIZE,
                    offset
                });
                setBatches(data);
                setCount(count);
            }
            setError(null);
        } catch (err) {
            setError('Failed to load data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(count / PAGE_SIZE);

    const handlePrevPage = () => {
        if (page > 1) setPage(page - 1);
    };

    const handleNextPage = () => {
        if (page < totalPages) setPage(page + 1);
    };

    // Reset page when filter or tab changes
    useEffect(() => {
        setPage(1);
    }, [statusFilter, activeTab]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Button variant="ghost" asChild className="mb-4 pl-0 hover:pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground">
                    <Link href="/messages" className="flex items-center gap-2">
                        <ChevronLeft className="h-4 w-4" /> Back to All Messages
                    </Link>
                </Button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            {project?.name || 'Project Messages'}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Detailed delivery logs for {project?.name}
                        </p>
                    </div>
                    {project?.status && <StatusBadge status={project.status} />}
                </div>
            </div>

            {/* Custom Tabs */}
            <div className="flex space-x-2 border-b border-border">
                <Button
                    variant={activeTab === 'whatsapp' ? 'secondary' : 'ghost'}
                    onClick={() => setActiveTab('whatsapp')}
                    className="rounded-b-none"
                >
                    WhatsApp
                </Button>
                <Button
                    variant={activeTab === 'emails' ? 'secondary' : 'ghost'}
                    onClick={() => setActiveTab('emails')}
                    className="rounded-b-none"
                >
                    Emails
                </Button>
                <Button
                    variant={activeTab === 'batches' ? 'secondary' : 'ghost'}
                    onClick={() => setActiveTab('batches')}
                    className="rounded-b-none"
                >
                    Email Batches
                </Button>
            </div>

            {/* Content */}
            <Card className="border-t-0 rounded-tl-none">
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <CardTitle>
                                {activeTab === 'whatsapp' && 'WhatsApp Messages'}
                                {activeTab === 'emails' && 'Email Logs'}
                                {activeTab === 'batches' && 'Bulk Email Batches'}
                            </CardTitle>
                            <Button variant="ghost" size="icon" onClick={fetchData} className="h-8 w-8">
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>

                        {activeTab !== 'batches' && (
                            <div className="flex flex-wrap gap-2">
                                {statusFilters.map((status) => (
                                    <Badge
                                        key={status}
                                        variant={statusFilter === status ? "default" : "outline"}
                                        className="cursor-pointer hover:bg-primary/20"
                                        onClick={() => setStatusFilter(status)}
                                    >
                                        {status}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {loading && count === 0 ? (
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-12 w-full bg-muted animate-pulse rounded" />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="text-destructive bg-destructive/10 p-4 rounded">{error}</div>
                    ) : (
                        <>
                            <div className="rounded-md border border-border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {activeTab === 'batches' ? (
                                                <>
                                                    <TableHead>Batch Name</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Progress</TableHead>
                                                    <TableHead>Processed</TableHead>
                                                    <TableHead>Failed</TableHead>
                                                    <TableHead className="text-right">Created At</TableHead>
                                                </>
                                            ) : activeTab === 'emails' ? (
                                                <>
                                                    <TableHead>Recipient</TableHead>
                                                    <TableHead>Subject</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Batch ID</TableHead>
                                                    <TableHead className="text-right">Sent At</TableHead>
                                                </>
                                            ) : (
                                                <>
                                                    <TableHead>Recipient</TableHead>
                                                    <TableHead>Template</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Channel</TableHead>
                                                    <TableHead className="text-right">Sent At</TableHead>
                                                </>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {activeTab === 'whatsapp' && messages.length === 0 && (
                                            <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No WhatsApp messages found.</TableCell></TableRow>
                                        )}
                                        {activeTab === 'emails' && emails.length === 0 && (
                                            <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No emails found.</TableCell></TableRow>
                                        )}
                                        {activeTab === 'batches' && batches.length === 0 && (
                                            <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No batches found.</TableCell></TableRow>
                                        )}

                                        {activeTab === 'whatsapp' && messages.map((message) => (
                                            <TableRow key={message.id}>
                                                <TableCell className="font-mono text-xs">{message.to}</TableCell>
                                                <TableCell>{message.templateName || '-'}</TableCell>
                                                <TableCell><StatusBadge status={message.status} /></TableCell>
                                                <TableCell className="capitalize text-muted-foreground">{message.channel}</TableCell>
                                                <TableCell className="text-right text-muted-foreground">{new Date(message.createdAt).toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}

                                        {activeTab === 'emails' && emails.map((email) => (
                                            <TableRow key={email.id}>
                                                <TableCell className="font-mono text-xs">{email.to}</TableCell>
                                                <TableCell className="max-w-[200px] truncate">{email.subject}</TableCell>
                                                <TableCell><StatusBadge status={email.status} /></TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground">{email.batchId ? email.batchId.slice(0, 8) + '...' : '-'}</TableCell>
                                                <TableCell className="text-right text-muted-foreground">{new Date(email.createdAt).toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}

                                        {activeTab === 'batches' && batches.map((batch) => (
                                            <TableRow key={batch.id}>
                                                <TableCell className="font-medium">{batch.name}</TableCell>
                                                <TableCell><StatusBadge status={batch.status} /></TableCell>
                                                <TableCell>
                                                    <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary"
                                                            style={{ width: `${Math.round((batch.processedCount / batch.totalEmails) * 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-muted-foreground mt-1 block">
                                                        {Math.round((batch.processedCount / batch.totalEmails) * 100)}%
                                                    </span>
                                                </TableCell>
                                                <TableCell>{batch.processedCount} / {batch.totalEmails}</TableCell>
                                                <TableCell>{batch.failedCount > 0 ? <span className="text-destructive font-medium">{batch.failedCount}</span> : '0'}</TableCell>
                                                <TableCell className="text-right text-muted-foreground">{new Date(batch.createdAt).toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Showing {count > 0 ? ((page - 1) * PAGE_SIZE + 1) : 0} - {Math.min(page * PAGE_SIZE, count)} of {count}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handlePrevPage}
                                        disabled={page <= 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </Button>
                                    <span className="text-sm font-medium min-w-[3rem] text-center">
                                        {page} / {totalPages || 1}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleNextPage}
                                        disabled={page >= totalPages}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
