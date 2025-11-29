import Link from "next/link";
import { cn } from "@/lib/utils";

interface PlayerLinkProps {
    player: {
        id: string;
        name: string;
        userId?: string | null;
    };
    className?: string;
}

export function PlayerLink({ player, className }: PlayerLinkProps) {
    if (player.userId) {
        return (
            <Link
                href={`/player/${player.userId}`}
                className={cn(
                    "hover:underline hover:text-primary transition-colors font-medium",
                    className
                )}
            >
                {player.name}
            </Link>
        );
    }

    return <span className={className}>{player.name}</span>;
}
