import { describe, expect, it } from "vitest";
import { siteContent } from "./siteContent";

describe("site content", () => {
  it("uses the exact brochure wording for the centre name", () => {
    expect(siteContent.centreName).toBe(
      "Centre of Excellence in Advanced Manufacturing"
    );
  });

  it("includes brochure-backed DED and Wire EDM capability claims", () => {
    const claims = siteContent.coreInfrastructure.flatMap((item) => [
      item.title,
      item.summary,
      ...item.specs
    ]);

    expect(claims.join(" ")).toContain(
      "India's first InssTek Directed Energy Deposition MX-Fab3 5-axis system"
    );
    expect(claims.join(" ")).toContain("+/-2-5 microns");
  });

  it("keeps the primary collaboration contact focused on the centre mailbox", () => {
    expect(siteContent.contact.email).toBe("coeam@thapar.edu");
  });

  it("defines the six-page route model with no standalone about or contact page", () => {
    expect(siteContent.navigation.map((item) => item.path)).toEqual([
      "/",
      "/facilities",
      "/research",
      "/industry",
      "/people",
      "/gallery"
    ]);
    expect(siteContent.navigation.some((item) => item.path === "/about")).toBe(false);
    expect(siteContent.navigation.some((item) => item.path === "/contact")).toBe(false);
  });

  it("no longer carries team or capability strip content", () => {
    expect("leadership" in siteContent).toBe(false);
    expect("capabilityStrip" in siteContent).toBe(false);
  });

  it("carries the centre tagline used by the landing hero", () => {
    expect(siteContent.tagline).toBe("Engineered Precision, Smarter Tomorrow");
  });

  it("exposes the centre website for the contact banner", () => {
    expect(siteContent.contact.website).toBe("https://am.thapar.edu/");
  });

  it("provides smaller gallery assets with meaningful captions", () => {
    expect(siteContent.gallery).toHaveLength(6);
    expect(siteContent.gallery.every((item) => item.caption.length > 20)).toBe(true);
    expect(siteContent.gallery.every((item) => item.src.endsWith(".webp"))).toBe(true);
  });

  it("keeps research and industry pages substantive", () => {
    expect(siteContent.researchAreas).toHaveLength(6);
    expect(siteContent.industryOfferings).toHaveLength(6);
    expect(siteContent.researchAreas.every((area) => area.summary.length > 70)).toBe(true);
    expect(siteContent.industryOfferings.every((offering) => offering.summary.length > 70)).toBe(true);
  });

  it("describes the centre and its four research focus areas", () => {
    expect(siteContent.aboutCentre.intro).toHaveLength(2);
    expect(siteContent.aboutCentre.intro[0]).toContain("flagship joint initiative");
    expect(siteContent.aboutCentre.intro[0]).toContain("Noam Eliaz");
    expect(siteContent.aboutCentre.focusHeading).toBe("Core Research Focus Areas");
    expect(siteContent.aboutCentre.focusAreas.map((area) => area.title)).toEqual([
      "Advanced Additive & Hybrid Manufacturing",
      "High-Performance Materials",
      "Process Innovations",
      "Industry 4.0 Integration"
    ]);
    expect(siteContent.aboutCentre.closing).toContain("talent engine and startup incubator");
  });

  it("carries the director welcome message and attribution", () => {
    expect(siteContent.directorMessage.heading).toBe("Message from Director");
    expect(siteContent.directorMessage.paragraphs).toHaveLength(5);
    expect(siteContent.directorMessage.paragraphs[0]).toContain("Welcome to the Centre of Excellence");
    expect(siteContent.directorMessage.signatureName).toBe("Prof. Noam Eliaz");
    expect(siteContent.directorMessage.signatureRole).toContain("Founding Director");
    expect(siteContent.directorMessage.photoAlt.length).toBeGreaterThan(10);
  });

  it("no longer ships placeholder director copy", () => {
    const joined = siteContent.directorMessage.paragraphs.join(" ");
    expect(joined).not.toContain("Lorem ipsum");
  });

  it("lists both partner institution logos", () => {
    expect(siteContent.partnerLogos).toHaveLength(2);
    expect(siteContent.partnerLogos.map((logo) => logo.name)).toEqual([
      "Thapar Institute of Engineering and Technology",
      "Tel Aviv University"
    ]);
    expect(siteContent.partnerLogos.every((logo) => logo.src.startsWith("/assets/"))).toBe(true);
    expect(siteContent.partnerLogos.every((logo) => logo.alt.length > 10)).toBe(true);
  });
});
