import { describe, expect, it } from "vitest";
import { nextIndex, prevIndex } from "./carousel";

describe("carousel index math", () => {
  it("advances to the next index", () => {
    expect(nextIndex(0, 6)).toBe(1);
    expect(nextIndex(4, 6)).toBe(5);
  });

  it("wraps to zero after the last index", () => {
    expect(nextIndex(5, 6)).toBe(0);
  });

  it("goes back to the previous index", () => {
    expect(prevIndex(3, 6)).toBe(2);
  });

  it("wraps to the last index when going back from zero", () => {
    expect(prevIndex(0, 6)).toBe(5);
  });

  it("handles a single-item carousel without dividing by zero", () => {
    expect(nextIndex(0, 1)).toBe(0);
    expect(prevIndex(0, 1)).toBe(0);
  });
});
