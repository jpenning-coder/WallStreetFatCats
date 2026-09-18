import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-[0.22rem] border text-[0.72rem] font-semibold uppercase tracking-[0.09em]",
    "transition-[background-color,border-color,color,transform] duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsfc-gold focus-visible:ring-offset-2 focus-visible:ring-offset-black",
    "disabled:pointer-events-none disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "border-wsfc-green-bright/65 bg-wsfc-green-deep text-wsfc-cream shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_32px_rgba(0,0,0,0.24)] hover:border-wsfc-green-bright hover:bg-wsfc-green",
        outline:
          "border-wsfc-gold/70 bg-black/30 text-wsfc-gold-light backdrop-blur-sm hover:border-wsfc-gold hover:bg-wsfc-gold/10 hover:text-wsfc-cream",
        ghost:
          "border-transparent bg-transparent text-wsfc-cream/78 hover:bg-white/5 hover:text-wsfc-cream",
      },
      size: {
        sm: "h-10 px-4",
        md: "h-11 px-5",
        lg: "h-12 px-5 sm:px-6",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = React.ComponentPropsWithRef<"button"> &
  VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}