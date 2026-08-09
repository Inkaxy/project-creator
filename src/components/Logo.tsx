interface LogoProps {
  className?: string;
  showWordmark?: boolean;
}

export function Logo({ className, showWordmark = true }: LogoProps) {
  return (
    <span className={["inline-flex items-center gap-2", className].filter(Boolean).join(" ")}>
      <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg bg-primary text-[0.6875rem] font-semibold text-primary-foreground">
        CP
      </span>
      {showWordmark && <span className="text-[0.9375rem] font-semibold text-foreground">CrewPlan</span>}
    </span>
  );
}
