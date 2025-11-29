import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

interface TeammateStats {
    userId: string;
    name: string;
    image: string | null;
    gamesPlayed: number;
    wins: number;
    winRate: number;
}

export function BestTeammateWidget({ teammates }: { teammates: TeammateStats[] }) {
    if (teammates.length === 0) {
        return (
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Best Teammates
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground py-4">
                        Not enough data. Play more games with teammates!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Best Teammates
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {teammates.map((teammate, index) => (
                        <div
                            key={teammate.userId}
                            className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition"
                        >
                            <div className="flex items-center gap-2 text-lg font-bold text-muted-foreground w-6">
                                #{index + 1}
                            </div>

                            <Avatar className="w-10 h-10">
                                <AvatarImage src={teammate.image || undefined} />
                                <AvatarFallback>
                                    {teammate.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">{teammate.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {teammate.gamesPlayed} games together
                                </p>
                            </div>

                            <div className="text-right">
                                <Badge variant="outline" className="text-green-500 border-green-500">
                                    {teammate.winRate}%
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {teammate.wins}W
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
