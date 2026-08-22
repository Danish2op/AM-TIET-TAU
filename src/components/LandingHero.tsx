import { ChevronDown } from "lucide-react";
import { siteContent } from "../content/siteContent";

export function LandingHero() {
  return (
    <section className="landing-hero" aria-labelledby="landing-hero-title">
      <div className="landing-hero-media" aria-hidden="true" />
      <div className="landing-hero-inner">
        <div className="landing-hero-logos" data-reveal="">
          <img src={siteContent.partnerLogos[0].src} alt={siteContent.partnerLogos[0].alt} />
          <span aria-hidden="true" />
          <img src={siteContent.partnerLogos[1].src} alt={siteContent.partnerLogos[1].alt} />
        </div>
        <h1 id="landing-hero-title" data-reveal="" data-reveal-delay="1">
          <span>Centre of Excellence</span>
          <span>in</span>
          <span>Advanced Manufacturing</span>
        </h1>
        <p className="landing-hero-tagline" data-reveal="" data-reveal-delay="2">
          {siteContent.tagline}
        </p>
        <a className="landing-hero-cta" href="#about" data-reveal="" data-reveal-delay="3">
          Explore <ChevronDown aria-hidden="true" size={18} />
        </a>
      </div>
    </section>
  );
}
