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

  it("defines a multipage route model instead of one long anchored page", () => {
    expect(siteContent.navigation.map((item) => item.path)).toEqual([
      "/",
      "/about",
      "/facilities",
      "/research",
      "/industry",
      "/gallery",
      "/contact"
    ]);
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
});
