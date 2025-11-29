import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shirt } from "lucide-react";
import { createTournamentTeamAction } from "@/app/tournament/tournament.server";
import { FormImageUpload } from "@/components/ui/form-image-upload";

export function CreateTeamForm({ slug }: { slug: string }) {
    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Shirt className="w-5 h-5 text-primary" /> Create Team
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form action={createTournamentTeamAction} className="space-y-4">
                    <input type="hidden" name="slug" value={slug} />
                    <div className="space-y-2">
                        <Label htmlFor="name">Team Name</Label>
                        <Input id="name" name="name" placeholder="e.g. Thunderbolts" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="color">Team Color</Label>
                        <div className="flex gap-2">
                            <Input id="color" name="color" type="color" className="w-12 h-10 p-1" defaultValue="#3b82f6" />
                            <Input name="colorHex" placeholder="#3b82f6" className="flex-1" readOnly />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Team Logo</Label>
                        <FormImageUpload
                            name="logoUrl"
                            defaultValue=""
                        />
                    </div>
                    <Button type="submit" className="w-full">Create Team</Button>
                </form>
            </CardContent>
        </Card>
    );
}
