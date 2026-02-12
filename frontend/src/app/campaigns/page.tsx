'use client';

import { useState, useEffect } from 'react';
import { api, Campaign } from '@/lib/api';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from '@/components/StatusBadge';
import { Search, Plus, Calendar, Megaphone, Users, Clock, PlayCircle } from 'lucide-react';

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            setLoading(true);
            const { data } = await api.getAdminCampaigns();
            setCampaigns(data);
        } catch (err) {
            setError('Failed to load campaigns');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Not scheduled';
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredCampaigns = campaigns.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && campaigns.length === 0) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between">
                    <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                    <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-48 bg-muted animate-pulse rounded-xl border border-border" />)}
                </div>
            </div>
        );
    }

    if (error) return <div className="p-4 text-destructive bg-destructive/10 rounded-lg">{error}</div>;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Campaigns</h1>
                    <p className="text-muted-foreground mt-1">Manage and track your marketing campaigns.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> New Campaign
                </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search campaigns..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Content */}
            {filteredCampaigns.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                    <div className="mx-auto h-12 w-12 text-muted-foreground bg-muted rounded-full flex items-center justify-center mb-4">
                        <Megaphone className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-medium">No campaigns found</h3>
                    <p className="text-muted-foreground mt-1">
                        {searchQuery ? "Try adjusting your search terms." : "Create a campaign to engage with your users."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredCampaigns.map((campaign) => (
                        <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex flex-col lg:flex-row gap-6">
                                    {/* Left: Info */}
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                                                    {campaign.name}
                                                </h3>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>Scheduled: {formatDate(campaign.scheduleTime || campaign.createdAt)}</span>
                                                </div>
                                            </div>
                                            <StatusBadge status={campaign.status} />
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                                            <div className="bg-muted/30 p-3 rounded-lg border border-border">
                                                <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                                    <Users className="h-3 w-3" /> Audience
                                                </div>
                                                <div className="font-semibold text-lg">{campaign.totalRecipients || '-'}</div>
                                            </div>
                                            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                                                <div className="text-xs text-green-700 flex items-center gap-1 mb-1">
                                                    <PlayCircle className="h-3 w-3" /> Sent
                                                </div>
                                                <div className="font-semibold text-lg text-green-700">{campaign.sentCount || 0}</div>
                                            </div>
                                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                                <div className="text-xs text-blue-700 flex items-center gap-1 mb-1">
                                                    <Clock className="h-3 w-3" /> Delivered
                                                </div>
                                                <div className="font-semibold text-lg text-blue-700">{campaign.deliveredCount || 0}</div>
                                            </div>
                                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                                                <div className="text-xs text-orange-700 flex items-center gap-1 mb-1">
                                                    <PlayCircle className="h-3 w-3" /> Failed
                                                </div>
                                                <div className="font-semibold text-lg text-orange-700">{campaign.failedCount || 0}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex flex-col justify-center sm:items-end gap-2 border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-6 min-w-[150px]">
                                        <Button variant="outline" className="w-full justify-start sm:justify-center">
                                            View Report
                                        </Button>
                                        <Button variant="ghost" className="w-full justify-start sm:justify-center text-muted-foreground">
                                            Edit Campaign
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
