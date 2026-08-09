interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { box: "h-[26px] w-[26px] text-[0.6875rem]", word: "text-[0.9375rem]" },
  md: { box: "h-9 w-9 text-[0.875rem]", word: "text-[1.25rem]" },
  lg: { box: "h-12 w-12 text-[1.125rem]", word: "text-[1.625rem]" },
} as const;

export function Logo({ className, showWordmark = true, size = "sm" }: LogoProps) {
  const s = sizes[size];
  return (
    <span className={["inline-flex items-center gap-2", className].filter(Boolean).join(" ")}>
      <span
        className={`flex shrink-0 items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground ${s.box}`}
      >
        CP
      </span>
      {showWordmark && <span className={`font-semibold text-foreground ${s.word}`}>CrewPlan</span>}
    </span>
  );
}
