"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium no-underline transition-colors duration-300 ease-out motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--focus)]",
  {
    variants: {
      variant: {
        // The reference's signature pill: white ground, near-black label,
        // filled dot that inverts on hover.
        //
        // Colours come from the theme namespace (text-ink) rather than an
        // arbitrary hex. A literal text-[#111] collides with the size variants'
        // text-* utilities inside tailwind-merge — both sit in the same group,
        // so one gets discarded and the label silently inherits body colour
        // (white-on-white on this pill).
        pill: "bg-white text-ink border border-white/20 hover:text-white",
        solid: "bg-accent text-ink hover:bg-accent-hot",
        ink: "bg-ink text-cream hover:bg-accent-bronze",
        ghost: "bg-transparent text-fg hover:bg-white/10",
        /** For use on the saturated orange grounds. */
        onAccent: "bg-ink text-cream hover:bg-paper",
      },
      size: {
        // Font size is set via the [font-size:] arbitrary property, NOT text-*.
        // The text-* namespace is shared with colour in Tailwind, and
        // tailwind-merge will drop one of the two when they collide.
        sm: "h-9 px-4 [font-size:var(--type-meta)]",
        md: "h-11 px-6 [font-size:var(--type-body)]",
        lg: "h-[3.25rem] px-8 [font-size:var(--type-lead)]",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: { variant: "pill", size: "md" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { Button, buttonVariants };