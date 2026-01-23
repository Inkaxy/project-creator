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
      {/* Brain/AI shape */}
      <path
        d="M12 2C9.5 2 7.5 3.5 7 5.5C5.5 5.8 4.3 7 4 8.5C3.4 8.8 3 9.5 3 10.5C3 11.5 3.5 12.3 4.2 12.7C4.1 13.1 4 13.5 4 14C4 15.7 5 17.1 6.5 17.7C6.8 19.5 8.3 21 10.2 21.3C10.7 21.8 11.3 22 12 22C12.7 22 13.3 21.8 13.8 21.3C15.7 21 17.2 19.5 17.5 17.7C19 17.1 20 15.7 20 14C20 13.5 19.9 13.1 19.8 12.7C20.5 12.3 21 11.5 21 10.5C21 9.5 20.6 8.8 20 8.5C19.7 7 18.5 5.8 17 5.5C16.5 3.5 14.5 2 12 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Neural network nodes */}
      <circle cx="9" cy="9" r="1.5" fill="currentColor" />
      <circle cx="15" cy="9" r="1.5" fill="currentColor" />
      <circle cx="12" cy="13" r="1.5" fill="currentColor" />
      <circle cx="9" cy="16" r="1" fill="currentColor" />
      <circle cx="15" cy="16" r="1" fill="currentColor" />
      
      {/* Neural connections */}
      <path
        d="M9 10.5L12 11.5M15 10.5L12 11.5M9 15L10.5 14M15 15L13.5 14"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.6"
      />
      
      {/* Sparkle accent */}
      <path
        d="M18 4L18.5 5.5L20 6L18.5 6.5L18 8L17.5 6.5L16 6L17.5 5.5L18 4Z"
        fill="currentColor"
        opacity="0.8"
      />
    </svg>
  );
}
