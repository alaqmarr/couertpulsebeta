// components/dashboard/UpcomingSessionCard.tsx
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, History, Info, Users, Bell } from "lucide-react"
import Link from "next/link"
import { formatInTimeZone } from "date-fns-tz"

// Define the type for the session prop
type SessionData = {
    id: string
    name: string | null
    slug: string | null
    date: Date
    team: {
        name: string
        slug: string
    }
} | null

// This is the new prop type for the component
export type SessionInfo = {
    session: SessionData
    isUpcoming: boolean
}

export function UpcomingSessionCard({ sessionInfo }: { sessionInfo: SessionInfo }) {
    const { session, isUpcoming } = sessionInfo
    const timeZone = "Asia/Kolkata"

    // STATE 1: No Session Found (Upcoming or Past)
    if (!session) {
        return (
            <Alert className="border-primary/10 bg-card/70 backdrop-blur-sm">
                <Calendar className="h-5 w-5" />
                <AlertTitle className="font-semibold">No Sessions</AlertTitle>
                <AlertDescription className="text-muted-foreground">
                    You don't have any upcoming or recent sessions.
                    <Button size="sm" variant="link" asChild className="p-0 ml-1">
                        <Link href="#">Create a new session?</Link>
                    </Button>
                </AlertDescription>
            </Alert>
        )
    }

    // STATE 2: Upcoming or Recent Session
    return (
        <Alert className="border-primary/20 bg-card/90 backdrop-blur-sm shadow-lg">
            {isUpcoming ? (
                <Bell className="h-5 w-5 text-primary" />
            ) : (
                <History className="h-5 w-5 text-muted-foreground" />
            )}

            <AlertTitle className={`font-semibold ${isUpcoming ? 'text-primary' : ''}`}>
                {isUpcoming ? "Upcoming Session" : "Most Recent Session"}
            </AlertTitle>

            <AlertDescription>
                <div className="space-y-4 mt-2">
                    {/* Time and Date */}
                    <div>
                        <p className="text-2xl font-bold text-card-foreground">
                            {formatInTimeZone(session.date, timeZone, "eeee, d MMM yyyy")}
                        </p>
                    </div>

                    {/* Session and Team Info */}
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <span className="font-medium text-card-foreground truncate">
                                {session.name || "General Session"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <span className="font-medium text-primary hover:underline">
                                <Link href={`/team/${session.team.slug}`}>
                                    {session.team.name}
                                </Link>
                            </span>
                        </div>
                    </div>

                    {/* Action Button */}
                    <Button
                        asChild
                        className="w-full"
                        variant={isUpcoming ? "default" : "secondary"}
                        size="sm"
                    >
                        <Link href={`/team/${session.team.slug}/session/${session.slug}`}>
                            <Clock className="mr-2 h-4 w-4" />
                            View Session Details
                        </Link>
                    </Button>
                </div>
            </AlertDescription>
        </Alert>
    )
}