'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Building2,
    Users,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    ShieldCheck,
    Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

const navigation = [
    { name: 'Platform Overview', href: '/superadmin/dashboard', icon: LayoutDashboard },
    { name: 'Organizations', href: '/superadmin/organizations', icon: Building2 },
    { name: 'All Users', href: '/superadmin/users', icon: Users },
    { name: 'System Logs', href: '/superadmin/logs', icon: Activity },
];

export default function SuperadminSidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const { user, logout } = useAuth();

    return (
        <motion.aside
            initial={{ width: 256 }}
            animate={{ width: collapsed ? 80 : 256 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative h-screen bg-card/50 backdrop-blur-xl border-r border-border/50 flex flex-col z-20"
        >
            {/* Toggle Button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-6 h-6 w-6 rounded-full border border-border bg-background shadow-sm hover:bg-accent z-30"
            >
                {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
            </Button>

            {/* Logo & Branding */}
            <div className={cn("p-6 flex flex-col gap-6", collapsed ? "items-center px-2" : "")}>
                <Link href="/superadmin/dashboard" className="flex items-center gap-3 group">
                    <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                        <ShieldCheck className="h-6 w-6 text-white" />
                    </div>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="whitespace-nowrap overflow-hidden"
                        >
                            <h1 className="font-bold text-xl text-foreground tracking-tight font-outfit">Platform Admin</h1>
                            <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-[0.2em] -mt-1">Super Admin Panel</p>
                        </motion.div>
                    )}
                </Link>

                {!collapsed && (
                    <div className="px-3 py-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 text-sm font-bold shrink-0 border border-indigo-500/20">
                                {user?.name?.charAt(0) || 'A'}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-bold truncate text-foreground">{user?.name || 'Admin'}</span>
                                <span className="text-[10px] text-indigo-400 font-bold tracking-wider">System Root</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden custom-scrollbar">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                                isActive
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20 font-medium"
                                    : "text-muted-foreground hover:bg-indigo-500/10 hover:text-indigo-600"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "text-white" : "text-muted-foreground group-hover:text-indigo-600")} />

                            {!collapsed && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    {item.name}
                                </motion.span>
                            )}

                            {collapsed && (
                                <div className="absolute left-full ml-4 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-border transition-opacity">
                                    {item.name}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer Actions */}
            <div className={cn("p-3 border-t border-border/50 mt-auto space-y-1", collapsed && "items-center")}>
                <Button variant="ghost" className={cn("w-full justify-start h-10 gap-3 text-muted-foreground hover:text-foreground", collapsed && "justify-center px-0")}>
                    <Settings className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>Settings</span>}
                </Button>
                <Button 
                    variant="ghost" 
                    onClick={logout}
                    className={cn("w-full justify-start h-10 gap-3 text-destructive/80 hover:text-destructive hover:bg-destructive/10", collapsed && "justify-center px-0")}
                >
                    <LogOut className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>Logout</span>}
                </Button>
            </div>
        </motion.aside>
    );
}
