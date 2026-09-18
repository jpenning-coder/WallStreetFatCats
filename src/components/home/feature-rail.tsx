import { features } from "@/config/homepage";

export function FeatureRail() {
  return (
    <section id="strategies" aria-labelledby="feature-rail-title" className="feature-rail">
      <h2 id="feature-rail-title" className="sr-only">
        WallStreetFatCats capabilities
      </h2>

      <div className="feature-grid">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <article key={feature.title} className="feature-card">
              <div className="feature-icon-shell" aria-hidden="true">
                <Icon strokeWidth={1.45} />
              </div>

              <div className="min-w-0">
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-copy">
                  {feature.lines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}