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
    expect(claims.join(" ")).toContain("±2–5 microns");
  });

  it("keeps the primary collaboration contact focused on the centre mailbox", () => {
    expect(siteContent.contact.email).toBe("coeam@thapar.edu");
  });
});
