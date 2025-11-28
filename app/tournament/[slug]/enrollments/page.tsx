import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Eye, Shield, Search } from "lucide-react";
import { approveEnrollmentAction } from "../../tournament.server";
import { EnrollmentList } from "./EnrollmentList";

export default async function AdminEnrollmentsPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const user = await getOrCreateUser();
    if (!user) redirect("/sign-in");

    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: {
            members: true,
            enrollments: {
                orderBy: { createdAt: "desc" }
            }
        },
    });

    if (!tournament) notFound();

    // Verify Manager/Owner Access
    const currentUserMember = tournament.members.find(m => m.userId === user.id);
    const isOwner = tournament.ownerId === user.id;
    const isManager = currentUserMember?.role === "MANAGER" || currentUserMember?.role === "CO_OWNER";

    if (!isManager && !isOwner) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <Shield className="w-12 h-12 text-destructive" />
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">You do not have permission to view enrollments.</p>
            </div>
        );
    }

    const pendingEnrollments = tournament.enrollments.filter(e => e.status === "PENDING");
    const approvedEnrollments = tournament.enrollments.filter(e => e.status === "APPROVED");
    const rejectedEnrollments = tournament.enrollments.filter(e => e.status === "REJECTED");

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Enrollment Requests</h1>
                    <p className="text-muted-foreground">Manage and approve player registrations.</p>
                </div>
            </div>

            <EnrollmentList
                slug={slug}
                pendingEnrollments={pendingEnrollments}
                approvedEnrollments={approvedEnrollments}
                rejectedEnrollments={rejectedEnrollments}
            />
        </div>
    );
}
