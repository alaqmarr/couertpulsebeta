"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { HelpCircle, Menu, Home, Settings, Package, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export default function MainHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/packages", label: "Packages", icon: Package },
    { href: "/help", label: "Support", icon: HelpCircle },
  ];

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
    <motion.header
      className="sticky top-0 z-50 w-full border-b border-primary/10 bg-card/70 backdrop-blur-sm"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center">

          {/* Mobile Menu Trigger */}
          <div className="md:hidden mr-4">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 bg-card/95 backdrop-blur-xl border-r border-white/10">
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
                        <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}>
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
                        onClick={() => setIsOpen(false)}
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
              </SheetContent>
            </Sheet>
          </div>

          {/* Left Spacer (Desktop) */}
          <div className="hidden md:block flex-1" />

          {/* Centered Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <Image
                src={"/logo.png"}
                alt="CourtPulse Logo"
                width={160}
                height={40}
              />
            </Link>
          </div>

          {/* Right Icons */}
          <div className="flex-1 flex justify-end items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="text-muted-foreground hover:text-primary hidden md:inline-flex"
            >
              <Link href="/help">
                <HelpCircle className="h-5 w-5" />
                <span className="sr-only">Help Center</span>
              </Link>
            </Button>

            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton
                afterSignOutUrl="/"
                userProfileMode="navigation"
                userProfileUrl="/profile"
              />
            </SignedIn>
          </div>
        </div>
      </div>
    </motion.header>
  );
}