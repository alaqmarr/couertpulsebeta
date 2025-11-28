"use client";

import { Button } from "@/components/ui/button";
import { Share2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";

export default function ShareSpectatorLink({ slug }: { slug: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const url = `${window.location.origin}/spectate/${slug}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Spectator link copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
                <Check className="w-4 h-4 mr-1.5 text-green-500" />
            ) : (
                <Share2 className="w-4 h-4 mr-1.5" />
            )}
            {copied ? "Copied" : "Share Live Link"}
        </Button>
    );
}
