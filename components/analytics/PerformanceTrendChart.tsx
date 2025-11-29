"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface PerformanceData {
    date: string;
    wins: number;
    losses: number;
    winRate: number;
}

export function PerformanceTrendChart({ data }: { data: PerformanceData[] }) {
    if (data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.5)"
                    style={{ fontSize: '12px' }}
                />
                <YAxis
                    stroke="rgba(255,255,255,0.5)"
                    style={{ fontSize: '12px' }}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px'
                    }}
                />
                <Legend />
                <Line
                    type="monotone"
                    dataKey="wins"
                    stroke="#22c55e"
                    strokeWidth={2}
                    name="Wins"
                />
                <Line
                    type="monotone"
                    dataKey="losses"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Losses"
                />
                <Line
                    type="monotone"
                    dataKey="winRate"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Win Rate %"
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
