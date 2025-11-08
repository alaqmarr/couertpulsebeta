"use client";

import { useState, useTransition } from "react";
import { removeMemberAction } from "../team-actions.server";
import { toast } from "react-hot-toast";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, Trash, Users, Info } from "lucide-react";

export default function MemberList({
  members,
  slug,
  isOwner,
}: {
  members: any[];
  slug: string;
  isOwner: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  // State to manage which member is being targeted for removal
  const [memberToRemove, setMemberToRemove] = useState<any | null>(null);

  async function handleRemove() {
    if (!memberToRemove) return;

    startTransition(async () => {
      try {
        await removeMemberAction(slug, memberToRemove.id);
        toast.success(
          `Member ${memberToRemove.displayName || memberToRemove.email} removed`
        );
        setMemberToRemove(null); // Close the dialog
      } catch (err: any) {
        toast.error(err.message || "Failed to remove member");
      }
    });
  }

  return (
    <Card className="bg-card/70 backdrop-blur-sm border border-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users size={18} />
          Members ({members.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-primary/20 rounded-lg bg-muted/50">
            <Info size={24} className="text-primary" />
            <p className="text-muted-foreground text-sm">No members yet.</p>
          </div>
        ) : (
          <AlertDialog>
            <ul className="divide-y divide-border/50">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <div>
                    <span className="font-medium">
                      {m.displayName || m.email.split("@")[0]}
                    </span>
                    {m.role === "OWNER" && (
                      <Badge variant="secondary" className="ml-2">
                        Owner
                      </Badge>
                    )}
                  </div>
                  {isOwner && m.role !== "OWNER" && (
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-400"
                        onClick={() => setMemberToRemove(m)}
                        disabled={isPending}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                  )}
                </li>
              ))}
            </ul>

            {/* --- Confirmation Dialog --- */}
            <AlertDialogContent className="bg-card/90 backdrop-blur-md border border-primary/20">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove{" "}
                  <span className="font-semibold text-foreground">
                    {memberToRemove?.displayName || memberToRemove?.email}
                  </span>{" "}
                  from the team.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel asChild>
                  <Button
                    variant="outline"
                    onClick={() => setMemberToRemove(null)}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button
                    variant="destructive"
                    onClick={handleRemove}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Remove Member"
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