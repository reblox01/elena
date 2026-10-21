"use client";

import { ContactButton } from "@/components/ui/contact-button";
import { useGetInTouchModal } from "@/components/ui/get-in-touch";
import { site } from "@/lib/data";

/**
 * The CTA's modal variant — a thin client shim so server components (the
 * footer) can render it: click handlers cannot cross the serializable
 * boundary, so a server-rendered page gets THIS instead of a closure prop.
 *
 * Both the ref's header and footer CTAs are literally `<a href="#">` with a
 * preventDefault → openModal() override — href stays "#" (not a bare `onClick`
 * button) so the DOM shape matches the reference byte for byte.
 */
export function ModalContactButton({
  bordered = false,
  className,
}: {
  bordered?: boolean;
  className?: string;
}) {
  const { openModal } = useGetInTouchModal();
  return (
    <ContactButton
      label={site.ctaLabel}
      href="#"
      bordered={bordered}
      onClick={(e) => {
        e.preventDefault();
        openModal();
      }}
      className={className}
    />
  );
}
