'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { api, Project } from '@/lib/api';
import { 
    Check, 
    ChevronsUpDown, 
    LayoutDashboard, 
    PlusCircle,
    Building2,
    Loader2,
    Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ProjectSwitcher() {
    const [open, setOpen] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    const pathname = usePathname();

    // Extract projectId if in a project route
    const projectMatch = pathname.match(/\/projects\/([^\/]+)/);
    const activeProjectId = projectMatch ? projectMatch[1] : null;
    const isNewProject = pathname.includes('/projects/new');
    const actualActiveId = isNewProject ? null : activeProjectId;

    const activeProject = projects.find((p) => p.id === actualActiveId);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const { data: responseData } = await api.projects.list();
            setProjects(responseData.data || []);
        } catch (err) {
            console.error('Failed to load projects for switcher', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredProjects = projects.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const onSelect = (projectId: string | null) => {
        setOpen(false);
        if (projectId) {
            router.push(`/projects/${projectId}`);
        } else {
            router.push('/');
        }
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-[200px] md:w-[260px] justify-between h-10 rounded-xl bg-white border-slate-200/60 shadow-sm hover:bg-slate-50 transition-all px-3 outline-none focus:ring-0",
                        actualActiveId ? "border-indigo-100 ring-4 ring-indigo-500/5" : ""
                    )}
                >
                    <div className="flex items-center gap-2.5 truncate">
                        <div className={cn(
                            "h-5 w-5 rounded-md flex items-center justify-center shrink-0 shadow-sm",
                            actualActiveId ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                        )}>
                            {actualActiveId ? <Building2 className="h-3 w-3" /> : <LayoutDashboard className="h-3 w-3" />}
                        </div>
                        <span className="font-bold text-slate-700 text-sm truncate">
                            {activeProject ? activeProject.name : 'Global Dashboard'}
                        </span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-slate-400" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[300px] p-1.5 rounded-2xl shadow-2xl border-slate-200" align="start">
                <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Switch Context
                </DropdownMenuLabel>
                
                <DropdownMenuItem 
                    onSelect={() => onSelect(null)}
                    className={cn(
                        "flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-xl transition-all",
                        !actualActiveId ? "bg-indigo-50 text-indigo-700 font-bold" : "text-slate-600 hover:bg-slate-50"
                    )}
                >
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="flex-1">Global Organization</span>
                    {!actualActiveId && <Check className="h-4 w-4 text-indigo-600" />}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1.5 bg-slate-100" />

                <div className="px-2 py-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input 
                            className="w-full bg-slate-50 border border-slate-100 rounded-lg pl-8 pr-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                            placeholder="Find project..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>

                <div className="max-h-[240px] overflow-y-auto custom-scrollbar space-y-0.5">
                    {loading ? (
                        <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Loading Projects</span>
                        </div>
                    ) : filteredProjects.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400 italic">
                            No projects found
                        </div>
                    ) : (
                        filteredProjects.map((project) => (
                            <DropdownMenuItem
                                key={project.id}
                                onSelect={() => onSelect(project.id)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-xl transition-all",
                                    actualActiveId === project.id ? "bg-indigo-50 text-indigo-700 font-bold" : "text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                <Building2 className="h-4 w-4" />
                                <span className="flex-1 truncate">{project.name}</span>
                                {actualActiveId === project.id && <Check className="h-4 w-4 text-indigo-600" />}
                            </DropdownMenuItem>
                        ))
                    )}
                </div>

                <DropdownMenuSeparator className="my-1.5 bg-slate-100" />
                
                <Link href="/projects/new" className="block">
                    <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-xl text-indigo-600 font-bold hover:bg-indigo-50 transition-all">
                        <PlusCircle className="h-4 w-4" />
                        <span>Create New Project</span>
                    </DropdownMenuItem>
                </Link>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
