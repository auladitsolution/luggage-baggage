import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-brand-navy text-white",
        teal: "bg-teal-50 text-brand-teal border border-teal-200",
        gold: "bg-amber-50 text-amber-800 border border-amber-200",
        success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        danger: "bg-rose-50 text-rose-700 border border-rose-200",
        warning: "bg-amber-50 text-amber-700 border border-amber-200",
        secondary: "bg-slate-100 text-slate-700 border border-slate-200",
        outline: "bg-transparent text-slate-700 border border-slate-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

