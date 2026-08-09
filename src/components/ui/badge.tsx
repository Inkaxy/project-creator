import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.71875rem] font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary-light text-primary-text border-primary-border",
        secondary: "bg-muted text-muted-foreground border-border",
        destructive: "bg-destructive-light text-destructive-text border-destructive-border",
        outline: "text-foreground border-border",
        success: "bg-success-light text-success-text border-success-border",
        warning: "bg-warning-light text-warning-text border-warning-border",
        info: "bg-info-light text-info-text border-info-border",
        night: "bg-night-light text-night border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
