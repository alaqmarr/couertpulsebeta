"use client";

import { useEffect, useState } from "react";
import { AchievementUnlockModal } from "@/components/achievements/AchievementUnlockModal";

type UnlockedAchievement = {
    name: string;
    description: string;
    icon: string;
    tier: string;
};

/**
 * Achievement Notification Provider
 * Place this in your layout to listen for achievement unlocks
 */
export function AchievementNotificationProvider() {
    const [achievement, setAchievement] = useState<UnlockedAchievement | null>(null);

    useEffect(() => {
        // Listen for custom achievement unlock events
        const handleAchievementUnlock = (event: CustomEvent<UnlockedAchievement>) => {
            setAchievement(event.detail);
        };

        window.addEventListener(
            "achievement:unlock" as any,
            handleAchievementUnlock as any
        );

        return () => {
            window.removeEventListener(
                "achievement:unlock" as any,
                handleAchievementUnlock as any
            );
        };
    }, []);

    return (
        <AchievementUnlockModal
            achievement={achievement}
            onClose={() => setAchievement(null)}
        />
    );
}

/**
 * Helper function to trigger achievement unlock notifications
 * Call this from server actions or client code when an achievement is unlocked
 */
export function triggerAchievementUnlock(achievement: UnlockedAchievement) {
    if (typeof window !== "undefined") {
        const event = new CustomEvent("achievement:unlock", {
            detail: achievement,
        });
        window.dispatchEvent(event);
    }
}
