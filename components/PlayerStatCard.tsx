"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { CircularProgress } from "./ui/circular-progress"

export default function PlayerStatCard({
    player,
}: {
    player: {
        displayName: string
        plays: number
        wins: number
        losses: number
        winRate: number
    }
}) {
    const color =
        player.winRate >= 50
            ? "text-green-500"
            : player.winRate > 0
                ? "text-red-500"
                : "text-muted-foreground"

    return (
        <Card className="flex flex-col items-center justify-center py-6">
            <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg font-semibold">
                    {player.displayName}
                </CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col items-center space-y-3">
                <CircularProgress value={player.winRate} size={80} />
                <p className="text-sm text-muted-foreground">
                    {player.wins} Wins / {player.plays} Games
                </p>
            </CardContent>
        </Card>
    )
}
