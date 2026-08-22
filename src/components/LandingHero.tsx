import { ChevronDown } from "lucide-react";
import { siteContent } from "../content/siteContent";

export function LandingHero() {
  return (
    <section className="landing-hero" aria-labelledby="landing-hero-title">
      <div className="landing-hero-media" aria-hidden="true" />
      <div className="landing-hero-inner">
        <div className="landing-hero-logos" data-reveal="">
          {siteContent.partnerLogos.map((logo) => (
            <img key={logo.src} src={logo.src} alt={logo.alt} />
          ))}
        </div>
        <p className="landing-hero-eyebrow" data-reveal="" data-reveal-delay="1">
          Centre of Excellence in
        </p>
        <h1 id="landing-hero-title" data-reveal="" data-reveal-delay="2">
          Advanced Manufacturing
        </h1>
        <p className="landing-hero-tagline" data-reveal="" data-reveal-delay="3">
          {siteContent.tagline}
        </p>
        <a className="landing-hero-cta" href="#about" data-reveal="" data-reveal-delay="4">
          Explore <ChevronDown aria-hidden="true" size={18} />
        </a>
      </div>
    </section>
  );
}
