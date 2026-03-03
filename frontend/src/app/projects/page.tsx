'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, Project } from '@/lib/api';
import { Plus, Search, MoreVertical, Copy, Terminal, ExternalLink, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatusBadge from '@/components/StatusBadge';
import { toast } from 'sonner'; // Assuming sonner or similar, or I'll just use alert/custom toast for now. 
// Actually I don't have sonner installed. I'll use simple alert or just console for now, or install sonner later.
// Let's stick to basic alert or a simple visual feedback.

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const { data } = await api.getProjects();
            setProjects(data);
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
            await api.createProject(newProjectName, newProjectDesc);
            setNewProjectName('');
            setNewProjectDesc('');
            setIsCreateModalOpen(false);
            fetchProjects(); // Refresh list
        } catch (err) {
            alert('Failed to create project');
            console.error(err);
        } finally {
            setCreating(false);
        }
    };

    const copyToClipboard = async (projectId: string) => {
        try {
            const { apiKey } = await api.getProjectApiKey(projectId);
            await navigator.clipboard.writeText(apiKey);
            // Success feedback - could add toast here
            console.log('API key copied successfully');
        } catch (error) {
            console.error('Failed to copy API key', error);
            alert('Failed to copy API key');
        }
    };

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.apiKey && p.apiKey.includes(searchQuery))
    );

    if (loading && projects.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">Loading projects...</div>;
    }

    if (error) return <div className="p-8 text-destructive bg-destructive/10 rounded-lg">{error}</div>;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Projects</h1>
                    <p className="text-muted-foreground mt-1">Manage your API projects and keys.</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" /> New Project
                </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search projects..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Projects Grid */}
            {filteredProjects.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                    <div className="mx-auto h-12 w-12 text-muted-foreground bg-muted rounded-full flex items-center justify-center mb-4">
                        <FolderKanbanIcon />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">No projects found</h3>
                    <p className="text-muted-foreground mt-1 mb-4">
                        {searchQuery ? "No projects match your search." : "Get started by creating your first project."}
                    </p>
                    {!searchQuery && (
                        <Button onClick={() => setIsCreateModalOpen(true)}>Create Project</Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <Card key={project.id} className="group hover:border-primary/50 transition-colors flex flex-col">
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-base font-semibold">{project.name}</CardTitle>
                                        <StatusBadge status={project.status} />
                                    </div>
                                    <CardDescription className="line-clamp-2 min-h-[40px]">
                                        {project.description || "No description provided."}
                                    </CardDescription>
                                </div>
                                <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8 text-muted-foreground">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="pt-4 flex-1">
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">API Key</label>
                                        <div className="flex items-center gap-2 bg-muted/50 p-2 rounded border border-border group-hover:border-primary/20 transition-colors">
                                            <Terminal className="h-3 w-3 text-muted-foreground" />
                                            <code className="text-xs flex-1 truncate font-mono text-foreground">
                                                {project.apiKey || "No API Key"}
                                            </code>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 shrink-0"
                                                onClick={() => copyToClipboard(project.id)}
                                            >
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground pt-2 flex items-center gap-2">
                                        <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-2 border-t border-border bg-muted/20 flex flex-col gap-2">
                                <Link href={`/projects/${project.id}`} className="w-full">
                                    <Button variant="ghost" className="w-full justify-between group-hover:text-primary">
                                        Open Project
                                        <ExternalLink className="h-4 w-4 ml-2" />
                                    </Button>
                                </Link>
                                <Link href={`/projects/${project.id}?tab=config`} className="w-full">
                                    <Button variant="outline" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground border-primary/50 border-dashed hover:border-solid">
                                        Configure Credentials
                                        <Settings className="h-4 w-4 ml-2" />
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Project Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New Project"
                description="Create a new API project to start sending messages."
            >
                <form onSubmit={handleCreateProject} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Project Name
                        </label>
                        <Input
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="My Awesome App"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Description
                        </label>
                        <Input
                            value={newProjectDesc}
                            onChange={(e) => setNewProjectDesc(e.target.value)}
                            placeholder="What is this project for?"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={creating} className="min-w-[100px]">
                            {creating ? 'Creating...' : 'Create Project'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

function FolderKanbanIcon() {
    return (
        <svg
            className="w-6 h-6"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
    )
}
