"use client";

import { Card, CardContent } from "@/components/ui/card";

export function LoadingCard({ title }: { title?: string }) {
  return (
    <Card className="w-full border-muted shadow-sm bg-background/70 animate-pulse">
      <CardContent className="flex flex-col items-center justify-center py-12 space-y-6">
        {/* Circular Spinner */}
        <div className="relative">
          <div className="w-12 h-12 border-4 border-muted rounded-full border-t-primary animate-spin" />
        </div>

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
