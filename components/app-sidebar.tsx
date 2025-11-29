import { Calendar, Home, Inbox, LogInIcon, Package2Icon, Search, Settings, UserPlus2Icon, Trophy, Activity, Server } from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { getOrCreateUser } from "@/lib/clerk";

const publicItems = [
    { title: "Sign in", icon: LogInIcon, url: "/sign-in" },
    { title: "Sign up", icon: UserPlus2Icon, url: "/sign-up" },
]

const loginItems = [
    { title: "Home", icon: Home, url: "/" },
    { title: "Achievements", icon: Trophy, url: "/achievements" },
    { title: "Trophy Room", icon: Activity, url: "/trophy-room" },
    { title: "Settings", icon: Settings, url: "/settings" },
    { title: "Packages", icon: Package2Icon, url: "/packages" },
    { title: "System Status", icon: Server, url: "/system/status" },
]



export async function AppSidebar() {

    const user = await getOrCreateUser();
    const items = user ? loginItems : publicItems;
    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>
                        <h2 className="text-lg font-semibold">CourtPulse</h2>
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <a href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}