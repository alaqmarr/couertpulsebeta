import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchTimeline } from "@/components/tournament/MatchTimeline";

export async function MatchTimelineWrapper({ matchId }: { matchId: string }) {
    const match = await prisma.tournamentGame.findUnique({
        where: { id: matchId },
        include: {
            events: {
                orderBy: { timestamp: 'desc' },
                include: {
                    player: {
                        include: {
                            team: true
                        }
                    }
                }
            }
        }
    });

    if (!match) return null;

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="text-lg">Match Timeline</CardTitle>
            </CardHeader>
            <CardContent>
                <MatchTimeline events={match.events.map(e => ({
                    id: e.id,
                    type: e.type,
                    timestamp: e.timestamp,
                    scoreA: e.scoreA,
                    scoreB: e.scoreB,
                    metadata: e.metadata,
                    player: e.player ? {
                        id: e.player.id,
                        name: e.player.name,
                        userId: e.player.userId,
                        team: {
                            name: e.player.team?.name || "Unknown"
                        }
                    } : undefined
                }))} />
            </CardContent>
        </Card>
    );
}
