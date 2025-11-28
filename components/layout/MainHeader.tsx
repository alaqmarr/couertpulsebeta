// components/layout/MainHeader.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { HelpCircle, Shield } from "lucide-react"; // Using Shield as a placeholder
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function MainHeader() {
  return (
    <motion.header
      className="sticky top-0 z-50 w-full border-b border-primary/10 bg-card/70 backdrop-blur-sm"
      // Animation for a smooth load-in
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center">

          {/* Left Spacer (to help center the logo) */}
          <div className="flex-1" />

          {/* Centered Logo */}
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2 group"
            >
              {/* Replace Shield with your <Image /> logo if you have one */}

              <Image src={'/logo.png'} alt="CourtPulse Logo" width={160} height={40} />
            </Link>
          </div>

          {/* Right Icon */}
          <div className="flex-1 flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="text-muted-foreground hover:text-primary"
            >
              <Link href="/help">
                <HelpCircle className="h-5 w-5" />
                <span className="sr-only">Help Center</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}