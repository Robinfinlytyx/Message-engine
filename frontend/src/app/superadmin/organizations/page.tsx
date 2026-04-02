'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from '@/components/StatusBadge';
import { 
    Search, 
    MoreVertical, 
    Building2, 
    Calendar, 
    ExternalLink, 
    ShieldCheck, 
    Filter,
    ArrowUpDown
} from 'lucide-react';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from 'sonner';

export default function OrganizationsPage() {
    const [orgs, setOrgs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);

    const fetchOrgs = async () => {
        try {
            setLoading(true);
            const { data } = await api.superadmin.getOrgs();
            setOrgs(data.data || []);
            setError(null);
        } catch (err) {
            setError('Failed to load organizations');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrgs();
    }, []);

    const filteredOrgs = orgs.filter(org => 
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getPlanBadge = (plan: string) => {
        switch (plan.toLowerCase()) {
            case 'enterprise':
                return <Badge className="bg-indigo-600/10 text-indigo-600 border-indigo-200 uppercase text-[10px] font-bold">Enterprise</Badge>;
            case 'pro':
                return <Badge className="bg-purple-600/10 text-purple-600 border-purple-200 uppercase text-[10px] font-bold">Pro</Badge>;
            default:
                return <Badge variant="outline" className="uppercase text-[10px] font-bold">Free</Badge>;
        }
    };

    if (error) return <div className="p-8 text-destructive bg-destructive/10 rounded-2xl border border-destructive/20">{error}</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground font-outfit">Tenants Management</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Monitoring all active and suspended organizations on the platform.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 border-indigo-500/20 text-indigo-600 hover:bg-indigo-500/5">
                        <Filter className="h-4 w-4" /> Filter
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20">
                        Export Report
                    </Button>
                </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Card className="bg-card/50 border-border/50 shadow-sm overflow-hidden group">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <ShieldCheck className="h-3 w-3 text-green-500" /> Active Orgs
                                </p>
                                <p className="text-3xl font-bold font-outfit">{orgs.filter(o => o.status === 'active').length}</p>
                            </div>
                            <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600">
                                <Building2 className="h-6 w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 border-border/50 shadow-sm overflow-hidden group">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Enterprise Clients</p>
                                <p className="text-3xl font-bold font-outfit">{orgs.filter(o => o.plan === 'enterprise').length}</p>
                            </div>
                            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                                <ExternalLink className="h-6 w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 border-border/50 shadow-sm overflow-hidden group">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Growth (MTD)</p>
                                <p className="text-3xl font-bold font-outfit text-indigo-600">+12%</p>
                            </div>
                            <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600">
                                <ArrowUpDown className="h-6 w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* List & Controls */}
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 bg-background/50 backdrop-blur-md p-4 rounded-xl border border-border/50 shadow-xl">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Find organization by name or slug..."
                            className="pl-9 h-10 bg-background/50 border-border/50 focus:border-indigo-500/30 transition-all font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md overflow-hidden shadow-2xl">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="border-border/50 hover:bg-transparent">
                                <TableHead className="font-bold text-xs uppercase tracking-widest text-slate-500 py-4">Organization</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-widest text-slate-500">Slug / Identifier</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-widest text-slate-500">Plan</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-widest text-slate-500">Current Status</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-widest text-slate-500">Member Since</TableHead>
                                <TableHead className="w-[60px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center">
                                        <div className="flex items-center justify-center gap-2 text-indigo-600 font-bold">
                                            <ShieldCheck className="h-4 w-4 animate-bounce" /> Loading Tenant Database...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredOrgs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground font-medium italic">
                                        No organizations found matching your search.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrgs.map((org) => (
                                    <TableRow key={org.id} className="border-border/40 hover:bg-indigo-500/[0.02] transition-colors group">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center font-bold text-indigo-600 border border-border/50 group-hover:border-indigo-500/30 group-hover:scale-105 transition-all">
                                                    {org.name.charAt(0)}
                                                </div>
                                                <span className="font-bold text-slate-900 dark:text-foreground">{org.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <code className="text-[11px] font-mono bg-muted/50 px-2 py-1 rounded text-slate-500 font-bold">
                                                /{org.slug}
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            {getPlanBadge(org.plan)}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={org.status} />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(org.createdAt)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-[180px] bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
                                                    <DropdownMenuLabel>Tenant Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-indigo-500/10 focus:text-indigo-600 transition-colors">
                                                        <ExternalLink className="h-4 w-4" /> View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-indigo-500/10 focus:text-indigo-600 transition-colors">
                                                        <Building2 className="h-4 w-4" /> View Subscriptions
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-border/50" />
                                                    <DropdownMenuItem 
                                                        className="gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive transition-colors font-bold"
                                                        onClick={() => toast.error('Status change requires Level 2 clearance (coming soon)')}
                                                    >
                                                        Suspend Organization
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
