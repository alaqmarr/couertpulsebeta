import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Mail, MessageCircle, LifeBuoy, HelpCircle } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default function HelpPage() {
    const faqs = [
        {
            question: "How do I create a team?",
            answer:
                "Go to the Teams page, click 'Create Team', enter your team name, and invite members by email. Only verified users can join your team.",
        },
        {
            question: "How do sessions work?",
            answer:
                "Sessions let you record and manage multiple matches under a specific event or day. Each session can have several games with player participation tracking and automated leaderboards.",
        },
        {
            question: "How is the leaderboard calculated?",
            answer:
                "Leaderboards are computed dynamically from recorded games — each win contributes to your player’s win rate and the team’s overall statistics.",
        },
        {
            question: "Can I edit game results after marking winners?",
            answer:
                "No. Once a game winner is set, the match is locked to preserve data integrity. If you made an error, delete the game and recreate it with correct results.",
        },
        {
            question: "Why can't I see other teams’ stats?",
            answer:
                "Only public teams have visible stats pages. Private teams restrict leaderboard and player data visibility to members only.",
        },
    ]

    const contacts = [
        {
            title: "Email Support",
            description: "Get assistance for issues, bugs, or billing.",
            icon: Mail,
            link: "mailto:support@courtpulse.app",
        },
        {
            title: "Chat on WhatsApp",
            description: "Speak with our support staff directly.",
            icon: MessageCircle,
            link: "https://wa.me/+919618443558",
        },
        {
            title: "Documentation",
            description: "Explore feature guides, setup help, and developer notes.",
            icon: LifeBuoy,
            link: "#", // replace later with docs URL
        },
    ]

    return (
        <main className="min-h-screen text-foreground p-4 md:p-8">
            <div className="max-w-5xl mx-auto glass-panel rounded-xl p-6 md:p-10 space-y-10">
                {/* ---------------- HEADER ---------------- */}
                <section className="space-y-3 text-center md:text-left">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center md:justify-start gap-2.5">
                        <HelpCircle className="w-7 h-7 text-primary" />
                        Help & Support
                    </h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto md:mx-0">
                        Find answers to common questions, or contact our support team for
                        further assistance.
                    </p>
                </section>

                <Separator className="bg-white/10" />

                {/* ---------------- MAIN GRID (FAQ | CONTACT) ---------------- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-12 gap-y-10">

                    {/* ---------------- FAQ SECTION (MAIN COL) ---------------- */}
                    <section className="lg:col-span-2">
                        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                            <LifeBuoy className="w-5 h-5 text-primary" />
                            Frequently Asked Questions
                        </h2>
                        <Accordion type="single" collapsible className="w-full space-y-3">
                            {faqs.map((faq) => (
                                <AccordionItem
                                    value={faq.question}
                                    key={faq.question}
                                    className="glass-card rounded-lg px-4 border-none"
                                >
                                    <AccordionTrigger className="text-base font-medium text-left hover:no-underline py-4">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </section>

                    {/* ---------------- CONTACT OPTIONS (SIDEBAR) ---------------- */}
                    <section className="lg:col-span-1">
                        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-primary" />
                            Contact Us
                        </h2>
                        <div className="space-y-4">
                            {contacts.map((c) => (
                                <Link
                                    href={c.link}
                                    key={c.title}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                >
                                    <div className="glass-card rounded-lg p-4 flex flex-row items-start gap-4 hover:scale-[1.02] transition-transform cursor-pointer">
                                        <c.icon className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                                        <div className="space-y-1">
                                            <p className="font-semibold text-foreground">
                                                {c.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {c.description}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                </div>

                {/* ---------------- FOOTER ---------------- */}
                <Separator className="bg-white/10" />
                <section className="text-center text-xs text-muted-foreground">
                    <p>
                        CourtPulse © {new Date().getFullYear()} · Built with precision for
                        badminton analytics.
                    </p>
                </section>
            </div>
        </main>
    )
}