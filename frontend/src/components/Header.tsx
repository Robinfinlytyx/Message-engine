'use client';

import { useAuth } from '@/lib/auth-context';
import { 
    Bell, 
    Search, 
    CircleUser, 
    Settings, 
    LogOut,
    Menu,
    ChevronDown,
    PlusCircle,
    Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ProjectSwitcher from '@/components/ProjectSwitcher';

interface HeaderProps {
    onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
    const { user, org, logout } = useAuth();

    return (
        <header className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl z-10 px-4 md:px-8 flex items-center justify-between sticky top-0">
            {/* Left side: Context Search or Mobile Menu */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
                    <Menu className="h-5 w-5" />
                </Button>
                
                <div className="flex items-center gap-3">
                    <ProjectSwitcher />
                </div>

                <div className="hidden lg:flex relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search dashboard..." 
                        className="pl-9 h-9 bg-muted/40 border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/20"
                    />
                </div>
            </div>

            {/* Right side: Actions & Profile */}
            <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 mr-2">
                    <Link href="/projects">
                        <Button variant="outline" size="sm" className="h-8 gap-2 border-primary/20 hover:bg-primary/5 text-primary">
                            <PlusCircle className="h-3.5 w-3.5" />
                            New Project
                        </Button>
                    </Link>
                </div>

                <Button variant="ghost" size="icon" className="relative group">
                    <Bell className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full border border-border/50 p-0 overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all">
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-purple-600 text-primary-foreground font-bold text-xs">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 mt-2" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user?.name}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.email}
                                </p>
                                <Badge variant="secondary" className="w-fit mt-1 text-[10px] h-4 uppercase tracking-tighter bg-primary/10 text-primary border-none">
                                    {user?.orgRole || 'Member'}
                                </Badge>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href="/settings" className="flex items-center">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer" onClick={logout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
