"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { primaryNavigation } from "@/config/site";
import { cn } from "@/lib/cn";

export function MobileMenu({ currentPath = "/" }: { currentPath?: string }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    panelRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (event.key === "Tab") {
        const links = Array.from(panelRef.current?.querySelectorAll<HTMLAnchorElement>("a[href]") ?? []);
        const first = links[0];
        const last = links[links.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); toggleRef.current?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); toggleRef.current?.focus();
        } else if (document.activeElement === toggleRef.current) {
          event.preventDefault(); (event.shiftKey ? last : first)?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="min-[1360px]:hidden">
      <Button
        ref={toggleRef}
        variant="outline"
        size="sm"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={open ? "Close navigation" : "Open navigation"}
        className="size-11 px-0"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </Button>

      <div
        aria-hidden={!open}
        style={{ top: "var(--header-height)" }}
        className={cn(
          "fixed inset-0 z-40 bg-black/76 backdrop-blur-sm transition-opacity duration-200",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setOpen(false)}
      />

      <aside
        id={menuId}
        ref={panelRef}
        inert={!open}
        aria-hidden={!open}
        aria-label="Mobile navigation"
        style={{ top: "var(--header-height)", height: "calc(100svh - var(--header-height))", overflowY: "auto" }}
        className={cn(
          "fixed right-0 z-50 w-[min(90vw,25rem)] border-l border-wsfc-gold/25 bg-[#050705]/98 px-6 py-8 shadow-2xl transition-transform duration-200",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <nav aria-label="Primary navigation">
          <ul className="space-y-1">
            {primaryNavigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={item.href === currentPath ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex min-h-12 items-center border-b border-white/7 text-sm font-semibold uppercase tracking-[0.15em] text-wsfc-cream/72 transition-colors hover:text-wsfc-gold-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsfc-gold",
                    item.href === currentPath && "text-wsfc-gold-light",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="inline-flex h-11 items-center justify-center rounded-[0.22rem] border border-wsfc-green-bright/55 text-xs font-semibold uppercase tracking-[0.12em] text-wsfc-cream transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsfc-gold"
          >
            Log in
          </Link>
          <Link
            href="/gordon"
            onClick={() => setOpen(false)}
            className="inline-flex h-11 items-center justify-center rounded-[0.22rem] border border-wsfc-green-bright/70 bg-wsfc-green-deep text-xs font-semibold uppercase tracking-[0.12em] text-wsfc-cream transition-colors hover:bg-wsfc-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsfc-gold"
          >
            Get started
          </Link>
        </div>

        <p className="mt-10 border-t border-wsfc-gold/16 pt-5 text-[0.65rem] uppercase leading-5 tracking-[0.13em] text-wsfc-cream/38">
          Wall Street Intelligence.
          <br />
          Main Street Access.
        </p>
      </aside>
    </div>
  );
}