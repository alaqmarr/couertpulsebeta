"use client";

import { useTransition } from "react";
import { removeMemberAction } from "../team-actions.server";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "react-hot-toast";
import { Loader2, Trash } from "lucide-react";

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

  async function handleRemove(id: string) {
    startTransition(async () => {
      try {
        await removeMemberAction(slug, id);
        toast.success("Member removed");
      } catch (err: any) {
        toast.error(err.message || "Failed to remove member");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Members ({members.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <span className="font-medium">
                    {m.displayName || m.email.split("@")[0]}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    {m.role === "OWNER" ? "(Owner)" : ""}
                  </span>
                </div>
                {isOwner && m.role !== "OWNER" && (
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemove(m.id)}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
