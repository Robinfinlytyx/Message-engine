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
    Settings,
    LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <motion.aside
            initial={{ width: 256 }}
            animate={{ width: collapsed ? 80 : 256 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative h-screen bg-card border-r border-border flex flex-col z-20"
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

            {/* Logo */}
            <div className={cn("p-6 flex items-center", collapsed ? "justify-center px-2" : "gap-3")}>
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
                    <MessageSquare className="h-5 w-5 text-primary-foreground" />
                </div>
                {!collapsed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="whitespace-nowrap overflow-hidden"
                    >
                        <h1 className="font-bold text-lg text-foreground">CommEngine</h1>
                    </motion.div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto overflow-x-hidden">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group relative",
                                isActive
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />

                            {!collapsed && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    {item.name}
                                </motion.span>
                            )}

                            {/* Tooltip for collapsed state */}
                            {collapsed && (
                                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-border">
                                    {item.name}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer Actions */}
            <div className="p-3 border-t border-border mt-auto space-y-2">
                <Button variant="ghost" className={cn("w-full justify-start", collapsed && "justify-center px-0")}>
                    <Settings className="h-5 w-5 shrink-0" />
                    {!collapsed && <span className="ml-3">Settings</span>}
                </Button>
                <Button variant="ghost" className={cn("w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10", collapsed && "justify-center px-0")}>
                    <LogOut className="h-5 w-5 shrink-0" />
                    {!collapsed && <span className="ml-3">Logout</span>}
                </Button>
            </div>
        </motion.aside>
    );
}
