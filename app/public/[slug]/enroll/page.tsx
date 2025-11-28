import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import EnrollmentForm from "./enrollment-form";

export default async function EnrollmentPageWrapper({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    const tournament = await prisma.tournament.findUnique({
        where: { slug },
    });

    if (!tournament) notFound();

    return <EnrollmentForm params={{ slug }} tournament={tournament} />;
}
