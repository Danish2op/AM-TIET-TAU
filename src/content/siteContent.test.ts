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

  it("defines the six-page route model with no standalone about page", () => {
    expect(siteContent.navigation.map((item) => item.path)).toEqual([
      "/",
      "/facilities",
      "/research",
      "/industry",
      "/gallery",
      "/contact"
    ]);
    expect(siteContent.navigation.some((item) => item.path === "/about")).toBe(false);
  });

  it("no longer carries team or capability strip content", () => {
    expect("leadership" in siteContent).toBe(false);
    expect("capabilityStrip" in siteContent).toBe(false);
  });

  it("carries the brochure tagline used by the landing hero", () => {
    expect(siteContent.tagline).toContain("Many paths, one purpose");
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

  it("uses brochure-exact About the Centre copy", () => {
    expect(siteContent.aboutCentre).toHaveLength(2);
    expect(siteContent.aboutCentre[0]).toContain(
      "The Centre of Excellence in Advanced Manufacturing (CoE-AM) is a dedicated platform established to promote innovation"
    );
    expect(siteContent.aboutCentre[0]).toContain("Prof. Noam Eliaz");
    expect(siteContent.aboutCentre[1]).toContain(
      "Beyond research, CoE-AM is committed to creating a highly capable and industry-ready workforce"
    );
  });

  it("marks the director message as placeholder content", () => {
    expect(siteContent.directorMessage.heading).toBe("Message from Director, CoE-AM");
    expect(siteContent.directorMessage.paragraphs.length).toBeGreaterThan(0);
    expect(siteContent.directorMessage.paragraphs[0]).toContain("Lorem ipsum");
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
