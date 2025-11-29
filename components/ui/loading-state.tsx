import { Loader2 } from "lucide-react";

interface LoadingStateProps {
    title?: string;
    message?: string;
    className?: string;
}

export function LoadingState({
    title = "Loading...",
    message,
    className = ""
}: LoadingStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center p-8 space-y-4 min-h-[200px] w-full glass-card bg-secondary/5 ${className}`}>
            <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                <Loader2 className="w-10 h-10 text-primary animate-spin relative z-10" />
            </div>
            <div className="text-center space-y-1">
                <h3 className="font-semibold text-lg text-foreground">{title}</h3>
                {message && (
                    <p className="text-sm text-muted-foreground">{message}</p>
                )}
            </div>
        </div>
    );
}
