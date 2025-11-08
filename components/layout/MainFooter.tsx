// components/layout/MainFooter.tsx
import { Shield } from "lucide-react";
import Image from "next/image";

export default function MainFooter() {
    return (
        <footer className="w-full border-t border-primary/10 bg-background/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Image src={'/logo.png'} alt="CourtPulse Logo" width={120} height={24} />
                    </div>
                    <p className="text-xs text-muted-foreground tracking-wide">
                        © {new Date().getFullYear()} CourtPulse Analytics. All rights
                        reserved.<br />Built with ❤️ by alaqmar.dev.
                    </p>
                </div>
            </div>
        </footer>
    );
}