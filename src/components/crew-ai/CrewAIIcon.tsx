import { cn } from "@/lib/utils";

interface CrewAIIconProps {
  className?: string;
  size?: number;
}

export function CrewAIIcon({ className, size = 24 }: CrewAIIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-current", className)}
    >
      {/* Outer glow ring */}
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.3"
      />
      
      {/* Inner circle base */}
      <circle
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="currentColor"
        fillOpacity="0.1"
      />
      
      {/* Central AI core */}
      <circle
        cx="12"
        cy="12"
        r="3"
        fill="currentColor"
      />
      
      {/* Orbital rings */}
      <ellipse
        cx="12"
        cy="12"
        rx="6"
        ry="2.5"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        transform="rotate(-30 12 12)"
        strokeOpacity="0.7"
      />
      <ellipse
        cx="12"
        cy="12"
        rx="6"
        ry="2.5"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        transform="rotate(30 12 12)"
        strokeOpacity="0.7"
      />
      
      {/* Data nodes */}
      <circle cx="6" cy="12" r="1.5" fill="currentColor" fillOpacity="0.8" />
      <circle cx="18" cy="12" r="1.5" fill="currentColor" fillOpacity="0.8" />
      <circle cx="12" cy="6" r="1.5" fill="currentColor" fillOpacity="0.8" />
      <circle cx="12" cy="18" r="1.5" fill="currentColor" fillOpacity="0.8" />
      
      {/* Pulse indicator */}
      <circle
        cx="12"
        cy="12"
        r="1"
        fill="currentColor"
        className="animate-pulse"
      />
    </svg>
  );
}
