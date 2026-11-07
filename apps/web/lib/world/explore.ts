import type { Project, Stage } from "../demo";

export type ExploreFilter = "all" | "raising" | "renting" | "business" | "fund";

export const EXPLORE_FILTERS: { id: ExploreFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "raising", label: "Raising" },
  { id: "renting", label: "Renting" },
  { id: "business", label: "Businesses" },
  { id: "fund", label: "Fund" },
];

/** Which Explore chip a project belongs to. "Renting" = homes that are rented out (Operating). */
export function matchesFilter(p: Pick<Project, "type">, stage: Stage, f: ExploreFilter): boolean {
  switch (f) {
    case "all":
      return true;
    case "raising":
      return stage === "Raising";
    case "renting":
      return p.type === "home" && stage === "Operating";
    case "business":
      return p.type === "business";
    case "fund":
      return p.type === "fund";
  }
}
