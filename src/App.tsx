import {
  ArrowRight,
  Factory,
  GraduationCap,
  Layers3,
  Mail,
  MapPin,
  Microscope,
  Users,
  Wrench
} from "lucide-react";
import { siteContent } from "./content/siteContent";

const capabilityIcons = [Factory, Layers3, Microscope, Wrench, GraduationCap, Users];

function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="TIET-TAU home">
          <span className="brand-mark">ti</span>
          <span>
            <strong>{siteContent.eyebrow}</strong>
            <small>{siteContent.centreName}</small>
          </span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#facilities">Facilities</a>
          <a href="#research">Research</a>
          <a href="#industry">Industry</a>
          <a href="#team">Team</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main id="main">
        <section className="hero section-band" id="top">
          <div className="hero-copy">
            <p className="eyebrow">{siteContent.eyebrow}</p>
            <h1>{siteContent.centreName}</h1>
            <p className="hero-title">{siteContent.heroTitle}</p>
            <p className="hero-summary">{siteContent.heroSummary}</p>
            <div className="actions" aria-label="Primary actions">
              <a className="button primary" href="#facilities">
                Explore facilities <ArrowRight aria-hidden="true" size={18} />
              </a>
              <a className="button secondary" href={`mailto:${siteContent.contact.email}`}>
                Contact for collaboration <Mail aria-hidden="true" size={18} />
              </a>
            </div>
          </div>
          <figure className="hero-visual">
            <img
              src="/assets/ded-system.webp"
              alt="InssTek Directed Energy Deposition system at the Advanced Manufacturing Centre"
            />
            <figcaption>
              InssTek MX-Fab3 5-axis DED system supporting repair, cladding,
              multimaterial builds, and complex geometry deposition.
            </figcaption>
          </figure>
        </section>

        <section className="capability-strip" aria-label="Core capabilities">
          {siteContent.capabilityStrip.map((capability, index) => {
            const Icon = capabilityIcons[index] ?? Factory;
            return (
              <div className="capability" key={capability}>
                <Icon aria-hidden="true" size={22} />
                <span>{capability}</span>
              </div>
            );
          })}
        </section>

        <section className="about section-band">
          <div>
            <p className="eyebrow">About the centre</p>
            <h2>Built as a practical bridge between research, industry, and training.</h2>
          </div>
          <p>
            CoE-AM is a multidisciplinary ecosystem where advanced infrastructure
            and domain experts converge to support academia, industry, defense,
            healthcare, and innovators. The centre supports end-to-end technology
            development from conceptual design, modelling, and prototyping to
            testing, refinement, and final validation.
          </p>
        </section>

        <section className="section-band" id="facilities">
          <div className="section-heading">
            <p className="eyebrow">Core infrastructure</p>
            <h2>Real equipment, technical depth, and validation support.</h2>
          </div>
          <div className="infrastructure-list">
            {siteContent.coreInfrastructure.map((item) => (
              <article className="facility" key={item.title}>
                <img src={item.image} alt={item.alt} loading="lazy" />
                <div className="facility-copy">
                  <p className="eyebrow">{item.eyebrow}</p>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                  <ul>
                    {item.specs.map((spec) => (
                      <li key={spec}>{spec}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section-band evidence">
          <img
            src="/assets/ded-process.webp"
            alt="Directed Energy Deposition work area showing the process setup"
            loading="lazy"
          />
          <div>
            <p className="eyebrow">Material outcomes</p>
            <h2>From process parameters to component-level evidence.</h2>
            <p>
              The facility supports stainless steels, nickel-based alloys,
              titanium alloys, cobalt alloys, tool steels, customized alloys,
              multimaterials, functionally graded materials, composites,
              cladding, and repair applications.
            </p>
            <img
              src="/assets/sample-coupons.webp"
              alt="Advanced manufacturing sample coupons showing different surface outcomes"
              loading="lazy"
            />
          </div>
        </section>

        <section className="section-band split" id="research">
          <div className="section-heading">
            <p className="eyebrow">Research and application areas</p>
            <h2>Focused on manufacturing problems that need material, process, and measurement discipline.</h2>
          </div>
          <div className="pill-grid">
            {siteContent.researchAreas.map((area) => (
              <div className="pill-item" key={area}>
                {area}
              </div>
            ))}
          </div>
        </section>

        <section className="section-band industry" id="industry">
          <div className="section-heading">
            <p className="eyebrow">Offerings for corporates</p>
            <h2>Clear pathways for collaboration, qualification, and skill development.</h2>
          </div>
          <div className="offering-grid">
            {siteContent.industryOfferings.map((offering) => (
              <article className="offering" key={offering}>
                <span aria-hidden="true" />
                <h3>{offering}</h3>
              </article>
            ))}
          </div>
        </section>

        <section className="section-band team" id="team">
          <div className="section-heading">
            <p className="eyebrow">Leadership</p>
            <h2>Joint academic leadership across TIET and Tel Aviv University.</h2>
          </div>
          <div className="team-grid">
            {siteContent.leadership.map((person) => (
              <article className="person" key={person.name}>
                <h3>{person.name}</h3>
                <p className="role">{person.role}</p>
                <p>{person.affiliation}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="contact section-band" id="contact">
          <div>
            <p className="eyebrow">Contact</p>
            <h2>Collaborate with the centre.</h2>
            <p>
              For academic partnerships, industrial problem statements, training,
              sponsored R&D, consultancy, or prototyping support, reach out to
              the CoE-AM team.
            </p>
          </div>
          <address>
            <a href={`mailto:${siteContent.contact.email}`}>
              <Mail aria-hidden="true" size={20} />
              {siteContent.contact.email}
            </a>
            <span>
              <MapPin aria-hidden="true" size={20} />
              {siteContent.contact.address}
            </span>
          </address>
        </section>
      </main>
    </>
  );
}

export default App;

