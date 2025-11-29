"use client";

import { useEffect, useState } from "react";
import { rtdb as database } from "@/lib/firebase";
import { ref, onValue, off } from "firebase/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gavel, Timer, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AuctionClientProps {
    tournamentId: string;
}

interface ActiveItem {
    playerId?: string;
    playerName?: string;
    currentBid?: number;
    currentBidderId?: string;
    currentBidderName?: string;
    lastBidTime?: number;
    status?: "ACTIVE" | "SOLD" | "PAUSED";
}

export function AuctionClient({ tournamentId }: AuctionClientProps) {
    const [activeItem, setActiveItem] = useState<ActiveItem | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!database) return;

        const activeItemRef = ref(database, `auctions/${tournamentId}/activeItem`);

        const unsubscribe = onValue(activeItemRef, (snapshot) => {
            setIsConnected(true);
            const data = snapshot.val();
            setActiveItem(data);
        }, (error) => {
            console.error("Firebase Error:", error);
            setIsConnected(false);
        });

        return () => {
            off(activeItemRef);
        };
    }, [tournamentId]);

    if (!activeItem) {
        return (
            <Card className="glass-card border-dashed border-white/10 mb-8">
                <CardContent className="py-8 text-center text-muted-foreground">
                    <div className="flex justify-center mb-2">
                        <Gavel className="w-8 h-8 opacity-50" />
                    </div>
                    <p>Waiting for auction to start...</p>
                    {isConnected && <span className="text-xs text-green-500">● Connected to Live Server</span>}
                </CardContent>
            </Card>
        );
    }

    return (
        <AnimatePresence mode="wait">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-8"
            >
                <Card className="glass-card border-primary/50 shadow-[0_0_30px_-10px_rgba(var(--primary),0.3)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                        <Badge variant="destructive" className="animate-pulse">
                            LIVE AUCTION
                        </Badge>
                    </div>

                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-2xl md:text-4xl font-black uppercase tracking-wider text-primary">
                            {activeItem.playerName || "Unknown Player"}
                        </CardTitle>
                        <p className="text-muted-foreground flex items-center justify-center gap-2">
                            <Timer className="w-4 h-4" /> Live Bidding
                        </p>
                    </CardHeader>

                    <CardContent className="flex flex-col items-center gap-6 py-6">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-4 border-white/10 shadow-2xl">
                            <User className="w-16 h-16 text-primary" />
                        </div>

                        <div className="text-center space-y-2">
                            <p className="text-sm text-muted-foreground uppercase tracking-widest">Current Bid</p>
                            <div className="text-5xl md:text-7xl font-black tabular-nums tracking-tight text-white drop-shadow-lg">
                                {activeItem.currentBid || 0}
                            </div>
                            {activeItem.currentBidderName && (
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="font-semibold text-sm">
                                        Held by: <span className="text-primary">{activeItem.currentBidderName}</span>
                                    </span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
}
