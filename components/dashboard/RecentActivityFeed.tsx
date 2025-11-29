import { formatDistanceToNow } from "date-fns";
import { Trophy, Users, Target, CreditCard } from "lucide-react";

type Activity = {
    id: string;
    userId: string;
    type: string;
    refId: string | null;
    message: string | null;
    createdAt: Date;
    user: {
        name: string | null;
        image: string | null;
    };
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    TEAM_CREATED: Users,
    TOURNAMENT_CREATED: Trophy,
    GAME_PLAYED: Target,
    GAME_WON: Trophy,
    MEMBER_ADDED: Users,
    PAYMENT_MADE: CreditCard,
};

export function RecentActivityFeed({ activities }: { activities: Activity[] }) {
    if (activities.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <p>No recent activity</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {activities.map((activity) => {
                const Icon = iconMap[activity.type] || Target;

                return (
                    <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition"
                    >
                        <div className="mt-1">
                            <Icon className="w-4 h-4 text-primary" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm">
                                <span className="font-semibold">{activity.user.name}</span>{" "}
                                <span className="text-muted-foreground">
                                    {activity.message || getActivityMessage(activity.type)}
                                </span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(activity.createdAt, { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function getActivityMessage(type: string): string {
    const messages: Record<string, string> = {
        TEAM_CREATED: "created a new team",
        TOURNAMENT_CREATED: "created a new tournament",
        GAME_PLAYED: "played a game",
        GAME_WON: "won a game",
        MEMBER_ADDED: "joined a team",
        PAYMENT_MADE: "made a payment",
    };

    return messages[type] || "performed an action";
}
