"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { PlayerPrivacySettings } from "@/lib/player-privacy";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export function PrivacySettingsCard({ initialSettings }: { initialSettings: PlayerPrivacySettings }) {
    const [settings, setSettings] = useState(initialSettings);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    const handleToggle = (key: keyof PlayerPrivacySettings) => {
        setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch("/api/player/privacy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });

            if (!response.ok) throw new Error("Failed to save");

            toast.success("Privacy settings updated!");
            router.refresh();
        } catch (error) {
            toast.error("Failed to save privacy settings");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>
                    Control what information is visible on your public profile
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label htmlFor="showProfile">Public Profile</Label>
                        <p className="text-sm text-muted-foreground">
                            Make your profile visible to everyone
                        </p>
                    </div>
                    <Switch
                        id="showProfile"
                        checked={settings.showProfile}
                        onCheckedChange={() => handleToggle("showProfile")}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label htmlFor="showStats">Show Statistics</Label>
                        <p className="text-sm text-muted-foreground">
                            Display your match stats and rankings
                        </p>
                    </div>
                    <Switch
                        id="showStats"
                        checked={settings.showStats}
                        onCheckedChange={() => handleToggle("showStats")}
                        disabled={!settings.showProfile}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label htmlFor="showAchievements">Show Achievements</Label>
                        <p className="text-sm text-muted-foreground">
                            Display your unlocked achievements
                        </p>
                    </div>
                    <Switch
                        id="showAchievements"
                        checked={settings.showAchievements}
                        onCheckedChange={() => handleToggle("showAchievements")}
                        disabled={!settings.showProfile}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label htmlFor="showMatchHistory">Show Match History</Label>
                        <p className="text-sm text-muted-foreground">
                            Display your recent matches
                        </p>
                    </div>
                    <Switch
                        id="showMatchHistory"
                        checked={settings.showMatchHistory}
                        onCheckedChange={() => handleToggle("showMatchHistory")}
                        disabled={!settings.showProfile}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label htmlFor="showBio">Show Bio</Label>
                        <p className="text-sm text-muted-foreground">
                            Display your profile description
                        </p>
                    </div>
                    <Switch
                        id="showBio"
                        checked={settings.showBio}
                        onCheckedChange={() => handleToggle("showBio")}
                        disabled={!settings.showProfile}
                    />
                </div>

                <Button onClick={handleSave} disabled={saving} className="w-full">
                    {saving ? "Saving..." : "Save Changes"}
                </Button>
            </CardContent>
        </Card>
    );
}
