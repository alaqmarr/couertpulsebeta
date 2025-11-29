"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Home,
    Settings,
    Package,
    HelpCircle,
    Mail,
    Phone,
    LogOut,
    Trophy,
    ShieldAlert
} from "lucide-react";
import { useClerk } from "@clerk/nextjs";

interface AppSidebarProps {
    showAdmin?: boolean;
}

export function AppSidebar({ showAdmin = false }: AppSidebarProps) {
    const pathname = usePathname();
    const { signOut } = useClerk();

    const links = [
        { href: "/", label: "Home", icon: Home },
        { href: "/trophy-room", label: "Trophy Room", icon: Trophy },
        { href: "/settings", label: "Settings", icon: Settings },
        { href: "/packages", label: "Packages", icon: Package },
        { href: "/help", label: "Support", icon: HelpCircle },
    ];

    if (showAdmin) {
        links.push({ href: "/admin", label: "Admin", icon: ShieldAlert });
    }

    const contactLinks = [
        {
            href: "https://wa.me/+919618443558",
            label: "WhatsApp",
            icon: Phone,
            external: true
        },
        {
            href: "mailto:info@alaqmar.dev",
            label: "Email",
            icon: Mail,
            external: true
        },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 border-r border-white/10 bg-card/50 backdrop-blur-xl h-screen sticky top-0">
            <div className="p-6 border-b border-white/10">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                    CourtPulse
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
                <nav className="space-y-2">
                    <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Menu
                    </p>
                    {links.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link key={link.href} href={link.href}>
                                <Button
                                    variant={isActive ? "secondary" : "ghost"}
                                    className={cn(
                                        "w-full justify-start gap-3",
                                        isActive && "bg-primary/10 text-primary hover:bg-primary/20"
                                    )}
                                >
                                    <link.icon className="w-4 h-4" />
                                    {link.label}
                                </Button>
                            </Link>
                        );
                    })}
                </nav>

                <nav className="space-y-2">
                    <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Contact
                    </p>
                    {contactLinks.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
                            >
                                <link.icon className="w-4 h-4" />
                                {link.label}
                            </Button>
                        </a>
                    ))}
                </nav>
            </div>

            <div className="p-4 border-t border-white/10">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => signOut()}
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </Button>
            </div>
        </aside>
    );
}
