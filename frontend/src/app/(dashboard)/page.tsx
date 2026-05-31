'use client';

import { useState, useEffect } from 'react';
import { api } from "@/lib/api";
import StatsCard from "@/components/StatsCard";
import {
  LayoutDashboard,
  FolderKanban,
  MessageSquare,
  Megaphone,
  Activity,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data } = await api.admin.getStats();
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
      <div className="space-y-8 animate-pulse">
        <div className="flex justify-between items-end">
          <div className="space-y-3">
            <div className="h-8 w-48 bg-muted rounded-lg" />
            <div className="h-4 w-64 bg-muted rounded-md" />
          </div>
          <div className="h-10 w-32 bg-muted rounded-md" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-card border border-border/50 shadow-sm" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-7">
            <div className="col-span-4 h-[400px] rounded-2xl bg-card border border-border/50" />
            <div className="col-span-3 h-[400px] rounded-2xl bg-card border border-border/50" />
        </div>
      </div>
    );
  }

  if (error) return (
    <div className="p-8 text-destructive bg-destructive/10 rounded-2xl border border-destructive/20 backdrop-blur-sm flex flex-col items-center gap-4 text-center">
        <Activity className="h-12 w-12 opacity-50" />
        <div>
            <h3 className="text-lg font-bold">Connection Error</h3>
            <p className="text-sm opacity-80">{error}</p>
        </div>
        <Button variant="outline" onClick={fetchStats}>Try Again</Button>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div className="space-y-1 flex flex-col items-center md:items-start">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-bold tracking-tight text-foreground font-outfit"
          >
            Overview
          </motion.h1>
          <p className="text-muted-foreground font-medium">Platform performance and real-time metrics.</p>
        </div>
        <div className="flex justify-center gap-3 w-full md:w-auto">
          <Button variant="outline" onClick={fetchStats} className="bg-background/50 border-border/50 backdrop-blur-sm">
            Refresh Data
          </Button>
          <Link href="/projects">
            <Button className="shadow-lg shadow-primary/20 gap-2">
              <Zap className="h-4 w-4 fill-primary-foreground" />
              Manage Projects
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Projects"
          value={stats.totalProjects}
          icon={<FolderKanban className="h-5 w-5" />}
          description="Active API projects"
          className="bg-primary/5 border-primary/10"
        />
        <StatsCard
          title="Total Messages"
          value={stats.totalMessages.toLocaleString()}
          icon={<MessageSquare className="h-5 w-5" />}
          trend={{ value: `${stats.messagesLast24h} new`, isPositive: stats.messagesLast24h > 0 }}
        />
        <StatsCard
          title="Campaigns"
          value={stats.totalCampaigns}
          icon={<Megaphone className="h-5 w-5" />}
          description="Running automated flows"
        />
        <StatsCard
          title="Success Rate"
          value="99.8%"
          icon={<TrendingUp className="h-5 w-5" />}
          trend={{ value: "+0.2%", isPositive: true }}
        />
      </div>

      {/* Main Insights */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">

        {/* System Overview */}
        <Card className="col-span-4 border-border/50 bg-card/40 backdrop-blur-md shadow-xl overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="h-24 w-24" />
          </div>
          <CardHeader>
            <CardTitle className="font-outfit text-xl flex items-center gap-2">
                Operational Intelligence
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-none animate-pulse uppercase text-[10px]">Live</Badge>
            </CardTitle>
            <CardDescription>
              Backend services are fully operational and responding within 45ms.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] mt-4 flex flex-col items-center justify-center border border-dashed border-border/50 rounded-2xl bg-muted/20 relative overflow-hidden group/chart">
                <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
                <Activity className="h-12 w-12 text-primary/20 mb-2 group-hover/chart:scale-110 transition-transform duration-500" />
                <p className="text-muted-foreground text-sm font-medium">Real-time Traffic Monitor coming soon</p>
                <Button variant="ghost" size="sm" className="mt-4 text-xs">Configure Hooks</Button>
            </div>
            
            <div className="mt-6 flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-bold">API Sync Performance</p>
                        <p className="text-xs text-muted-foreground">Global latency average: <span className="text-primary font-mono">22ms</span></p>
                    </div>
                </div>
                <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Logs / Quick Actions */}
        <Card className="col-span-3 border-border/50 bg-card/40 backdrop-blur-md shadow-xl">
          <CardHeader>
            <CardTitle className="font-outfit text-xl">Recent Activity</CardTitle>
            <CardDescription>
              Key events across your organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { title: 'New project "E-commerce Bot" created', time: '2 mins ago', type: 'project' },
                { title: 'Campaign "Summer Sale" completed', time: '45 mins ago', type: 'campaign' },
                { title: 'Member "Sarah" joined the team', time: '3 hours ago', type: 'user' },
                { title: 'API Key rotated for project Alpha', time: '5 hours ago', type: 'security' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 group cursor-pointer">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold leading-none group-hover:text-primary transition-colors">{item.title}</p>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70">{item.time}</p>
                  </div>
                </div>
              ))}
              
              <Button variant="outline" className="w-full mt-4 text-xs font-bold uppercase tracking-widest h-10 border-border/50 bg-transparent hover:bg-card">
                View Full Audit Log
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

