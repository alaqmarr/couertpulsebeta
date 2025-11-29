import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { redirect } from "next/navigation";

export async function ProfileHeader() {
    const user = await getOrCreateUser();
    if (!user) redirect("/sign-in");

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
            name: true,
            email: true,
            image: true,
            eloRating: true
        }
    });

    if (!dbUser) return null;

    return (
        <Card className="glass-card overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary/20 to-secondary/20" />
            <CardContent className="relative pt-0">
                <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-12 px-4">
                    <Avatar className="w-24 h-24 border-4 border-background text-2xl">
                        <AvatarImage src={dbUser.image || undefined} />
                        <AvatarFallback>{dbUser.name?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1 mb-2">
                        <h1 className="text-3xl font-bold">{dbUser.name}</h1>
                        <p className="text-muted-foreground">{dbUser.email}</p>
                    </div>
                    <div className="mb-4 flex gap-2">
                        <Badge variant="secondary" className="text-lg px-4 py-1">
                            {dbUser.eloRating} ELO
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
