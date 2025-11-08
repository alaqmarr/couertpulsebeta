"use client";

import { useState, useTransition } from "react";
import { addMemberAction } from "../team-actions.server";
import { toast } from "react-hot-toast";

// UI Imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";

// Icon Imports
import { Loader2, UserPlus } from "lucide-react";

export default function AddMemberDrawer({ slug }: { slug: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleAdd() {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    startTransition(async () => {
      try {
        await addMemberAction(slug, email.trim().toLowerCase(), name.trim());
        toast.success("Member added successfully");
        setEmail("");
        setName("");
        setIsOpen(false); // Close the drawer on success
      } catch (err: any) {
        toast.error(err.message || "Failed to add member");
      }
    });
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant="default">
          <UserPlus size={16} className="mr-1.5" />
          Add Member
        </Button>
      </DrawerTrigger>
      
      <DrawerContent className="bg-card/90 backdrop-blur-md border-t border-primary/20">
        <div className="max-w-md mx-auto w-full">
          <DrawerHeader>
            <DrawerTitle>Add a New Team Member</DrawerTitle>
            <DrawerDescription>
              Enter the member's email to invite them. If they don't have an
              account, they can create one.
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Member Name (Optional)</Label>
              <Input
                id="name"
                placeholder="e.g., Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Member Email (Required)</Label>
              <Input
                id="email"
                type="email"
                placeholder="member@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          <DrawerFooter>
            <Button onClick={handleAdd} disabled={isPending}>
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Confirm Add Member"
              )}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" disabled={isPending}>
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}