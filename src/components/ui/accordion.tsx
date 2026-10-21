"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { cn } from "@/lib/utils";

/**
 * Radix accordion, restyled to the reference's language: hairline rules, no
 * boxed container, plus/minus indicator that rotates.
 *
 * Radix handles the parts a hand-rolled version gets wrong — roving focus,
 * aria-expanded/aria-controls wiring, single vs multiple open behaviour, and
 * Home/End/arrow-key navigation between triggers.
 */

const Accordion = AccordionPrimitive.Root;

function AccordionItem({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b border-white/10", className)}
      {...props}
    />
  );
}

function AccordionTrigger({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group flex flex-1 items-start justify-between gap-6 text-left [font-size:var(--type-lead)] font-normal tracking-[-0.02em] text-[var(--fg)] transition-colors duration-300 ease-out focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--focus)] disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
        {/* Signature badge: a circular fill that scales up on hover, the same
            motif the portfolio dots, service arrows and client tunnel use.

            Two crossing bars rather than a `+` glyph that rotates 45°. They look
            identical at rest, but rotating a `+` lands on an `×`; swinging one
            bar through 90° lands on a minus, which is the state that actually
            matches what the panel is doing.

            Decorative — the trigger already reports expanded state to assistive
            tech, so the badge needs no accessible name. */}
        <span
          aria-hidden="true"
          className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-full border border-white/20 transition-colors duration-300 ease-out max-[1025px]:size-11 max-md:size-9"
        >
          <span className="absolute inset-0 origin-center scale-0 rounded-full bg-linear-to-r from-[#F16B0D] to-[#E61416] transition-transform duration-300 ease-in-out group-hover:scale-100 group-data-[state=open]:scale-100 motion-reduce:transition-none" />
          {/* Bars sit above the fill and stay white in both states — the
              reference's orange sweep reads fully behind them. */}
          <span className="absolute z-2 h-[2px] w-4 rounded-full bg-white max-md:w-3" />
          <span className="absolute z-2 h-[2px] w-4 rotate-90 rounded-full bg-white transition-transform duration-300 ease-out group-data-[state=open]:rotate-0 max-md:w-3 motion-reduce:transition-none" />
        </span>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      // Radix exposes --radix-accordion-content-height; animating it keeps the
      // open/close motion on a real measurement instead of a guessed duration.
      // --row-dur lets a section pick its own speed (the reference's FAQ runs
      // 0.5s) without breaking the 320ms default elsewhere.
      className="overflow-hidden [font-size:var(--type-body)] text-[var(--fg-muted)] data-[state=closed]:animate-[acc-up_var(--row-dur,var(--dur-mid))_var(--ease-out)_forwards] data-[state=open]:animate-[acc-down_var(--row-dur,var(--dur-mid))_var(--ease-out)_forwards] motion-reduce:data-[state=closed]:animate-none motion-reduce:data-[state=open]:animate-none"
      {...props}
    >
      <div className={cn("pt-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };