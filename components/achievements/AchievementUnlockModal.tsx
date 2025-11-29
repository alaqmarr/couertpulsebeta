"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type UnlockedAchievement = {
    name: string;
    description: string;
    icon: string;
    tier: string;
};

export function AchievementUnlockModal({
    achievement,
    onClose,
}: {
    achievement: UnlockedAchievement | null;
    onClose: () => void;
}) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (achievement) {
            setIsOpen(true);
            // Auto-close after 5 seconds
            const timer = setTimeout(() => {
                setIsOpen(false);
                onClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [achievement, onClose]);

    if (!achievement) return null;

    const tierColors: Record<string, string> = {
        BRONZE: "from-orange-600 to-orange-400",
        SILVER: "from-gray-400 to-gray-200",
        GOLD: "from-yellow-500 to-yellow-300",
        PLATINUM: "from-cyan-400 to-cyan-200",
        DIAMOND: "from-purple-500 to-purple-300",
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && setIsOpen(false)}>
            <DialogContent className="max-w-md">
                <AnimatePresence>
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-center py-6"
                    >
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                rotate: [0, 360],
                            }}
                            transition={{
                                duration: 1,
                                repeat: 1,
                            }}
                            className={`
                w-32 h-32 mx-auto mb-6 rounded-full 
                bg-gradient-to-br ${tierColors[achievement.tier] || tierColors.BRONZE}
                flex items-center justify-center text-6xl
                shadow-2xl
              `}
                        >
                            {achievement.icon}
                        </motion.div>

                        <h2 className="text-2xl font-bold mb-2">Achievement Unlocked!</h2>
                        <h3 className="text-xl font-semibold mb-2">{achievement.name}</h3>
                        <p className="text-muted-foreground mb-4">{achievement.description}</p>
                        <div className="flex items-center justify-center gap-2 text-sm">
                            <Trophy className="w-4 h-4" />
                            <span className="font-medium">{achievement.tier} Tier</span>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
