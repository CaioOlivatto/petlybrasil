import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
      <div className="relative mb-6">
        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-10 w-10 text-primary" />
        </div>
        <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-lg">
          🐾
        </div>
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2 font-display">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
