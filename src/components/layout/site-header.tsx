import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { primaryNavigation } from "@/config/site";
import { cn } from "@/lib/cn";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="flex h-full w-full items-center gap-6 px-4 sm:px-6 xl:px-7 2xl:px-8">
        <BrandLogo className="relative z-10 shrink-0 min-[1360px]:w-[25rem]" />

        <div className="hidden min-w-0 flex-1 items-center justify-end gap-5 min-[1360px]:flex 2xl:gap-7">
          <nav aria-label="Primary navigation" className="min-w-0">
            <ul className="flex items-center gap-5 2xl:gap-[1.7rem]">
              {primaryNavigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={item.current ? "page" : undefined}
                    className={cn(
                      "nav-link",
                      item.current && "nav-link-current",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-1 flex shrink-0 items-center gap-3 2xl:ml-3 2xl:gap-4">
            <Link href="/login" className="header-login-button">
              Log in
            </Link>
            <Link href="/gordon" className="header-start-button">
              Get started
            </Link>
          </div>
        </div>

        <div className="ml-auto min-[1360px]:hidden">
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}