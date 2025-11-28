"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, ExternalLink, Link as LinkIcon, Shield, Users, Trophy, QrCode } from "lucide-react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";

export default function LinksPage() {
    const params = useParams();
    const slug = params?.slug as string;
    const [origin, setOrigin] = useState("");

    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);

    const links = {
        public: [
            {
                title: "Tournament Enrollment",
                description: "Share this link with players to register for the tournament.",
                url: `${origin}/public/${slug}/enroll`,
                icon: <Users className="w-5 h-5 text-blue-500" />,
            },
            {
                title: "Spectator View",
                description: "Public link for live scores and match schedules.",
                url: `${origin}/tournament/${slug}/spectate`, // Assuming this route exists or will exist
                icon: <Trophy className="w-5 h-5 text-yellow-500" />,
            },
        ],
        admin: [
            {
                title: "Tournament Dashboard",
                description: "Main dashboard for tournament management.",
                url: `${origin}/tournament/${slug}`,
                icon: <LinkIcon className="w-5 h-5 text-primary" />,
            },
            {
                title: "Referee Interface",
                description: "Direct link for referees to score matches.",
                url: `${origin}/tournament/${slug}/matches`, // Adjust if needed
                icon: <Shield className="w-5 h-5 text-red-500" />,
            },
            {
                title: "Manage Enrollments",
                description: "Admin page to approve/reject player registrations.",
                url: `${origin}/tournament/${slug}/enrollments`,
                icon: <Users className="w-5 h-5 text-green-500" />,
            },
        ],
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Link copied to clipboard!");
    };

    const LinkCard = ({ item }: { item: any }) => (
        <Card className="glass-card hover:bg-secondary/10 transition-colors">
            <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-secondary/20 rounded-lg shrink-0 mt-1 md:mt-0">
                        {item.icon}
                    </div>
                    <div>
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Input
                            readOnly
                            value={item.url}
                            className="pr-10 bg-secondary/20 font-mono text-xs h-9"
                        />
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(item.url)}
                        className="shrink-0"
                    >
                        <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        asChild
                        className="shrink-0"
                    >
                        <Link href={item.url} target="_blank">
                            <ExternalLink className="w-4 h-4" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    if (!origin) return null; // Prevent hydration mismatch

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <LinkIcon className="w-8 h-8 text-primary" /> Tournament Links
                </h1>
                <p className="text-muted-foreground">
                    Central hub for all shareable links and access points for your tournament.
                </p>
            </div>

            <Tabs defaultValue="public" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="public">Public Links</TabsTrigger>
                    <TabsTrigger value="admin">Admin & Staff</TabsTrigger>
                </TabsList>

                <TabsContent value="public" className="space-y-4">
                    <div className="grid gap-4">
                        {links.public.map((link, index) => (
                            <LinkCard key={index} item={link} />
                        ))}
                    </div>

                    <Card className="glass-card bg-primary/5 border-primary/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <QrCode className="w-5 h-5" /> QR Code for Enrollment
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col md:flex-row gap-6 items-center">
                                <div className="bg-white p-2 rounded-lg">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${origin}/public/${slug}/enroll`)}`}
                                        alt="Enrollment QR"
                                        className="w-32 h-32"
                                    />
                                </div>
                                <div className="space-y-2 text-center md:text-left">
                                    <p className="text-sm text-muted-foreground">
                                        Scan this QR code to directly open the enrollment page on mobile devices.
                                        Great for sharing on posters or screens.
                                    </p>
                                    <Button variant="outline" size="sm" onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${origin}/public/${slug}/enroll`)}`;
                                        link.download = 'tournament-enroll-qr.png';
                                        link.target = '_blank';
                                        link.click();
                                    }}>
                                        Download QR Code
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="admin" className="space-y-4">
                    <div className="grid gap-4">
                        {links.admin.map((link, index) => (
                            <LinkCard key={index} item={link} />
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
