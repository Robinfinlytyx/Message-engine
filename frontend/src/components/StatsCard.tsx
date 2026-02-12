'use client';

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

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
        <Card className={cn("overflow-hidden transition-all hover:shadow-md", className)}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <div className="text-muted-foreground bg-secondary/50 p-2 rounded-full">
                        {icon}
                    </div>
                </div>
                <div className="flex items-baseline space-x-3">
                    <div className="text-2xl font-bold">{value}</div>
                    {trend && (
                        <div className={cn(
                            "flex items-center text-xs font-medium rounded px-1.5 py-0.5",
                            trend.isPositive === true ? "text-green-700 bg-green-100" :
                                trend.isPositive === false ? "text-red-700 bg-red-100" :
                                    "text-gray-700 bg-gray-100"
                        )}>
                            {trend.isPositive === true ? <ArrowUpRight className="h-3 w-3 mr-1" /> :
                                trend.isPositive === false ? <ArrowDownRight className="h-3 w-3 mr-1" /> :
                                    <Minus className="h-3 w-3 mr-1" />}
                            {trend.value}
                        </div>
                    )}
                </div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                )}
            </CardContent>
        </Card>
    );
}
