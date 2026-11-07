import { describe, expect, it } from "vitest";
import { PROJECTS } from "../demo";
import { initialWorld, projectState } from "./index";
import { matchesFilter } from "./explore";

const w = initialWorld();
const ids = (f: Parameters<typeof matchesFilter>[2]) => PROJECTS.filter((p) => matchesFilter(p, projectState(w, p.id).stage, f)).map((p) => p.id);

describe("Explore filters (All · Raising · Renting · Businesses · Fund)", () => {
  it("Raising = open raises", () => {
    expect(ids("raising")).toContain("example-ave");
    expect(ids("raising")).not.toContain("sample-st");
  });
  it("Renting = homes already rented out", () => {
    expect(ids("renting")).toContain("sample-st");
    expect(ids("renting")).not.toContain("example-ave");
    expect(ids("renting")).not.toContain("corner-cuts");
  });
  it("Businesses and Fund by type", () => {
    expect(ids("business")).toContain("corner-cuts");
    expect(ids("fund")).toEqual(["fund"]);
  });
  it("All includes everything", () => {
    expect(ids("all").length).toBe(PROJECTS.length);
  });
});
