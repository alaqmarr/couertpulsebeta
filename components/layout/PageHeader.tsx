// components/layout/PageHeader.tsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils"; // Assuming you have this from shadcn

interface PageHeaderProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  /** Pass buttons or other elements to the right side */
  children?: React.ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  icon,
  children,
  className,
}: PageHeaderProps) {
  return (
    <Card
      className={cn(
        "bg-card/70 backdrop-blur-sm border border-primary/10 shadow-lg",
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              {/* This clones your icon and applies consistent styling */}
              {React.isValidElement(icon) &&
                React.cloneElement(icon, {
                  className: "h-7 w-7 text-primary",
                } as any)}
              {title}
            </h1>
            <p className="text-muted-foreground mt-1 ml-10">{subtitle}</p>
          </div>

          {/* This is where you can pass buttons, e.g., <AddMemberDrawer /> */}
          {children && <div>{children}</div>}
        </div>
      </CardContent>
    </Card>
  );
}