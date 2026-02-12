'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { api, Message, Project } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from '@/components/StatusBadge';
import {
    Search,
    Filter,
    ChevronRight,
    MessageSquare,
    ExternalLink
} from 'lucide-react';

interface GroupedMessages {
    [projectId: string]: {
        project: Project | null;
        messages: Message[];
    };
}

const statusFilters = ['All', 'QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED'];

export default function MessagesPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('All');
    const [projectFilter, setProjectFilter] = useState('All');
    const [count, setCount] = useState(0);
    const [expandedProjects, setExpandedProjects] = useState<string[]>([]);

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        fetchMessages();
    }, [statusFilter, projectFilter]);

    const fetchProjects = async () => {
        try {
            const { data } = await api.getProjects();
            setProjects(data);
            // Default expand first few projects or all if few
            if (data.length <= 3) {
                setExpandedProjects(data.map(p => p.id));
            }
        } catch (err) {
            console.error('Failed to load projects', err);
        }
    };

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const { data, count } = await api.getAdminMessages({
                status: statusFilter,
                projectId: projectFilter !== 'All' ? projectFilter : undefined,
                limit: 100
            });
            setMessages(data);
            setCount(count);
            setError(null);
        } catch (err) {
            setError('Failed to load messages');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Group messages by project
    const groupedMessages = useMemo(() => {
        const grouped: GroupedMessages = {};

        messages.forEach((message) => {
            const projectId = message.projectId || 'unknown';
            if (!grouped[projectId]) {
                const project = projects.find(p => p.id === projectId) || null;
                grouped[projectId] = {
                    project,
                    messages: []
                };
            }
            grouped[projectId].messages.push(message);
        });

        return grouped;
    }, [messages, projects]);

    if (loading && messages.length === 0) {
        return (
            <div className="space-y-4">
                <div className="h-8 w-64 bg-muted animate-pulse rounded" />
                <div className="h-12 w-full bg-muted animate-pulse rounded" />
                {[1, 2, 3].map(i => <div key={i} className="h-40 bg-muted/50 animate-pulse rounded border border-border" />)}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Message Logs</h1>
                    <p className="text-muted-foreground mt-1">View message delivery status grouped by project.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setExpandedProjects(Object.keys(groupedMessages))}>
                        Expand All
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setExpandedProjects([])}>
                        Collapse All
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-card p-4 rounded-lg border border-border shadow-sm">
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

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Filter Project:</span>
                    <select
                        value={projectFilter}
                        onChange={(e) => setProjectFilter(e.target.value)}
                        className="flex h-9 w-full md:w-[200px] items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="All">All Projects</option>
                        {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                                {project.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Error State */}
            {error && <div className="p-4 text-destructive bg-destructive/10 rounded-lg">{error}</div>}

            {/* Messages Accordion */}
            {messages.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                    <div className="mx-auto h-12 w-12 text-muted-foreground bg-muted rounded-full flex items-center justify-center mb-4">
                        <MessageSquare className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-medium">No messages found</h3>
                    <p className="text-muted-foreground mt-1">
                        Try adjusting your filters or send some messages first.
                    </p>
                </div>
            ) : (
                <Accordion
                    type="multiple"
                    value={expandedProjects}
                    onValueChange={(val) => setExpandedProjects(Array.isArray(val) ? val : [val])}
                    className="space-y-4"
                >
                    {Object.entries(groupedMessages).map(([projectId, { project, messages: projectMessages }]) => (
                        <AccordionItem key={projectId} value={projectId} className="border border-border rounded-lg bg-card px-2">
                            <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50 rounded-md">
                                <div className="flex items-center gap-4 w-full">
                                    <div className="flex items-center gap-3 text-left">
                                        <span className="font-semibold text-foreground text-lg">
                                            {project?.name || 'Unknown Project'}
                                        </span>
                                        <Badge variant="secondary" className="rounded-full px-2">
                                            {projectMessages.length}
                                        </Badge>
                                    </div>
                                    <div className="ml-auto mr-4 text-xs text-muted-foreground hidden sm:block">
                                        Last active: {new Date(projectMessages[0]?.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                                <div className="rounded-md border border-border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Recipient</TableHead>
                                                <TableHead>Template</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Channel</TableHead>
                                                <TableHead className="text-right">Sent At</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {projectMessages.map((message) => (
                                                <TableRow key={message.id}>
                                                    <TableCell className="font-mono text-xs">{message.to}</TableCell>
                                                    <TableCell>{message.templateName || '-'}</TableCell>
                                                    <TableCell>
                                                        <StatusBadge status={message.status} />
                                                    </TableCell>
                                                    <TableCell className="capitalize text-muted-foreground">{message.channel}</TableCell>
                                                    <TableCell className="text-right text-muted-foreground">
                                                        {new Date(message.createdAt).toLocaleString()}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <Link href={`/messages/${projectId}`}>
                                        <Button variant="ghost" className="text-primary hover:text-primary/80">
                                            View Full History <ExternalLink className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}

            <div className="text-center text-sm text-muted-foreground pt-4">
                Showing {messages.length} of {count} messages
            </div>
        </div>
    );
}
