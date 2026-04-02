'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    FolderKanban,
    MessageSquare,
    Megaphone,
    ChevronLeft,
    ChevronRight,
    FileText,
    Settings,
    LayoutTemplate,
    Globe,
    Zap,
    Users2,
    Shield,
    LogOut,
    ChevronsUpDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

const globalNavigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
    { name: 'Team', href: '/team', icon: Users2, roles: ['owner', 'admin'] },
];

const getProjectNavigation = (projectId: string) => [
    { name: 'Overview', href: `/projects/${projectId}`, icon: LayoutDashboard },
    { name: 'Messages', href: `/projects/${projectId}/messages`, icon: MessageSquare },
    { name: 'Templates', href: `/projects/${projectId}/templates`, icon: LayoutTemplate },
    { name: 'Campaigns', href: `/projects/${projectId}/campaigns`, icon: Megaphone },
    { name: 'Settings', href: `/projects/${projectId}/config`, icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const { user, org, logout } = useAuth();

    // Context Detection
    const projectMatch = pathname.match(/\/projects\/([^\/]+)/);
    const activeProjectId = projectMatch ? projectMatch[1] : null;
    const isInsideProject = activeProjectId && !pathname.includes('/projects/new');

    const activeNav = isInsideProject 
        ? getProjectNavigation(activeProjectId!) 
        : globalNavigation.filter(item => !item.roles || (user?.orgRole && item.roles.includes(user.orgRole)));

    return (
        <motion.aside
            initial={{ width: 256 }}
            animate={{ width: collapsed ? 80 : 256 }}
            className="hidden md:flex flex-col border-r border-slate-200/60 bg-white shadow-[1px_0_10px_rgba(0,0,0,0.02)] h-screen sticky top-0 z-30"
        >
            {/* Logo area */}
            <div className="h-16 flex items-center px-6 border-b border-slate-50">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                        <Zap className="h-5 w-5 text-white fill-white" />
                    </div>
                    {!collapsed && (
                        <span className="font-black text-xl tracking-tighter text-slate-800">
                            Comm<span className="text-indigo-600">Engine</span>
                        </span>
                    )}
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto overflow-x-hidden custom-scrollbar">
                {!collapsed && (
                    <div className="px-3 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            {isInsideProject ? 'Project Context' : 'Organization'}
                        </span>
                    </div>
                )}
                
                {activeNav.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href) && !isInsideProject);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                                isActive
                                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 font-bold"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-500")} />

                            {!collapsed && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    {item.name}
                                </motion.span>
                            )}

                            {collapsed && (
                                <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-[10px] rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-slate-700 transition-opacity font-bold">
                                    {item.name}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Account & Meta */}
            <div className="p-4 border-t border-slate-50 bg-slate-50/30">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white hover:text-slate-600 hover:shadow-sm transition-all text-xs font-bold uppercase tracking-wider"
                >
                    <ChevronsUpDown className="h-4 w-4 rotate-90" />
                    {!collapsed && <span>Collapse</span>}
                </button>
            </div>
        </motion.aside>
    );
}
