import { useEffect, useRef, useState } from "react";
import { NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import {
  ArrowRight,
  ChevronRight,
  Linkedin,
  Maximize2,
  Sparkles,
  X
} from "lucide-react";
import { GalleryItem, TeamMember, siteContent } from "./content/siteContent";
import { HeroCarousel } from "./components/HeroCarousel";
import { LandingHero } from "./components/LandingHero";
import { SiteNav } from "./components/SiteNav";
import { useScrollReveal } from "./lib/useScrollReveal";

function Layout() {
  useScrollReveal();
  const location = useLocation();

  // The bar rides transparently over the landing hero and turns solid once
  // the reader leaves it, so white-on-photo never lands on white-on-white.
  const isLanding = location.pathname === "/";

  // Scroll-linked rather than a threshold toggle: every frame writes a 0-1
  // progress value that the header surface and hero picture interpolate
  // against, so the change tracks the scroll instead of snapping once.
  useEffect(() => {
    const root = document.documentElement;
    // The landing hero fills the viewport; inner pages open on a shorter
    // banner, so the bar has less runway before it needs its surface.
    const DISTANCE = isLanding ? 420 : 200;
    // Damping factor. A wheel tick jumps the scroll ~100px at once, so
    // following it exactly still lands in steps. Easing toward the target
    // each frame is what turns those jumps into a glide.
    const EASE = 0.055;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targetOf = () => Math.min(1, Math.max(0, window.scrollY / DISTANCE));

    let target = targetOf();
    let current = target;
    let frame = 0;

    const commit = (value: number) => {
      root.style.setProperty("--scroll-progress", value.toFixed(4));
    };

    const tick = () => {
      current += (target - current) * EASE;

      if (Math.abs(target - current) < 0.0004) {
        current = target;
        commit(current);
        frame = 0;
        return;
      }

      commit(current);
      frame = window.requestAnimationFrame(tick);
    };

    const handleScroll = () => {
      target = targetOf();

      if (prefersReducedMotion) {
        current = target;
        commit(current);
        return;
      }

      if (!frame) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    commit(current);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      root.style.setProperty("--scroll-progress", "1");
    };
  }, [isLanding]);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <header className="site-header site-header--overlay">
        <div className="header-inner">
          <NavLink className="brand" to="/" aria-label="TIET-TAU home">
            <span className="brand-logos">
              {siteContent.partnerLogos.map((logo) => (
                <span className="brand-logo" key={logo.src}>
                  <img src={logo.src} alt={logo.alt} />
                  <img className="brand-logo-white" src={logo.src} alt="" aria-hidden="true" />
                </span>
              ))}
            </span>
            <span className="brand-text">
              <strong>{siteContent.eyebrow}</strong>
              <small>{siteContent.centreName}</small>
            </span>
          </NavLink>
          <SiteNav />
        </div>
      </header>

      <main id="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<Navigate to="/" replace />} />
          <Route path="/facilities" element={<FacilitiesPage />} />
          <Route path="/research" element={<ResearchPage />} />
          <Route path="/industry" element={<IndustryPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
    </>
  );
}

function PageHero({ title }: { title: string }) {
  return (
    <section className="page-hero">
      <div className="page-hero-media" aria-hidden="true" />
      <div className="page-hero-inner">
        <h1>{title}</h1>
        <span className="page-hero-rule" aria-hidden="true" />
      </div>
    </section>
  );
}

function HomePage() {
  return (
    <>
      <LandingHero />

      <section className="section-shell about-section" id="about">
        <div className="about-copy glass-panel" data-reveal="">
          <p className="eyebrow">About</p>
          <span className="rule" aria-hidden="true" />
          <div className="about-media">
            <HeroCarousel items={siteContent.gallery} />
          </div>
          {siteContent.aboutCentre.intro.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
          <p>{siteContent.aboutCentre.closing}</p>
        </div>
      </section>

      <section className="section-shell director-section" data-reveal="">
        <div className="glass-panel director-copy">
          <figure className="director-portrait">
            <img src={siteContent.directorMessage.photo} alt={siteContent.directorMessage.photoAlt} />
          </figure>
          <p className="eyebrow">{siteContent.directorMessage.heading}</p>
          <span className="rule" aria-hidden="true" />
          {siteContent.directorMessage.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
          <p className="director-signature">
            <strong>{siteContent.directorMessage.signatureName}</strong>
            <span>{siteContent.directorMessage.signatureRole}</span>
          </p>
        </div>
      </section>
    </>
  );
}

function FacilitiesPage() {
  return (
    <>
      <PageHero title="Facilities" />
      <section className="section-shell facility-grid">
        {siteContent.coreInfrastructure.map((item, index) => (
          <article
            className="glass-card facility-card"
            key={item.title}
            data-reveal=""
            data-reveal-delay={Math.min(index + 1, 5)}
          >
            {item.heading ? (
              <>
                <div className="facility-card-head">
                  <div className="facility-card-intro">
                    <p className="facility-card-heading">{item.heading}</p>
                    <p className="facility-card-model">{item.model}</p>
                    <span className="rule" aria-hidden="true" />
                    <ul className="facility-card-head-specs">
                      {item.specRows?.slice(0, 2).map((row) => (
                        <li key={row.label}>
                          <strong>{row.label}:</strong> {row.value}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="facility-card-thumb">
                    <img src={item.image} alt={item.alt} loading="lazy" />
                  </div>
                </div>
                <div className="facility-card-body">
                  <div className="facility-spec-table">
                    {item.specRows?.slice(2).map((row) => (
                      <div className="facility-spec-row" key={row.label}>
                        <span className="facility-spec-label">{row.label}</span>
                        <span className="facility-spec-value">{row.value}</span>
                      </div>
                    ))}
                    {item.specGroups?.map((group) => (
                      <div className="facility-spec-group" key={group.heading}>
                        <p className="facility-spec-group-heading">{group.heading}</p>
                        <ul className="facility-spec-group-list">
                          {group.items.map((entry) => (
                            <li key={entry}>{entry}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="facility-card-media">
                  <img src={item.image} alt={item.alt} loading="lazy" />
                </div>
                <div className="facility-card-body">
                  <p className="eyebrow">{item.eyebrow}</p>
                  <h2>{item.title}</h2>
                  <p>{item.summary}</p>
                  <ul className="spec-list">
                    {item.specs.map((spec) => (
                      <li key={spec}>{spec}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </article>
        ))}
      </section>
    </>
  );
}

function ResearchPage() {
  return (
    <>
      <PageHero title="Research" />
      <section className="section-shell research-layout">
        <div className="glass-panel">
          <p className="eyebrow">Research thrusts</p>
          <h2>Six applied directions.</h2>
          <div className="pill-grid">
            {siteContent.researchAreas.map((area) => (
              <article className="pill-item" key={area.title}>
                <h3>{area.title}</h3>
                <p>{area.summary}</p>
              </article>
            ))}
          </div>
        </div>
        <figure className="glass-card compact-figure">
          <img src="/assets/sample-coupons.webp" alt="Advanced manufacturing sample coupons with different surface outcomes" />
          <figcaption>
            Material samples and surface outcomes connect the research agenda with visible process evidence.
          </figcaption>
        </figure>
      </section>
    </>
  );
}

function IndustryPage() {
  return (
    <>
      <PageHero title="Industry" />
      <section className="section-shell offering-grid">
        {siteContent.industryOfferings.map((offering) => (
          <article className="glass-card offering" key={offering.title}>
            <Sparkles aria-hidden="true" size={20} />
            <h2>{offering.title}</h2>
            <p>{offering.summary}</p>
          </article>
        ))}
      </section>
    </>
  );
}

function GalleryPage() {
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const openGalleryItem = (item: GalleryItem) => {
    lastFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelected(item);
  };

  const closeGalleryItem = () => {
    setSelected(null);
  };

  useEffect(() => {
    if (!selected) {
      lastFocusedRef.current?.focus();
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeGalleryItem();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );

      if (!focusable.length) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [selected]);

  return (
    <>
      <PageHero title="Gallery" />
      <section className="section-shell gallery-grid">
        {siteContent.gallery.map((item) => (
          <button className="gallery-tile glass-card" key={item.src} onClick={() => openGalleryItem(item)}>
            <img src={item.src} alt={item.alt} loading="lazy" />
            <span>{item.tag}</span>
            <p>{item.caption}</p>
            <Maximize2 aria-hidden="true" size={18} />
          </button>
        ))}
      </section>
      {selected && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={selected.tag}
          ref={dialogRef}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeGalleryItem();
            }
          }}
        >
          <button
            className="lightbox-close"
            onClick={closeGalleryItem}
            aria-label="Close image preview"
            ref={closeButtonRef}
          >
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

function PeoplePage() {
  const [selected, setSelected] = useState<TeamMember | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const openMember = (member: TeamMember) => {
    lastFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelected(member);
  };

  const closeMember = () => {
    setSelected(null);
  };

  useEffect(() => {
    if (!selected) {
      lastFocusedRef.current?.focus();
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMember();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [selected]);

  return (
    <>
      <PageHero title="People" />
      <section className="section-shell people-grid">
        {siteContent.people.map((member) => (
          <button
            className="person-card glass-card"
            key={member.name}
            onClick={() => openMember(member)}
            aria-label={`View profile of ${member.name}`}
          >
            <img
              className="person-card-photo"
              src={member.photo}
              alt={member.photoAlt}
              loading="lazy"
            />
            <p className="person-card-name">{member.name}</p>
            <p className="person-card-role">{member.role}</p>
            <p className="person-card-affiliation">{member.affiliation}</p>
          </button>
        ))}
      </section>

      {selected && (
        <div
          className="person-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`Profile of ${selected.name}`}
          ref={dialogRef}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeMember();
          }}
        >
          <div className="person-modal-inner">
            <button
              className="person-modal-close"
              onClick={closeMember}
              aria-label="Close profile"
              ref={closeButtonRef}
            >
              <X aria-hidden="true" size={20} />
            </button>
            <img
              className="person-modal-photo"
              src={selected.photo}
              alt={selected.photoAlt}
            />
            <h2 className="person-modal-name">{selected.name}</h2>
            <p className="person-modal-role">{selected.role}</p>
            <p className="person-modal-affiliation">{selected.affiliation}</p>
            <span className="rule" aria-hidden="true" />
            <blockquote className="person-modal-note">
              <p>"{selected.note}"</p>
            </blockquote>
            {selected.linkedin !== "#" ? (
              <a
                className="person-modal-linkedin"
                href={selected.linkedin}
                target="_blank"
                rel="noreferrer"
              >
                <Linkedin aria-hidden="true" size={16} />
                LinkedIn Profile
              </a>
            ) : (
              <span className="person-modal-linkedin person-modal-linkedin--placeholder">
                <Linkedin aria-hidden="true" size={16} />
                LinkedIn — coming soon
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function NotFoundPage() {
  return (
    <>
      <PageHero title="Page not found" />
      <section className="section-shell contact-strip glass-panel">
        <div>
          <p className="eyebrow">Continue</p>
          <h2>Go back to the centre overview or meet the team directly.</h2>
        </div>
        <div className="actions">
          <NavLink className="button primary" to="/">
            Home <ArrowRight aria-hidden="true" size={18} />
          </NavLink>
          <NavLink className="button secondary" to="/people">
            People <ChevronRight aria-hidden="true" size={18} />
          </NavLink>
        </div>
      </section>
    </>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-text">
          <strong className="footer-title">
            {siteContent.eyebrow} – {siteContent.centreName}
          </strong>
          <span className="footer-address">{siteContent.contact.address}</span>
          <span className="footer-email-row">
            Email:{" "}
            <a className="footer-email" href={`mailto:${siteContent.contact.email}`}>
              {siteContent.contact.email}
            </a>
          </span>
        </div>
        <div className="footer-logos">
          {siteContent.partnerLogos.map((logo) => (
            <span className="footer-logo" key={logo.src}>
              <img src={logo.src} alt={logo.alt} />
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default Layout;
