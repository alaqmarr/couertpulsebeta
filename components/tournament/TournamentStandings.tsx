import { prisma } from "@/lib/db";
import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export async function TournamentStandings({ slug }: { slug: string }) {
    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: {
            tournamentTeams: {
                orderBy: [
                    { points: 'desc' },
                    { wins: 'desc' },
                    { matchesPlayed: 'asc' }
                ]
            }
        }
    });

    if (!tournament) return null;

    return (
        <Card className="glass-card" id="standings">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" /> Standings
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-white/5 text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3">Pos</th>
                                <th className="px-4 py-3">Team</th>
                                <th className="px-4 py-3 text-center">P</th>
                                <th className="px-4 py-3 text-center">W</th>
                                <th className="px-4 py-3 text-center">L</th>
                                <th className="px-4 py-3 text-center">D</th>
                                <th className="px-4 py-3 text-center font-bold">Pts</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {tournament.tournamentTeams.map((team, index) => (
                                <tr key={team.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 font-medium text-muted-foreground">#{index + 1}</td>
                                    <td className="px-4 py-3 font-semibold flex items-center gap-2">
                                        {team.logoUrl && (
                                            <div className="w-6 h-6 relative rounded-full overflow-hidden">
                                                <Image src={team.logoUrl} alt={team.name} fill className="object-cover" />
                                            </div>
                                        )}
                                        {team.name}
                                    </td>
                                    <td className="px-4 py-3 text-center">{team.matchesPlayed}</td>
                                    <td className="px-4 py-3 text-center text-green-400">{team.wins}</td>
                                    <td className="px-4 py-3 text-center text-red-400">{team.losses}</td>
                                    <td className="px-4 py-3 text-center text-yellow-400">{team.draws}</td>
                                    <td className="px-4 py-3 text-center font-bold text-lg">{team.points}</td>
                                </tr>
                            ))}
                            {tournament.tournamentTeams.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                        No teams registered yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
