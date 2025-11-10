// components/dashboard/PlayerIntelCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles } from "lucide-react"
import { type LucideIcon } from "lucide-react"

// Define the type for the fact prop
export type PlayerFact = {
    icon: LucideIcon
    title: string
    text: string
} | null

export function PlayerIntelCard({ fact }: { fact: PlayerFact }) {
    const DefaultIcon = Sparkles

    return (
        <Card className="border border-primary/10 bg-card/70 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold">Player Intel</CardTitle>
                {fact ? (
                    <fact.icon className="h-5 w-5 text-yellow-500" />
                ) : (
                    <DefaultIcon className="h-5 w-5 text-yellow-500" />
                )}
            </CardHeader>
            <CardContent>
                {fact ? (
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-card-foreground">
                            {fact.title}
                        </p>
                        <p className="text-sm text-muted-foreground">{fact.text}</p>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground italic py-4 text-center">
                        Play some games to unlock player intel.
                    </p>
                )}
            </CardContent>
        </Card>
    )
}