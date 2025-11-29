import { Trophy } from "lucide-react";

export function TrophyHeader() {
    return (
        <div className="space-y-2">
            <h1 className="text-4xl font-bold flex items-center gap-2">
                <Trophy className="w-10 h-10 text-yellow-500" />
                Trophy Room
            </h1>
            <p className="text-muted-foreground">
                Showcase your greatest achievements and milestones
            </p>
        </div>
    );
}
