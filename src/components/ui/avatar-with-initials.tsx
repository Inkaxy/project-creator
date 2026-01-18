import { cn } from "@/lib/utils";

interface AvatarWithInitialsProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

export function AvatarWithInitials({ name, size = "md", className }: AvatarWithInitialsProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground",
        sizeStyles[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
