import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { Shield } from "lucide-react";
import { EnrollmentList } from "../EnrollmentList";

export async function EnrollmentsContent({ slug }: { slug: string }) {
    const user = await getOrCreateUser();
    if (!user) return null;

    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: {
            members: true,
            enrollments: {
                orderBy: { createdAt: "desc" }
            }
        },
    });

    if (!tournament) return null;

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
        <EnrollmentList
            slug={slug}
            pendingEnrollments={pendingEnrollments}
            approvedEnrollments={approvedEnrollments}
            rejectedEnrollments={rejectedEnrollments}
        />
    );
}
