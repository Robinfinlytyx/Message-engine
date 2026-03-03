'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Project, Message, Campaign } from '@/lib/api';
import ProjectConfigForm from '@/components/ProjectConfigForm';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Copy,
    Terminal,
    RefreshCw,
    Shield,
    ShieldOff,
    MessageSquare,
    Megaphone,
    Settings,
    FileText,
    LayoutDashboard,
    Loader2,
} from 'lucide-react';

type TabId = 'overview' | 'config' | 'messages' | 'campaigns';

interface Tab {
    id: TabId;
    label: string;
    icon: React.ReactNode;
}

const tabs: Tab[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'config', label: 'Configuration', icon: <Settings className="h-4 w-4" /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'campaigns', label: 'Campaigns', icon: <Megaphone className="h-4 w-4" /> },
];

export default function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = use(params);
    const router = useRouter();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [copied, setCopied] = useState(false);

    // Tab data
    const [messages, setMessages] = useState<Message[]>([]);
    const [messagesCount, setMessagesCount] = useState(0);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loadingCampaigns, setLoadingCampaigns] = useState(false);

    // Status actions
    const [toggling, setToggling] = useState(false);

    useEffect(() => {
        fetchProject();
    }, [projectId]);

    useEffect(() => {
        if (activeTab === 'messages' && messages.length === 0) fetchMessages();
        if (activeTab === 'campaigns' && campaigns.length === 0) fetchCampaigns();
    }, [activeTab]);

    const fetchProject = async () => {
        try {
            setLoading(true);
            const data = await api.getProject(projectId);
            setProject(data);
        } catch {
            setError('Failed to load project');
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        try {
            setLoadingMessages(true);
            const { data, count } = await api.getAdminMessages({ projectId, limit: 20 });
            setMessages(data);
            setMessagesCount(count);
        } catch {
            console.error('Failed to load messages');
        } finally {
            setLoadingMessages(false);
        }
    };

    const fetchCampaigns = async () => {
        try {
            setLoadingCampaigns(true);
            const { data } = await api.getAdminCampaigns({ projectId });
            setCampaigns(data);
        } catch {
            console.error('Failed to load campaigns');
        } finally {
            setLoadingCampaigns(false);
        }
    };

    const copyApiKey = async () => {
        if (!project) return;
        try {
            const { apiKey } = await api.getProjectApiKey(projectId);
            await navigator.clipboard.writeText(apiKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            alert('Failed to copy API key');
        }
    };

    const toggleStatus = async () => {
        if (!project) return;
        const newStatus = project.status === 'active' ? 'suspended' : 'active';
        try {
            setToggling(true);
            await api.updateProjectStatus(projectId, newStatus);
            setProject({ ...project, status: newStatus });
        } catch {
            alert('Failed to update project status');
        } finally {
            setToggling(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
                <div className="h-40 rounded-xl bg-card border border-border animate-pulse" />
                <div className="h-96 rounded-xl bg-card border border-border animate-pulse" />
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="space-y-4">
                <Link href="/projects">
                    <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Projects</Button>
                </Link>
                <div className="p-8 text-destructive bg-destructive/10 rounded-lg">{error || 'Project not found'}</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Back link */}
            <Link href="/projects">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground -ml-2">
                    <ArrowLeft className="h-4 w-4 mr-2" /> All Projects
                </Button>
            </Link>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">{project.name}</h1>
                            <StatusBadge status={project.status} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {project.description || 'No description'} · Created {new Date(project.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleStatus}
                        disabled={toggling}
                        className={project.status === 'active' ? 'text-destructive hover:bg-destructive/10' : 'text-emerald-600 hover:bg-emerald-50'}
                    >
                        {toggling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : project.status === 'active' ? <ShieldOff className="h-4 w-4 mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
                        {project.status === 'active' ? 'Suspend' : 'Activate'}
                    </Button>
                </div>
            </div>

            {/* API Key banner */}
            <Card>
                <CardContent className="py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <Terminal className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-xs font-medium text-muted-foreground shrink-0">API Key</span>
                            <code className="text-sm font-mono truncate text-foreground bg-muted/50 px-2 py-1 rounded">
                                {project.apiKey || 'Hidden'}
                            </code>
                        </div>
                        <Button variant="outline" size="sm" onClick={copyApiKey} className="shrink-0">
                            <Copy className="h-4 w-4 mr-2" />
                            {copied ? 'Copied!' : 'Copy Full Key'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <div className="border-b border-border">
                <nav className="flex gap-1 -mb-px">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'overview' && (
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Total Messages</CardDescription>
                                <CardTitle className="text-3xl">{messagesCount || '—'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => { setActiveTab('messages'); fetchMessages(); }}>
                                    View all →
                                </Button>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Campaigns</CardDescription>
                                <CardTitle className="text-3xl">{campaigns.length || '—'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => { setActiveTab('campaigns'); fetchCampaigns(); }}>
                                    View all →
                                </Button>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Status</CardDescription>
                                <CardTitle className="text-3xl capitalize">{project.status}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => setActiveTab('config')}>
                                    Manage config →
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'config' && (
                    <ProjectConfigForm projectId={projectId} />
                )}

                {activeTab === 'messages' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Messages</h3>
                            <Button variant="outline" size="sm" onClick={fetchMessages} disabled={loadingMessages}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${loadingMessages ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                        {loadingMessages ? (
                            <div className="space-y-2">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
                                ))}
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                                <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">No messages found for this project</p>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-border overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Recipient</th>
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Channel</th>
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Template</th>
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {messages.map((msg) => (
                                            <tr key={msg.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 font-mono text-xs">{msg.to}</td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className="text-xs capitalize">{msg.channel}</Badge>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{msg.templateName || '—'}</td>
                                                <td className="px-4 py-3"><StatusBadge status={msg.status} /></td>
                                                <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(msg.createdAt).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'campaigns' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Campaigns</h3>
                            <Button variant="outline" size="sm" onClick={fetchCampaigns} disabled={loadingCampaigns}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${loadingCampaigns ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                        {loadingCampaigns ? (
                            <div className="space-y-2">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
                                ))}
                            </div>
                        ) : campaigns.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                                <Megaphone className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">No campaigns found for this project</p>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-border overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Messages</th>
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Schedule</th>
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {campaigns.map((c) => (
                                            <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 font-medium">{c.name}</td>
                                                <td className="px-4 py-3">{c.messageCount}</td>
                                                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                                                <td className="px-4 py-3 text-muted-foreground text-xs">
                                                    {c.scheduleTime ? new Date(c.scheduleTime).toLocaleString() : 'Immediate'}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(c.createdAt).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
