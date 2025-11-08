"use client"

import { useState, useTransition } from "react"
import { updateDisplayNameAction } from "@/app/settings/settings-actions.server"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "react-hot-toast"

interface Props {
    teamName: string
    currentDisplayName: string | null
    memberId: string
}

export default function UpdateDisplayNameCard({
    teamName,
    currentDisplayName,
    memberId,
}: Props) {
    const [displayName, setDisplayName] = useState(currentDisplayName || "")
    const [isPending, startTransition] = useTransition()

    const handleSave = () => {
        startTransition(async () => {
            try {
                await updateDisplayNameAction(memberId, displayName.trim())
                toast.success("Display name updated successfully.")
            } catch (err: any) {
                toast.error(err.message || "Failed to update display name.")
            }
        })
    }

    return (
        <Card className="border-muted">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">{teamName}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
                <Input
                    placeholder="Enter display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={isPending}
                />
                <Button
                    onClick={handleSave}
                    disabled={isPending || displayName.trim() === currentDisplayName}
                >
                    {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : displayName.trim() === currentDisplayName ? (
                        "In Sync"
                    ) : (
                        "Save"
                    )}
                </Button>
            </CardContent>
        </Card>
    )
}
