// components/SessionLeaderboard.tsx
import { getSessionLeaderboard } from "@/lib/leaderboard";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default async function SessionLeaderboard({ sessionId }: { sessionId: string }) {
  const stats = await getSessionLeaderboard(sessionId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        {stats.length === 0 ? (
          <p className="text-sm text-muted-foreground">No games played yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">Player</th>
                <th className="text-right">Games</th>
                <th className="text-right">Wins</th>
                <th className="text-right">Losses</th>
                <th className="text-right">Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((p) => (
                <tr key={p.id} className="border-t border-muted/30">
                  <td>{p.name}</td>
                  <td className="text-right">{p.plays}</td>
                  <td className="text-right">{p.wins}</td>
                  <td className="text-right">{p.losses}</td>
                  <td className="text-right">
                    <CircularProgress value={p.winRate} size={36} strokeWidth={5} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
