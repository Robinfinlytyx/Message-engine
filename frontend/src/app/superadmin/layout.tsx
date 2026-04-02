'use client';

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import SuperadminSidebar from "@/components/SuperadminSidebar";
import { Loader2 } from "lucide-react";

export default function SuperadminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const isLoginPage = pathname === '/superadmin/login';

    useEffect(() => {
        if (!loading && !isLoginPage) {
            if (!user) {
                router.push('/superadmin/login');
            } else if (user.userType !== 'super_admin') {
                router.push('/');
            }
        }
    }, [user, loading, router, isLoginPage]);

    if (loading && !isLoginPage) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // If it's the login page, just render the children without the sidebar
    if (isLoginPage) {
        return <>{children}</>;
    }

    // Don't render dashboard content if not authorized (waiting for useEffect redirect)
    if (!user || user.userType !== 'super_admin') {
        return null;
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            <SuperadminSidebar />
            <main className="flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar p-8">
                {children}
            </main>
        </div>
    );
}
