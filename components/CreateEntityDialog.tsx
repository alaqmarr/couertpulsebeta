"use client";

import * as React from "react";
import { useTransition, useState } from "react";
import { toast } from "react-hot-toast";
import { createTeamAction, createTournamentAction } from "@/app/actions/createEntities";

import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
    type: "team" | "tournament";
    triggerText: string;
};

export default function CreateEntityDialog({ type, triggerText }: Props) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [isPending, startTransition] = useTransition();

    async function handleCreate() {
        if (!name.trim()) {
            toast.error("Please enter a valid name.");
            return;
        }

        startTransition(async () => {
            try {
                if (type === "team") {
                    await createTeamAction(name.trim());
                    toast.success("Team created successfully!");
                } else {
                    await createTournamentAction(name.trim());
                    toast.success("Tournament created successfully!");
                }
                setName("");
                setOpen(false);
            } catch (err: any) {
                toast.error(err.message || "Something went wrong.");
            }
        });
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant={type === "team" ? "default" : "outline"}>
                    {triggerText}
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {type === "team" ? "Create New Team" : "Create New Tournament"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Enter a name below to create your new{" "}
                        {type === "team" ? "team" : "tournament"}.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <Input
                    type="text"
                    placeholder={`Enter ${type} name`}
                    value={name}
                    disabled={isPending}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-3"
                />

                <AlertDialogFooter className="mt-4">
                    <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                    <Button
                        onClick={handleCreate}
                        disabled={isPending}
                        variant={type === "team" ? "default" : "secondary"}
                    >
                        {isPending ? "Creating..." : "Create"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
