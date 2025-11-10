// components/layout/MainFooter.tsx
import Image from "next/image";

export default function MainFooter() {
    return (
        <footer className="w-full border-t border-primary/10 bg-background/50">
            {/* Increased vertical padding (py-12) for a more "spacious" feel 
      */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/*
          - flex-col: Stacks children vertically
          - items-center: Centers the stack horizontally
          - gap-4: Adds space between each child (Logo, Copyright, Made with)
        */}
                <div className="flex flex-col items-center justify-center gap-4">

                    {/* 1. Logo (at the top) */}
                    <Image
                        src={"/logo.png"}
                        alt="CourtPulse Logo"
                        width={120}
                        height={24}
                    />

                    {/* 2. Copyright text */}
                    <p className="text-xs text-muted-foreground tracking-wide text-center">
                        © {new Date().getFullYear()} CourtPulse Analytics. All rights
                        reserved.
                    </p>

                    {/* 3. "Made with" text, now separate and with a link */}
                    <p className="text-xs text-muted-foreground tracking-wide text-center">
                        Built with ❤️ by{" "}
                        <a
                            href="https://alaqmar.dev"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary hover:underline"
                        >
                            alaqmar.dev
                        </a>
                    </p>

                </div>
            </div>
        </footer>
    );
}