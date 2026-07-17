import { useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import {
  ArrowRight,
  ChevronRight,
  Factory,
  GraduationCap,
  Layers3,
  Mail,
  MapPin,
  Maximize2,
  Microscope,
  Sparkles,
  Users,
  Wrench,
  X
} from "lucide-react";
import { GalleryItem, siteContent } from "./content/siteContent";

const capabilityIcons = [Factory, Layers3, Microscope, Wrench, GraduationCap, Users];

function Layout() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <header className="site-header">
        <NavLink className="brand" to="/" aria-label="TIET-TAU home">
          <span className="brand-mark">ti</span>
          <span>
            <strong>{siteContent.eyebrow}</strong>
            <small>{siteContent.centreName}</small>
          </span>
        </NavLink>
        <nav aria-label="Primary navigation">
          {siteContent.navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => (isActive ? "active" : undefined)}
              end={item.path === "/"}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main id="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/facilities" element={<FacilitiesPage />} />
          <Route path="/research" element={<ResearchPage />} />
          <Route path="/industry" element={<IndustryPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </main>

      <Footer />
    </>
  );
}

function PageHero({
  eyebrow,
  title,
  summary
}: {
  eyebrow: string;
  title: string;
  summary: string;
}) {
  return (
    <section className="page-hero">
      <div className="glass-panel hero-panel">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{summary}</p>
      </div>
    </section>
  );
}

