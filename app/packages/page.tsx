import { getOrCreateUser } from "@/lib/clerk";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Icons
import {
  Gem, // For page header
  Check, // For features
  Send, // For CTA button
  User, // For Free plan
  Users, // For Team plan
  Trophy, // For Tournament plan
  Zap, // For Pro plan
  Star, // For "Best Value"
} from "lucide-react";
import React from "react";

/* -------------------------------------------------------------------------- */
/* Data Definition (Moved to top for clarity and enhanced with icons) */
/* -------------------------------------------------------------------------- */
const PACKAGES = [
  {
    name: "FREE",
    label: "Free Plan",
    icon: <User size={24} />,
    description: "Basic access for individuals to explore CourtPulse features.",
    price: "₹0",
    features: ["1 Team Slot", "1 Tournament Slot", "Basic Stats Tracking", "Community Support"],
    isFeatured: false,
  },
  {
    name: "TEAM_PACKAGE",
    label: "Team Package",
    icon: <Users size={24} />,
    description: "Perfect for clubs or coaches managing multiple teams.",
    price: "₹499 / month",
    features: [
      "Up to 5 Teams",
      "Unlimited Sessions & Games",
      "Team Analytics Dashboard",
      "Priority Support",
    ],
    isFeatured: false,
  },
  {
    name: "TOURNAMENT_PACKAGE",
    label: "Tournament Package",
    icon: <Trophy size={24} />,
    description: "Run organized tournaments and manage all participants seamlessly.",
    price: "₹799 / month",
    features: [
      "Up to 5 Tournaments",
      "Advanced Bracket Management",
      "Live Leaderboards",
      "Email Notifications",
    ],
    isFeatured: false,
  },
  {
    name: "PRO_PACKAGE",
    label: "Pro Package",
    icon: <Zap size={24} />,
    description: "Everything unlocked for organizations and academies.",
    price: "₹1,499 / month",
    features: [
      "Unlimited Teams & Tournaments",
      "Full Analytics Suite",
      "Custom Branding",
      "24/7 Premium Support",
    ],
    isFeatured: true, // This will be used to highlight the card
  },
];

type Package = (typeof PACKAGES)[0];

/* -------------------------------------------------------------------------- */
/* Main Page Component */
/* -------------------------------------------------------------------------- */
export default async function PackagesPage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const currentPackage = user.packageType ?? "FREE";

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background text-foreground">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        {/* Header */}
        <section className="text-center space-y-3">
          <Gem className="mx-auto text-primary" size={32} />
          <h1 className="text-4xl font-bold tracking-tight">Choose Your Plan</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Upgrade your CourtPulse experience and unlock advanced tools for managing teams and
            tournaments.
          </p>
        </section>

        <Separator className="my-6 bg-border/50" />

        {/* Packages Grid */}
        <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {PACKAGES.map((pkg) => (
            <PackageCard
              key={pkg.name}
              pkg={pkg}
              isActive={pkg.name === currentPackage}
              userEmail={user.email ?? ""}
            />
          ))}
        </div>

        {/* Footer */}
        <section className="text-center text-sm text-muted-foreground mt-10">
          <Card className="max-w-md mx-auto p-4 bg-card/70 backdrop-blur-sm border-primary/10">
            <CardContent className="p-0">
              <p>
                Secure payments and personalized setup are handled directly via WhatsApp for now.
              </p>
              <p className="font-medium">Automated billing and in-app upgrades are coming soon!</p>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Package Card Sub-component */
/* -------------------------------------------------------------------------- */
function PackageCard({
  pkg,
  isActive,
  userEmail,
}: {
  pkg: Package;
  isActive: boolean;
  userEmail: string;
}) {
  // Pre-filled WhatsApp message
  const waMessage = encodeURIComponent(
    `Hello! I’m interested in purchasing the *${pkg.label}* plan on CourtPulse.\n\n` +
    `My registered email is: ${userEmail}\n` +
    `Please assist me with the activation.`
  );
  const waUrl = `https://wa.me/919618443558?text=${waMessage}`;

  return (
    <Card
      className={`relative flex flex-col justify-between rounded-xl border bg-card/70 backdrop-blur-sm transition-all duration-300
        ${isActive
          ? "border-primary/50 ring-2 ring-primary/50 shadow-lg shadow-primary/10 -translate-y-1" // Active state is "permanently" lifted
          : "border-primary/10 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10" // Inactive hover state
        }
        ${pkg.isFeatured && !isActive
          ? "shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30" // Featured (Pro) glow
          : ""
        }
      `}
    >
      {/* Featured Badge */}
      {pkg.isFeatured && (
        <Badge
          variant="default"
          className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-amber-foreground hover:bg-amber-500 glass-badge-warning"
        >
          <Star size={12} className="mr-1" />
          Best Value
        </Badge>
      )}

      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <span className={pkg.isFeatured ? "text-amber-500" : "text-primary"}>{pkg.icon}</span>
          {isActive && <Badge variant="secondary" className="glass-badge-success">Current Plan</Badge>}
        </div>
        <CardTitle>{pkg.label}</CardTitle>
        <CardDescription>{pkg.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col justify-between flex-grow gap-4">
        <div className="space-y-4">
          <p className="text-3xl font-semibold">{pkg.price}</p>
          <ul className="text-sm text-muted-foreground space-y-2">
            {pkg.features.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check size={16} className="text-green-500" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA Button */}
        <div className="mt-4">
          {!isActive && (
            <Button
              className="w-full group glass-btn-primary"
              variant={pkg.isFeatured ? "default" : "secondary"}
              asChild
            >
              <Link href={waUrl} target="_blank">
                <Send size={16} className="mr-2 transition-transform group-hover:scale-110" />
                Purchase via WhatsApp
              </Link>
            </Button>
          )}
          {isActive && (
            <Button className="w-full glass-btn-secondary" variant="outline" disabled>
              <Check size={16} className="mr-2" />
              Active Plan
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}