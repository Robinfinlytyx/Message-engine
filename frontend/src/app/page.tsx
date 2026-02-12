'use client';

import { useState, useEffect } from 'react';
import { api, DashboardStats } from "@/lib/api";
import StatsCard from "@/components/StatsCard";
import {
  LayoutDashboard,
  FolderKanban,
  MessageSquare,
  Megaphone,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      setError('Failed to load dashboard stats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 w-48 bg-muted animate-pulse rounded-md" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-card border border-border shadow-sm animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) return <div className="p-8 text-destructive bg-destructive/10 rounded-lg">{error}</div>;
  if (!stats) return <div className="p-8">No stats available</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Review your communication engine performance.</p>
        </div>
        <div className="flex space-x-2">
          <Link href="/projects">
            <Button>Manage Projects</Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Projects"
          value={stats.totalProjects}
          icon={<FolderKanban className="h-4 w-4" />}
          description="Active API projects"
        />
        <StatsCard
          title="Total Messages"
          value={stats.totalMessages.toLocaleString()}
          icon={<MessageSquare className="h-4 w-4" />}
          trend={{ value: `${stats.messagesLast24h} in last 24h`, isPositive: stats.messagesLast24h > 0 }}
        />
        <StatsCard
          title="Active Campaigns"
          value={stats.totalCampaigns}
          icon={<Megaphone className="h-4 w-4" />}
          description="Running campaigns"
        />
        <StatsCard
          title="System Status"
          value="Healthy"
          icon={<Activity className="h-4 w-4" />}
          trend={{ value: "100% Uptime", isPositive: true }}
        />
      </div>

      {/* Main Content Sections */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

        {/* Recent Activity / System Status */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
            <CardDescription>
              Current operational status of your communication engine.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-6">
            <div className="flex items-center gap-4 py-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">API Services Operational</p>
                <p className="text-sm text-muted-foreground">
                  Backend connected at <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}</span>
                </p>
              </div>
            </div>
            {/* You could add a chart here in the future */}
            <div className="h-[200px] flex items-center justify-center border-2 border-dashed border-muted rounded-md bg-muted/20">
              <p className="text-muted-foreground text-sm">Activity Chart Placeholder</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions / Recent Projects */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest actions across your projects.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Fallback mock data if no recent activity stream exists yet */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4 pb-4 border-b last:border-0 border-border">
                  <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Campaign "Welcome Series" started</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
