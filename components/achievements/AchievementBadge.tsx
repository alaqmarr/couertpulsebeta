"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Trophy } from "lucide-react";

type AchievementTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";

const tierColors: Record<AchievementTier, string> = {
    BRONZE: "text-orange-600 bg-orange-100 dark:bg-orange-950/30",
    SILVER: "text-gray-400 bg-gray-100 dark:bg-gray-900",
    GOLD: "text-yellow-500 bg-yellow-100 dark:bg-yellow-950/30",
    PLATINUM: "text-cyan-400 bg-cyan-100 dark:bg-cyan-950/30",
    DIAMOND: "text-purple-500 bg-purple-100 dark:bg-purple-950/30",
};

type AchievementBadgeProps = {
    name: string;
    description: string;
    tier: AchievementTier;
    icon: string;
    unlocked?: boolean;
    size?: "sm" | "md" | "lg";
};

export function AchievementBadge({
    name,
    description,
    tier,
    icon,
    unlocked = false,
    size = "md",
}: AchievementBadgeProps) {
    const sizeClasses = {
        sm: "w-12 h-12 text-xl",
        md: "w-16 h-16 text-2xl",
        lg: "w-20 h-20 text-3xl",
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className={`
              relative flex items-center justify-center rounded-full 
              ${sizeClasses[size]}
              ${tierColors[tier]}
              ${unlocked ? "opacity-100" : "opacity-40 grayscale"}
              transition-all hover:scale-110 cursor-pointer
            `}
                    >
                        <span className="text-center">{icon}</span>
                        {unlocked && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                <Trophy className="w-3 h-3 text-white" />
                            </div>
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <div className="space-y-1">
                        <p className="font-semibold">{name}</p>
                        <p className="text-xs text-muted-foreground">{description}</p>
                        <p className="text-xs font-medium">{tier} Tier</p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
