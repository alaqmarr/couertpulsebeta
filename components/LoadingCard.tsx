"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react"; // Use the consistent loader icon

export function LoadingCard({ title }: { title?: string }) {
    return (
        <Card className="w-full bg-card/70 backdrop-blur-sm border border-primary/10">
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-6">

                {/* Consistent Spinner */}
                <Loader2 className="w-10 h-10 text-primary animate-spin" />

                {/* Dynamic Title */}
                <div className="text-center">
                    <p className="text-base font-medium text-foreground/80">
                        {title || "Loading..."}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Please wait while we fetch fresh data
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}