'use client';

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { motion } from "framer-motion";

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: {
        value: string;
        isPositive?: boolean;
    };
    description?: string;
    className?: string;
}

export default function StatsCard({ title, value, icon, trend, description, className }: StatsCardProps) {
    return (
        <motion.div
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
            <Card className={cn(
                "overflow-hidden border-border/50 bg-card/40 backdrop-blur-md transition-all hover:bg-card/60 hover:shadow-2xl hover:shadow-primary/5", 
                className
            )}>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between space-y-0 pb-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-70">{title}</p>
                        <div className="text-primary bg-primary/10 p-2.5 rounded-xl border border-primary/10">
                            {icon}
                        </div>
                    </div>
                    <div className="flex items-baseline space-x-3">
                        <div className="text-3xl font-bold tracking-tight font-outfit">{value}</div>
                        {trend && (
                            <div className={cn(
                                "flex items-center text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5",
                                trend.isPositive === true ? "text-green-500 bg-green-500/10" :
                                    trend.isPositive === false ? "text-red-500 bg-red-500/10" :
                                        "text-muted-foreground bg-muted"
                            )}>
                                {trend.isPositive === true ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> :
                                    trend.isPositive === false ? <ArrowDownRight className="h-3 w-3 mr-0.5" /> :
                                        <Minus className="h-3 w-3 mr-0.5" />}
                                {trend.value}
                            </div>
                        )}
                    </div>
                    {description && (
                        <p className="text-[11px] text-muted-foreground mt-2 font-medium opacity-80">{description}</p>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}

