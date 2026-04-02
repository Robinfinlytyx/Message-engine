'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, Project } from '@/lib/api';
import { 
    Plus, 
    Search, 
    MoreVertical, 
    Copy, 
    Terminal, 
    ExternalLink, 
    Settings,
    FolderKanban,
    Zap,
    Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger 
} from "@/components/ui/dialog";
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardFooter, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import StatusBadge from '@/components/StatusBadge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Create State
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const { data } = await api.projects.list();
            setProjects(data.data || []);
        } catch (err) {
            setError('Failed to load projects');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;

        try {
            setCreating(true);
            await api.projects.create({ name: newProjectName, description: newProjectDesc });
            toast.success('Project created successfully');
            setNewProjectName('');
            setNewProjectDesc('');
            setIsCreateDialogOpen(false);
            fetchProjects();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to create project');
        } finally {
            setCreating(false);
        }
    };

    const copyToClipboard = async (projectId: string) => {
        try {
            const { data } = await api.projects.getApiKey(projectId);
            await navigator.clipboard.writeText(data.apiKey);
            toast.success('API key copied to clipboard');
        } catch (error) {
            toast.error('Failed to copy API key');
        }
    };

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.apiKey && p.apiKey.includes(searchQuery))
    );

    if (loading && projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-24 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                <p className="text-muted-foreground font-medium animate-pulse">Loading your projects...</p>
            </div>
        );
    }

    if (error) return (
        <div className="p-12 text-center bg-destructive/5 rounded-2xl border border-destructive/10 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-destructive mb-2">Error Loading Projects</h3>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={fetchProjects} variant="outline">Try Again</Button>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold tracking-tight text-foreground font-outfit">Projects</h1>
                    <p className="text-muted-foreground font-medium">Manage your environments and API configurations.</p>
                </div>
                
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="shadow-lg shadow-primary/20 gap-2 h-11 px-6">
                            <Plus className="h-5 w-5" />
                            New Project
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Project</DialogTitle>
                            <DialogDescription>
                                Set up a new environment for your messages and campaigns.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateProject} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Project Name</label>
                                <Input
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    placeholder="e.g. Production Environment"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Description</label>
                                <Input
                                    value={newProjectDesc}
                                    onChange={(e) => setNewProjectDesc(e.target.value)}
                                    placeholder="Optional project details..."
                                />
                            </div>
                            <DialogFooter className="pt-4">
                                <Button type="submit" disabled={creating} className="w-full">
                                    {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                                    Create Project
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-4 bg-muted/30 p-2 rounded-xl border border-border/50 backdrop-blur-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Filter projects by name or key..."
                        className="pl-10 bg-background/50 border-none shadow-none h-10 ring-offset-transparent focus-visible:ring-1 focus-visible:ring-primary/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Projects Grid */}
            <AnimatePresence mode="popLayout">
                {filteredProjects.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20 border-2 border-dashed border-border/50 rounded-3xl bg-muted/10 backdrop-blur-sm"
                    >
                        <div className="mx-auto h-16 w-16 text-primary/30 bg-primary/5 rounded-2xl flex items-center justify-center mb-6">
                            <FolderKanban className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold font-outfit">No projects found</h3>
                        <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                            {searchQuery ? "Try refining your search terms." : "Build your first digital environment to get started."}
                        </p>
                        {!searchQuery && (
                            <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline" className="mt-8">
                                Create Your First Project
                            </Button>
                        )}
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredProjects.map((project, idx) => (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Card className="group border-border/50 bg-card/40 backdrop-blur-md shadow-xl hover:shadow-primary/5 transition-all flex flex-col h-full overflow-hidden">
                                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                    <FolderKanban className="h-5 w-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <CardTitle className="text-lg font-bold font-outfit leading-none">{project.name}</CardTitle>
                                                    <div className="mt-1">
                                                        <StatusBadge status={project.status} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-50 hover:opacity-100">
                                                    <MoreVertical className="h-5 w-5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>Rename Project</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">Archive Project</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </CardHeader>
                                    
                                    <CardContent className="pt-2 flex-1 space-y-6">
                                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 min-h-[40px]">
                                            {project.description || "Establish specialized communication flows for this environment."}
                                        </p>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Production API Key</label>
                                            <div className="flex items-center gap-2 bg-muted/40 p-2.5 rounded-xl border border-border/50 group-hover:border-primary/20 transition-colors">
                                                <Terminal className="h-3.5 w-3.5 text-primary opacity-70" />
                                                <code className="text-[11px] flex-1 truncate font-mono text-foreground font-medium">
                                                    {project.apiKey || "••••••••••••••••••••"}
                                                </code>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 shrink-0 hover:bg-background/80"
                                                    onClick={() => copyToClipboard(project.id)}
                                                >
                                                    <Copy className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>

                                    <CardFooter className="p-0 flex border-t border-border/50">
                                        <Link href={`/projects/${project.id}`} className="flex-1">
                                            <Button variant="ghost" className="w-full h-12 rounded-none border-r border-border/50 hover:bg-primary/5 hover:text-primary transition-colors">
                                                Overview
                                                <ExternalLink className="h-4 w-4 ml-2 opacity-50" />
                                            </Button>
                                        </Link>
                                        <Link href={`/projects/${project.id}?tab=config`} className="flex-1">
                                            <Button variant="ghost" className="w-full h-12 rounded-none hover:bg-primary/5 hover:text-primary transition-colors">
                                                Configure
                                                <Settings className="h-4 w-4 ml-2 opacity-50" />
                                            </Button>
                                        </Link>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

