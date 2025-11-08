"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Icons
import { Loader2, CalendarPlus, Calendar, Info, Trash } from "lucide-react";
import { createSessionAction, deleteSessionAction } from "../team-actions.server";

// Type definition for a single session (improves type safety)
type Session = {
    id: string;
    name: string | null;
    date: Date;
    slug: string | null;
    games: { id: string; winner: string | null }[];
};

export default function SessionList({
    team,
}: {
    team: {
        id: string;
        slug: string;
        sessions: Session[];
    };
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);

    async function handleDeleteSession() {
        if (!sessionToDelete) return;

        startTransition(async () => {
            try {
                await deleteSessionAction(team.slug, sessionToDelete.id);
                toast.success("Session deleted.");
                setSessionToDelete(null); // Close the dialog
            } catch (err: any) {
                toast.error(err.message || "Error deleting session.");
            }
        });
    }

    return (
        <Card className="bg-card/70 backdrop-blur-sm border border-primary/10">
            <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <CardTitle className="flex items-center gap-2">
                        <Calendar size={18} />
                        Sessions ({team.sessions.length})
                    </CardTitle>

                    {/* --- Create Session Dialog --- */}
                    <CreateSessionDialog team={team} />
                </div>
            </CardHeader>

            <CardContent>
                {team.sessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-primary/20 rounded-lg bg-muted/50">
                        <Info size={24} className="text-primary" />
                        <p className="text-muted-foreground text-sm">
                            No sessions yet. Create one to start recording games.
                        </p>
                    </div>
                ) : (
                    <AlertDialog>
                        <ul className="divide-y divide-border/50">
                            {team.sessions.map((s) => (
                                <li
                                    key={s.id}
                                    className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                                >
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
                                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                        <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md border">
                                            {s.games.length} games
                                        </span>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() =>
                                                router.push(`/team/${team.slug}/session/${s.slug}`)
                                            }
                                        >
                                            Open
                                        </Button>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-400"
                                                disabled={isPending}
                                                onClick={() => setSessionToDelete(s)}
                                            >
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        {/* --- Delete Confirmation Dialog --- */}
                        <AlertDialogContent className="bg-card/90 backdrop-blur-md border border-primary/20">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete the session{" "}
                                    <span className="font-semibold text-foreground">
                                        {sessionToDelete?.name || "Untitled Session"}
                                    </span>{" "}
                                    and all its {sessionToDelete?.games.length} games.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel asChild>
                                    <Button
                                        variant="outline"
                                        onClick={() => setSessionToDelete(null)}
                                        disabled={isPending}
                                    >
                                        Cancel
                                    </Button>
                                </AlertDialogCancel>
                                <AlertDialogAction asChild>
                                    <Button
                                        variant="destructive"
                                        onClick={handleDeleteSession}
                                        disabled={isPending}
                                    >
                                        {isPending ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            "Delete Session"
                                        )}
                                    </Button>
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </CardContent>
        </Card>
    );
}

/* -------------------------------------------------------------------------- */
/* Create Session Dialog Component */
/* -------------------------------------------------------------------------- */
function CreateSessionDialog({
    team,
}: {
    team: { id: string; slug: string };
}) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [sessionName, setSessionName] = useState("");

    async function handleCreateSession() {
        if (!sessionName.trim()) {
            toast.error("Please enter a session name.");
            return;
        }

        startTransition(async () => {
            try {
                const result = await createSessionAction(team.slug, sessionName.trim());
                if (!result?.slug) throw new Error("No session slug returned.");

                toast.success("Session created successfully!");
                setSessionName("");
                setIsOpen(false); // Close dialog on success

                router.push(`/team/${team.slug}/session/${result.slug}`);
            } catch (err: any) {
                toast.error(err.message || "Failed to create session.");
            }
        });
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <CalendarPlus className="w-4 h-4 mr-1.5" />
                    Create Session
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-card/90 backdrop-blur-md border border-primary/20">
                <DialogHeader>
                    <DialogTitle>Create New Session</DialogTitle>
                    <DialogDescription>
                        Enter a name for your new session (e.g., "Tuesday Practice").
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <div className="space-y-2">
                        <Label htmlFor="session-name">Session Name</Label>
                        <Input
                            id="session-name"
                            placeholder="e.g., Tuesday Practice"
                            value={sessionName}
                            onChange={(e) => setSessionName(e.target.value)}
                            disabled={isPending}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={isPending}>
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button onClick={handleCreateSession} disabled={isPending}>
                        {isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            "Create and Open"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}