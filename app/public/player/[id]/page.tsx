import { prisma } from "@/lib/db";
import { analyticsDb } from "@/lib/analytics-db";
import { getPlayerPrivacy } from "@/lib/player-privacy";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AchievementBadge } from "@/components/achievements/AchievementBadge";
import { Trophy, Target, TrendingUp, Users } from "lucide-react";
import { notFound } from "next/navigation";

export default async function PublicPlayerPage({ params }: { params: { id: string } }) {
    const { id } = params;

    // Get player data
    const player = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            displayName: true,
            image: true,
            bio: true,
            points: true,
            wins: true,
            losses: true,
            createdAt: true,
        },
    });

    if (!player) {
        notFound();
    }

    // Check privacy settings
    const privacy = await getPlayerPrivacy(id);

    if (!privacy.showProfile) {
        return (
            <div className="container mx-auto py-12 text-center">
                <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h1 className="text-2xl font-bold mb-2">Private Profile</h1>
                <p className="text-muted-foreground">
                    This player has set their profile to private.
                </p>
            </div>
        );
    }

    // Parse bio
    let bioText = "";
    try {
        if (player.bio && player.bio.startsWith("{")) {
            const bioData = JSON.parse(player.bio);
            bioText = bioData.text || "";
        } else {
            bioText = player.bio || "";
        }
    } catch (e) {
        bioText = player.bio || "";
    }

    // Get achievements if visible
    let achievements: any[] = [];
    if (privacy.showAchievements) {
        const userAchievements = await analyticsDb.userAchievement.findMany({
            where: { userId: id },
            include: { achievement: true },
            orderBy: { unlockedAt: "desc" },
            take: 12,
        });
        achievements = userAchievements;
    }

    const totalMatches = player.wins + player.losses;
    const winRate = totalMatches > 0 ? Math.round((player.wins / totalMatches) * 100) : 0;

    return (
        <div className="container mx-auto py-8 space-y-6">
            {/* Player Header */}
            <div className="flex items-center gap-6">
                {player.image && (
                    <img
                        src={player.image}
                        alt={player.displayName || player.name || "Player"}
                        className="w-24 h-24 rounded-full border-4 border-primary/20"
                    />
                )}
                <div>
                    <h1 className="text-4xl font-bold">{player.displayName || player.name}</h1>
                    <p className="text-muted-foreground">
                        Player since {new Date(player.createdAt).toLocaleDateString()}
                    </p>
                </div>
            </div>

            {/* Bio */}
            {privacy.showBio && bioText && (
                <Card className="glass-card">
                    <CardContent className="pt-6">
                        <p className="text-muted-foreground">{bioText}</p>
                    </CardContent>
                </Card>
            )}

            {/* Stats */}
            {privacy.showStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="glass-card text-center">
                        <CardContent className="pt-6">
                            <Target className="w-8 h-8 mx-auto mb-2 text-primary" />
                            <div className="text-3xl font-bold">{player.points}</div>
                            <div className="text-sm text-muted-foreground">Points</div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card text-center">
                        <CardContent className="pt-6">
                            <Trophy className="w-8 h-8 mx-auto mb-2 text-green-500" />
                            <div className="text-3xl font-bold">{player.wins}</div>
                            <div className="text-sm text-muted-foreground">Wins</div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card text-center">
                        <CardContent className="pt-6">
                            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                            <div className="text-3xl font-bold">{winRate}%</div>
                            <div className="text-sm text-muted-foreground">Win Rate</div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card text-center">
                        <CardContent className="pt-6">
                            <Users className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                            <div className="text-3xl font-bold">{totalMatches}</div>
                            <div className="text-sm text-muted-foreground">Matches</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Achievements */}
            {privacy.showAchievements && achievements.length > 0 && (
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>Recent Achievements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                            {achievements.map((ua) => (
                                <AchievementBadge
                                    key={ua.id}
                                    name={ua.achievement.name}
                                    description={ua.achievement.description}
                                    tier={ua.achievement.tier as any}
                                    icon={ua.achievement.icon}
                                    unlocked={true}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
