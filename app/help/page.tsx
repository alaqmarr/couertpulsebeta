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
        <main className="min-h-screen bg-background text-foreground">
            <div className="max-w-6xl mx-auto p-8 lg:p-12 space-y-12">
                {/* ---------------- HEADER ---------------- */}
                <section className="space-y-3">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2.5">
                        <HelpCircle className="w-7 h-7 text-primary" />
                        Help & Support
                    </h1>
                    <p className="text-muted-foreground max-w-2xl">
                        Find answers to common questions, or contact our support team for
                        further assistance.
                    </p>
                </section>

                <Separator />

                {/* ---------------- MAIN GRID (FAQ | CONTACT) ---------------- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-16 gap-y-10">

                    {/* ---------------- FAQ SECTION (MAIN COL) ---------------- */}
                    <section className="lg:col-span-2">
                        <h2 className="text-2xl font-semibold mb-6">
                            Frequently Asked Questions
                        </h2>
                        <Accordion type="single" collapsible className="w-full space-y-2">
                            {faqs.map((faq) => (
                                <AccordionItem
                                    value={faq.question}
                                    key={faq.question}
                                    className="border border-primary/10 bg-card/70 backdrop-blur-sm rounded-lg px-4"
                                >
                                    <AccordionTrigger className="text-base font-medium text-left hover:no-underline">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed pt-2 pb-4">
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </section>

                    {/* ---------------- CONTACT OPTIONS (SIDEBAR) ---------------- */}
                    <section className="lg:col-span-1">
                        <h2 className="text-2xl font-semibold mb-6">Contact Us</h2>
                        <div className="space-y-4">
                            {contacts.map((c) => (
                                <Link
                                    href={c.link}
                                    key={c.title}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                >
                                    <Card className="hover:-translate-y-1 hover:shadow-lg transition-transform border-primary/10 bg-card/70 backdrop-blur-sm">
                                        <div className="p-4 flex flex-row items-start gap-4">
                                            <c.icon className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                                            <div className="space-y-0.5">
                                                <p className="font-semibold text-card-foreground">
                                                    {c.title}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {c.description}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </section>
                </div>

                {/* ---------------- FOOTER ---------------- */}
                <Separator />
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