function HomePage() {
  return (
    <>
      <section className="home-hero">
        <div className="glass-panel home-copy">
          <p className="eyebrow">{siteContent.eyebrow}</p>
          <h1>{siteContent.centreName}</h1>
          <p className="hero-title">{siteContent.heroTitle}</p>
          <p>{siteContent.heroSummary}</p>
          <div className="actions">
            <NavLink className="button primary" to="/facilities">
              Explore facilities <ArrowRight aria-hidden="true" size={18} />
            </NavLink>
            <NavLink className="button secondary" to="/industry">
              Industry collaboration <ChevronRight aria-hidden="true" size={18} />
            </NavLink>
          </div>
        </div>

        <div className="image-stack" aria-label="Facility image preview">
          {siteContent.gallery.slice(0, 3).map((item, index) => (
            <figure className={`stack-card stack-${index + 1}`} key={item.src}>
              <img src={item.src} alt={item.alt} />
              <figcaption>{item.tag}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="section-shell">
        <div className="section-heading compact">
          <p className="eyebrow">Capability map</p>
          <h2>Smaller entry points into the centre instead of one endless page.</h2>
        </div>
        <div className="capability-grid">
          {siteContent.capabilityStrip.map((capability, index) => {
            const Icon = capabilityIcons[index] ?? Factory;
            return (
              <NavLink
                className="glass-card capability-card"
                to={index < 4 ? "/facilities" : "/industry"}
                key={capability}
              >
                <Icon aria-hidden="true" size={22} />
                <span>{capability}</span>
              </NavLink>
            );
          })}
        </div>
      </section>

      <section className="section-shell route-grid">
        {siteContent.navigation.slice(1).map((item) => (
          <NavLink className="route-card glass-card" key={item.path} to={item.path}>
            <span>{item.label}</span>
            <p>{item.summary}</p>
            <ChevronRight aria-hidden="true" size={18} />
          </NavLink>
        ))}
      </section>
    </>
  );
}

function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="A TIET-TAU platform for research, prototyping, and workforce development."
        summary="CoE-AM brings advanced manufacturing infrastructure and domain experts together to support academia, industry, defense, healthcare, and innovators."
      />
      <section className="section-shell split-layout">
        <div className="glass-panel">
          <p className="eyebrow">Centre focus</p>
          <h2>From concept to validated component.</h2>
          <p>
            The centre supports end-to-end technology development from conceptual
            design, modelling, simulation, prototyping, testing, refinement, and
            final validation. Beyond research, it supports specialized training,
            certifications, workshops, entrepreneurship, and consultancy.
          </p>
        </div>
        <LeadershipBlock />
      </section>
    </>
  );
}

function FacilitiesPage() {
  return (
    <>
      <PageHero
        eyebrow="Facilities"
        title="Compact view of core infrastructure and validation support."
        summary="The revised facility pages keep images contextual and pair each asset with specs, applications, and evidence."
      />
      <section className="section-shell facility-grid">
        {siteContent.coreInfrastructure.map((item) => (
          <article className="glass-card facility-card" key={item.title}>
            <img src={item.image} alt={item.alt} loading="lazy" />
            <div>
              <p className="eyebrow">{item.eyebrow}</p>
              <h2>{item.title}</h2>
              <p>{item.summary}</p>
              <ul className="spec-list">
                {item.specs.map((spec) => (
                  <li key={spec}>{spec}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}

function ResearchPage() {
  return (
    <>
      <PageHero
        eyebrow="Research"
        title="Material, process, and measurement discipline for advanced applications."
        summary="Research areas stay factual and linked to the centre's equipment, materials, repair, machining, and smart manufacturing capabilities."
      />
      <section className="section-shell research-layout">
        <div className="glass-panel">
          <p className="eyebrow">Research thrusts</p>
          <h2>Six applied directions.</h2>
          <div className="pill-grid">
            {siteContent.researchAreas.map((area) => (
              <div className="pill-item" key={area}>
                {area}
              </div>
            ))}
          </div>
        </div>
        <figure className="glass-card compact-figure">
          <img src="/assets/sample-coupons.webp" alt="Advanced manufacturing sample coupons with different surface outcomes" />
          <figcaption>
            Material samples and surface outcomes keep the research page grounded in visible process evidence.
          </figcaption>
        </figure>
      </section>
    </>
  );
}

function IndustryPage() {
  return (
    <>
      <PageHero
        eyebrow="Industry"
        title="Collaboration paths for development, qualification, training, and consultancy."
        summary="This page separates industry-facing offerings from research content so corporate visitors can find practical entry points quickly."
      />
      <section className="section-shell offering-grid">
        {siteContent.industryOfferings.map((offering) => (
          <article className="glass-card offering" key={offering}>
            <Sparkles aria-hidden="true" size={20} />
            <h2>{offering}</h2>
          </article>
        ))}
      </section>
      <section className="section-shell contact-strip glass-panel">
        <div>
          <p className="eyebrow">Start a discussion</p>
          <h2>Bring a material, process, or component problem.</h2>
        </div>
        <NavLink className="button primary" to="/contact">
          Contact the centre <Mail aria-hidden="true" size={18} />
        </NavLink>
      </section>
    </>
  );
}

function GalleryPage() {
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  return (
    <>
      <PageHero
        eyebrow="Gallery"
        title="Facility and material images in a compact interactive grid."
        summary="Images are now thumbnails with captions and a lightbox, rather than oversized static blocks."
      />
      <section className="section-shell gallery-grid">
        {siteContent.gallery.map((item) => (
          <button className="gallery-tile glass-card" key={item.src} onClick={() => setSelected(item)}>
            <img src={item.src} alt={item.alt} loading="lazy" />
            <span>{item.tag}</span>
            <p>{item.caption}</p>
            <Maximize2 aria-hidden="true" size={18} />
          </button>
        ))}
      </section>
      {selected && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={selected.tag}>
          <button className="lightbox-close" onClick={() => setSelected(null)} aria-label="Close image preview">
            <X aria-hidden="true" size={22} />
          </button>
          <figure>
            <img src={selected.src} alt={selected.alt} />
            <figcaption>{selected.caption}</figcaption>
          </figure>
        </div>
      )}
    </>
  );
}

function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="A simple collaboration path for academia, industry, and innovators."
        summary="The first draft keeps the contact path focused on the centre mailbox and institute address."
      />
      <section className="section-shell contact-page">
        <address className="glass-panel">
          <a href={`mailto:${siteContent.contact.email}`}>
            <Mail aria-hidden="true" size={20} />
            {siteContent.contact.email}
          </a>
          <span>
            <MapPin aria-hidden="true" size={20} />
            {siteContent.contact.address}
          </span>
        </address>
        <figure className="glass-card compact-figure">
          <img src="/assets/ded-process.webp" alt="Directed Energy Deposition work area showing the process setup" />
          <figcaption>
            Use the centre mailbox for collaboration, training, sponsored R&D,
            consultancy, or prototyping conversations.
          </figcaption>
        </figure>
      </section>
    </>
  );
}

function LeadershipBlock() {
  return (
    <div className="leadership-grid">
      {siteContent.leadership.map((person) => (
        <article className="glass-card person" key={person.name}>
          <h2>{person.name}</h2>
          <p className="role">{person.role}</p>
          <p>{person.affiliation}</p>
        </article>
      ))}
    </div>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <span>{siteContent.eyebrow}</span>
      <span>{siteContent.centreName}</span>
      <a href={`mailto:${siteContent.contact.email}`}>{siteContent.contact.email}</a>
    </footer>
  );
}

export default Layout;
