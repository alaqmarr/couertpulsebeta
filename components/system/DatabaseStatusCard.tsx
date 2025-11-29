"use client";

import { DatabaseStatus } from "@/lib/system-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle, Database, Flame } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const statusIcons = {
    healthy: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    degraded: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    down: <XCircle className="w-5 h-5 text-red-500" />,
};

const statusColors = {
    healthy: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    degraded: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
    down: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export function DatabaseStatusCard({ status }: { status: DatabaseStatus }) {
    const Icon = status.type === "firebase" ? Flame : Database;

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        {status.name}
                    </span>
                    {statusIcons[status.status]}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge className={statusColors[status.status]}>
                        {status.status.toUpperCase()}
                    </Badge>
                </div>

                {status.responseTime !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Response Time:</span>
                        <span className="font-mono">{status.responseTime}ms</span>
                    </div>
                )}

                {status.details?.recordCount !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Records:</span>
                        <span className="font-mono">{status.details.recordCount.toLocaleString()}</span>
                    </div>
                )}

                {status.details?.lastActivity && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last Activity:</span>
                        <span>{formatDistanceToNow(status.details.lastActivity, { addSuffix: true })}</span>
                    </div>
                )}

                {status.error && (
                    <div className="mt-3 p-2 bg-red-50 dark:bg-red-950/30 rounded text-xs text-red-600 dark:text-red-400">
                        <strong>Error:</strong> {status.error}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
