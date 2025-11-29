"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
    Trophy,
    Gavel,
    Calendar,
    Settings,
    Users,
    LayoutDashboard,
    Link as LinkIcon,
    Menu,
    ClipboardList,
    BarChart3,
    Eye,
    Image as ImageIcon
} from "lucide-react";
import { useState } from "react";

interface TournamentSidebarProps {
    slug: string;
    tournamentName: string;
    isManager: boolean;
    teamId?: string;
}

export function TournamentSidebar({ slug, tournamentName, isManager, teamId }: TournamentSidebarProps) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const links = [
        {
            href: `/tournament/${slug}`,
            label: "Dashboard",
            icon: LayoutDashboard,
            exact: true
        },
        {
            href: `/tournament/${slug}/enrollments`,
            label: "Enrollments",
            icon: ClipboardList,
            exact: false
        },
        {
            href: `/tournament/${slug}/analytics`,
            label: "Analytics",
            icon: BarChart3,
            exact: false
        },
        {
            href: `/tournament/${slug}#standings`,
            label: "Standings",
            icon: Trophy,
            exact: false
        },
        {
            href: `/tournament/${slug}/auction`,
            label: "Auction",
            icon: Gavel,
            exact: false
        },
        {
            href: `/tournament/${slug}/schedule`,
            label: "Schedule",
            icon: Calendar,
            exact: false
        },
        {
            href: `/tournament/${slug}/teams`,
            label: "Teams & Players",
            icon: Users,
            exact: false
        },
        {
            href: `/tournament/${slug}/links`,
            label: "Links",
            icon: LinkIcon,
            exact: false
        },
    ];

    if (teamId) {
        links.push({
            href: `/tournament/${slug}/team/${teamId}`,
            label: "My Team",
            icon: Trophy,
            exact: false
        });
    }

    if (isManager) {
        links.push({
            href: `/tournament/${slug}/check-in`,
            label: "Check-in",
            icon: ClipboardList,
            exact: false
        });

        links.push({
            href: `/tournament/${slug}/settings`,
            label: "Settings",
            icon: Settings,
            exact: false
        });
    }

    // Add Public Links
    links.push({
        href: `/tournament/${slug}/gallery`,
        label: "Gallery",
        icon: ImageIcon,
        exact: false
    });

    links.push({
        href: `/tournament/${slug}/spectate`,
        label: "Spectate",
        icon: Eye,
        exact: false
    });

    const NavContent = () => (
        <nav className="space-y-1">
            {links.map((link) => {
                const isActive = link.exact
                    ? pathname === link.href
                    : pathname.startsWith(link.href);

                return (
                    <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                        <Button
                            variant={isActive ? "secondary" : "ghost"}
                            className={`w-full justify-start gap-2 ${isActive ? "font-semibold" : ""}`}
                        >
                            <link.icon size={18} /> {link.label}
                        </Button>
                    </Link>
                );
            })}
        </nav>
    );

    return (
        <>
            {/* Mobile Trigger */}
            <div className="md:hidden p-4 border-b flex items-center gap-4 bg-background sticky top-0 z-10">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="w-6 h-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64 p-0">
                        <SheetHeader className="p-4 border-b text-left">
                            <SheetTitle className="flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-primary" />
                                <span className="truncate">{tournamentName}</span>
                            </SheetTitle>
                        </SheetHeader>
                        <div className="p-4">
                            <NavContent />
                        </div>
                    </SheetContent>
                </Sheet>
                <span className="font-semibold truncate">{tournamentName}</span>
            </div>

            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-64 bg-muted/30 border-r border-white/5 p-4 space-y-6 h-screen sticky top-0 overflow-y-auto">
                <div className="flex items-center gap-2 px-2">
                    <Trophy className="w-6 h-6 text-primary" />
                    <span className="font-bold truncate">{tournamentName}</span>
                </div>
                <NavContent />
            </aside>
        </>
    );
}
