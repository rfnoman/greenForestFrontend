import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm text-secondary-foreground border-white/20 dark:border-white/10 hover:bg-white/60 dark:hover:bg-gray-800/60",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 border-white/20 dark:border-white/10",
        success:
          "border-green-200/50 dark:border-green-800/30 bg-green-100/70 text-green-800 dark:bg-green-900/50 dark:text-green-100 backdrop-blur-sm",
        warning:
          "border-yellow-200/50 dark:border-yellow-800/30 bg-yellow-100/70 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-100 backdrop-blur-sm",
        info:
          "border-blue-200/50 dark:border-blue-800/30 bg-blue-100/70 text-blue-800 dark:bg-blue-900/50 dark:text-blue-100 backdrop-blur-sm",
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
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
