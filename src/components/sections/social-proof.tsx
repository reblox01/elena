/*
 * Section modules, one per file. This re-export barrel exists only for the
 * import path used by app/page.tsx; each section owns its own markup and
 * animation.
 *
 *   awards.tsx         list + cursor-tracking preview plate
 *   clients.tsx        240vh logo tunnel
 *   testimonials.tsx   single card swapped by avatar pills
 */
export { Awards } from "@/components/sections/awards";
export { Clients } from "@/components/sections/clients";
export { Testimonials } from "@/components/sections/testimonials";