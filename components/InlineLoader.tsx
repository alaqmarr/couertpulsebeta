export function InlineLoader({ text }: { text?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <div className="w-4 h-4 border-2 border-muted border-t-primary rounded-full animate-spin" />
      <span>{text || "Loading..."}</span>
    </div>
  );
}
