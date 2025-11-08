import { getOrCreateUser } from "@/lib/clerk";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const PACKAGES = [
  {
    name: "FREE",
    label: "Free Plan",
    description: "Basic access for individuals to explore CourtPulse features.",
    price: "₹0",
    features: [
      "1 Team Slot",
      "1 Tournament Slot",
      "Basic Stats Tracking",
      "Community Support",
    ],
  },
  {
    name: "TEAM_PACKAGE",
    label: "Team Package",
    description: "Perfect for clubs or coaches managing multiple teams.",
    price: "₹499 / month",
    features: [
      "Up to 5 Teams",
      "Unlimited Sessions & Games",
      "Team Analytics Dashboard",
      "Priority Support",
    ],
  },
  {
    name: "TOURNAMENT_PACKAGE",
    label: "Tournament Package",
    description: "Run organized tournaments and manage all participants seamlessly.",
    price: "₹799 / month",
    features: [
      "Up to 5 Tournaments",
      "Advanced Bracket Management",
      "Live Leaderboards",
      "Email Notifications",
    ],
  },
  {
    name: "PRO_PACKAGE",
    label: "Pro Package",
    description: "Everything unlocked for organizations and academies.",
    price: "₹1,499 / month",
    features: [
      "Unlimited Teams & Tournaments",
      "Full Analytics Suite",
      "Custom Branding",
      "24/7 Premium Support",
    ],
  },
];

export default async function PackagesPage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const currentPackage = user.packageType ?? "FREE";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto p-8 space-y-10">
        {/* Header */}
        <section className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Choose Your Plan</h1>
          <p className="text-muted-foreground text-sm">
            Upgrade your CourtPulse experience and unlock advanced tools for managing teams and tournaments.
          </p>
        </section>

        <Separator className="my-6" />

        {/* Packages Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PACKAGES.map((pkg) => {
            const isActive = pkg.name === currentPackage;

            // Pre-filled WhatsApp message
            const waMessage = encodeURIComponent(
              `Hello! I’m interested in purchasing the *${pkg.label}* plan on CourtPulse.\n\n` +
                `My registered email is: ${user.email}\n` +
                `Please assist me with the activation.`
            );
            const waUrl = `https://wa.me/919618443558?text=${waMessage}`;

            return (
              <Card
                key={pkg.name}
                className={`relative flex flex-col justify-between border rounded-xl transition ${
                  isActive ? "ring-2 ring-primary" : "hover:shadow-lg"
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{pkg.label}</CardTitle>
                    {isActive && <Badge variant="default">Current</Badge>}
                  </div>
                  <CardDescription>{pkg.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <p className="text-2xl font-semibold">{pkg.price}</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {pkg.features.map((f) => (
                      <li key={f}>• {f}</li>
                    ))}
                  </ul>
                  {!isActive && (
                    <Link href={waUrl} target="_blank">
                      <Button className="w-full mt-3" variant="default">
                        Purchase via WhatsApp
                      </Button>
                    </Link>
                  )}
                  {isActive && (
                    <Button className="w-full mt-3" variant="secondary" disabled>
                      Active Plan
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <section className="text-center text-xs text-muted-foreground mt-10">
          Secure payments and personalized setup are handled directly via WhatsApp for now.
          <br />
          Automated billing and in-app upgrades are coming soon.
        </section>
      </div>
    </main>
  );
}
