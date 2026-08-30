import { Hero } from "@/components/home/hero";
import { SiteHeader } from "@/components/layout/site-header";

export function Homepage() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <SiteHeader />
      <main id="main-content">
        <Hero />
      </main>
    </>
  );
}