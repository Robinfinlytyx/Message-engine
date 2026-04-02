'use client';

import { use } from 'react';
import ProjectConfigForm from '@/components/ProjectConfigForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings, Shield, Globe, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ProjectConfigPage({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = use(params);

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                        <Settings className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Project Settings</h1>
                        <p className="text-sm text-slate-500">Configure core infrastructure and channel credentials.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="h-6 bg-slate-50/50 text-[10px] uppercase font-black tracking-widest text-slate-400 border-slate-100">
                        ID: {projectId.slice(-8).toUpperCase()}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                {/* Information Column */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-slate-200/60 shadow-sm rounded-2xl overflow-hidden bg-slate-50/20">
                        <CardHeader className="p-5">
                            <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <Shield className="h-4 w-4 text-indigo-500" /> Security
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-0 space-y-4">
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                Use these credentials to integrate your application with our API. Never share your secret keys.
                            </p>
                            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full w-2/3 bg-indigo-500 rounded-full" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200/60 shadow-sm rounded-2xl overflow-hidden bg-indigo-600">
                        <CardContent className="p-6 space-y-4">
                            <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <Globe className="h-5 w-5 text-white" />
                            </div>
                            <h3 className="text-white font-black text-lg leading-tight tracking-tight">Expand to New Channels</h3>
                            <p className="text-indigo-100 text-xs font-medium leading-relaxed">
                                Connect SMS, Discord, or Slack integration using our SDK and the project API keys.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Configuration Main Form */}
                <div className="lg:col-span-3">
                    <Card className="border-slate-200/60 shadow-xl shadow-indigo-500/5 rounded-3xl overflow-hidden">
                        <CardContent className="p-0">
                            <ProjectConfigForm projectId={projectId} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
