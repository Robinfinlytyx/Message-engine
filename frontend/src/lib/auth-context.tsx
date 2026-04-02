'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from './api';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    email: string;
    name: string;
    orgRole?: string;
    orgId?: string;
    userType: 'user' | 'super_admin';
}

interface AuthContextType {
    user: User | null;
    org: any | null;
    loading: boolean;
    login: (tokens: any, userData: User, orgData?: any) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [org, setOrg] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const refreshUser = async () => {
        try {
            setLoading(true);
            const { data } = await api.auth.me();
            if (data.superAdmin) {
                setUser({ ...data.superAdmin, userType: 'super_admin' });
            } else {
                setUser({ ...data.user, userType: 'user' });
                setOrg(data.organization);
            }
        } catch (error) {
            setUser(null);
            setOrg(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    const login = (tokens: any, userData: User, orgData?: any) => {
        // Set cookie
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 7);
        document.cookie = `auth_token=${tokens.accessToken}; path=/; expires=${expirationDate.toUTCString()}; SameSite=Lax`;
        document.cookie = `refresh_token=${tokens.refreshToken}; path=/; expires=${expirationDate.toUTCString()}; SameSite=Lax`;
        
        setUser(userData);
        if (orgData) setOrg(orgData);
        
        if (userData.userType === 'super_admin') {
            router.push('/superadmin/dashboard');
        } else {
            router.push('/');
        }
    };

    const logout = () => {
        document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        setUser(null);
        setOrg(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, org, loading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
