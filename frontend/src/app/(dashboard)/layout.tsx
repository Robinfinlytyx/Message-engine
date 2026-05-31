'use client';

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Protection logic - in a real app, you'd use middleware.tsx for faster redirects
    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <p className="text-muted-foreground font-medium animate-pulse">Initializing your workspace...</p>
                </div>
            </div>
        );
    }

    if (!user || user.userType !== 'user') {
        // Redirect will happen in AuthContext or here
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
        return null;
    }

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden font-inter">
            <Sidebar mobileOpen={sidebarOpen} setMobileOpen={setSidebarOpen} />
            
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
                
                <Header onMenuClick={() => setSidebarOpen(true)} />
                
                <main className="flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar">
                    <div className="container mx-auto p-6 md:p-8 max-w-7xl">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
