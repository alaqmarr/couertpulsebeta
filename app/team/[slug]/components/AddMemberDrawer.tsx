"use client";

import { useState, useTransition } from "react";
import { addMemberAction } from "../team-actions.server";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";

export default function AddMemberDrawer({ slug }: { slug: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleAdd() {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    startTransition(async () => {
      try {
        await addMemberAction(slug, email.trim().toLowerCase(), name);
        toast.success("Member added successfully");
        setEmail("");
        setName("");
      } catch (err: any) {
        toast.error(err.message || "Failed to add member");
      }
    });
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      <Input
        placeholder="Member name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={isPending}
        className="sm:w-48"
      />
      <Input
        placeholder="Member email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isPending}
        className="sm:w-56"
      />
      <Button
        onClick={handleAdd}
        disabled={isPending}
        className="whitespace-nowrap"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Member"}
      </Button>
    </div>
  );
}
