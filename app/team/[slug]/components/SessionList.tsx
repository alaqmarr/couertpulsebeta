"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { Loader2, CalendarPlus } from "lucide-react";
import { createSessionAction, deleteSessionAction } from "../team-actions.server";
import { Separator } from "@/components/ui/separator";

export default function SessionList({
    team,
}: {
    team: {
        id: string;
        slug: string;
        sessions: {
            id: string;
            name: string | null;
            date: Date;
            slug: string | null;
            games: { id: string; winner: string | null }[];
        }[];
    };
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [sessionName, setSessionName] = useState("");

    async function handleCreateSession() {
        if (!sessionName.trim()) {
            toast.error("Please enter a session name.");
            return;
        }

        startTransition(async () => {
            try {
                // Create session → returns slug (we’ll modify the action to do that)
                const result = await createSessionAction(team.slug, sessionName.trim());
                if (!result?.slug) throw new Error("No session slug returned.");

                toast.success("Session created successfully!");
                setSessionName("");

                // Navigate to the new session’s page
                router.push(`/team/${team.slug}/session/${result.slug}`);
            } catch (err: any) {
                toast.error(err.message || "Failed to create session.");
            }
        });
    }

    async function handleDeleteSession(id: string) {
        startTransition(async () => {
            try {
                await deleteSessionAction(team.slug, id);
                toast.success("Session deleted.");
            } catch (err: any) {
                toast.error(err.message || "Error deleting session.");
            }
        });
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <CardTitle>Sessions ({team.sessions.length})</CardTitle>

                    <div className="flex gap-2">
                        <Input
                            placeholder="Enter session name"
                            value={sessionName}
                            onChange={(e) => setSessionName(e.target.value)}
                            disabled={isPending}
                            className="w-56"
                        />
                        <Button onClick={handleCreateSession} disabled={isPending}>
                            {isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <CalendarPlus className="w-4 h-4 mr-1" />
                                    Add
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <Separator />

            <CardContent>
                {team.sessions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No sessions yet. Create one to start recording games.
                    </p>
                ) : (
                    <ul className="divide-y divide-border">
                        {team.sessions.map((s) => (
                            <li key={s.id} className="py-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{s.name || "Untitled Session"}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(s.date).toLocaleDateString("en-IN", {
                                                weekday: "short",
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-muted-foreground">
                                            {s.games.length} games
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                router.push(`/team/${team.slug}/session/${s.slug}`)
                                            }
                                        >
                                            Open
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            disabled={isPending}
                                            onClick={() => handleDeleteSession(s.id)}
                                        >
                                            {isPending ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                "Delete"
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
