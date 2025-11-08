"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, RefreshCcw } from "lucide-react";
import { syncUserNameAction } from "@/app/settings/actions/user-actions.server";
import { toast } from "react-hot-toast";

interface SyncNameButtonProps {
  isSynced: boolean;
}

export default function SyncNameButton({ isSynced }: SyncNameButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [synced, setSynced] = useState(isSynced);
  const [label, setLabel] = useState(isSynced ? "In Sync" : "Sync Name");

  async function handleSync() {
    if (synced) return;
    startTransition(async () => {
      try {
        setLabel("Syncing...");
        const result = await syncUserNameAction();

        if (result.updated) {
          setSynced(true);
          setLabel("Synced");
          toast.success(`Name synced & propagated: ${result.name}`);
        } else {
          setLabel("Already in Sync");
          toast("Your name is already up to date");
        }
      } catch (err: any) {
        setLabel("Retry Sync");
        toast.error(err.message || "Failed to sync name");
      }
    });
  }

  const baseClass =
    "relative flex items-center justify-center min-w-[150px] h-10 rounded-md text-sm font-medium transition-all";

  const variants = {
    idle: "bg-primary text-primary-foreground hover:bg-primary/90",
    loading: "bg-muted text-muted-foreground cursor-wait",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
  };

  const variant =
    isPending ? variants.loading : synced ? variants.success : variants.idle;

  return (
    <Button
      disabled={isPending || synced}
      onClick={handleSync}
      className={`${baseClass} ${variant}`}
    >
      {isPending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {label}
        </>
      ) : synced ? (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          {label}
        </>
      ) : (
        <>
          <RefreshCcw className="w-4 h-4 mr-2" />
          {label}
        </>
      )}
    </Button>
  );
}
