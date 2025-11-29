"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from "recharts";

interface AnalyticsDashboardProps {
    eloHistory: { date: string; rating: number }[];
    activityData: { date: string; count: number }[];
}

export function AnalyticsDashboard({
    eloHistory,
    activityData,
}: AnalyticsDashboardProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>ELO Rating History</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={eloHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                            <XAxis dataKey="date" stroke="#888888" />
                            <YAxis stroke="#888888" />
                            <Tooltip
                                contentStyle={{ backgroundColor: "#1f2937", border: "none" }}
                                itemStyle={{ color: "#fff" }}
                            />
                            <Line
                                type="monotone"
                                dataKey="rating"
                                stroke="#8884d8"
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Activity Overview</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activityData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                            <XAxis dataKey="date" stroke="#888888" />
                            <YAxis stroke="#888888" />
                            <Tooltip
                                contentStyle={{ backgroundColor: "#1f2937", border: "none" }}
                                itemStyle={{ color: "#fff" }}
                            />
                            <Bar dataKey="count" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
