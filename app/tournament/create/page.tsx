"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import { Loader2, Trophy, Calendar, Gavel, LayoutGrid } from "lucide-react";
import { createTournamentAction } from "../tournament.server";

export default function CreateTournamentPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleSubmit = async (formData: FormData) => {
        startTransition(async () => {
            try {
                const result = await createTournamentAction(formData);
                if (result.success) {
                    toast.success("Tournament created!");
                    router.push(`/tournament/${result.slug}`);
                }
            } catch (error: any) {
                toast.error(error.message || "Failed to create tournament");
            }
        });
    };

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
            <div className="max-w-2xl w-full space-y-8">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-4">
                        <Trophy className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Tournament</h1>
                    <p className="text-muted-foreground">
                        Setup your league with auctions, scheduling, and detailed stats.
                    </p>
                </div>

                <form action={handleSubmit} className="glass-card p-6 md:p-8 rounded-xl space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Trophy size={18} /> Basic Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Tournament Name</Label>
                                <Input id="name" name="name" placeholder="e.g. Summer Smash 2024" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">URL Slug</Label>
                                <Input id="slug" name="slug" placeholder="summer-smash-2024" required />
                            </div>
                        </div>
                    </div>

                    {/* Schedule Settings */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Calendar size={18} /> Schedule Settings
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input id="startDate" name="startDate" type="date" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input id="endDate" name="endDate" type="date" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="matchDays">Match Days (Comma separated)</Label>
                                <Input id="matchDays" name="matchDays" placeholder="Monday, Wednesday, Friday" />
                            </div>
                        </div>
                    </div>

                    {/* Game & Auction Settings */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Gavel size={18} /> Game & Auction
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="courts">Number of Courts</Label>
                                <Input id="courts" name="courts" type="number" min="1" defaultValue="1" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="auctionPurse">Team Purse (Points)</Label>
                                <Input id="auctionPurse" name="auctionPurse" type="number" min="1000" defaultValue="10000" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="minGamesPerPlayer">Min Games/Player</Label>
                                <Input id="minGamesPerPlayer" name="minGamesPerPlayer" type="number" min="0" defaultValue="0" />
                            </div>
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                            </>
                        ) : (
                            "Create Tournament"
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}
