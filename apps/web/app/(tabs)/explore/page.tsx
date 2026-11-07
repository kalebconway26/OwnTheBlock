"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, Pill, Progress, SectionTitle } from "@/components/ui";
import { PlayIcon, SearchIcon } from "@/components/icons";
import Photo from "@/components/Photo";
import { PROJECTS, Project, Stage } from "@/lib/demo";
import { ProjectState, projectState, vote } from "@/lib/world";
import { EXPLORE_FILTERS, ExploreFilter, matchesFilter } from "@/lib/world/explore";
import { setWorld, useWorld } from "@/lib/world/store";
import { fmt0, pct } from "@/lib/finance";



const PIPELINE: Stage[] = ["Proposed", "Under review", "Community vote", "Raising", "Renovating", "Operating"];

export default function ExplorePage() {
  const w = useWorld();
  const [filter, setFilter] = useState<ExploreFilter>("all");
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const isPitch = (s: ProjectState) => s.stage === "Proposed" || s.stage === "Under review" || s.stage === "Community vote";
  const live = PROJECTS.filter((p) => !isPitch(projectState(w, p.id)));
  const pitch = PROJECTS.filter((p) => isPitch(projectState(w, p.id)));
  const shown = live
    .filter((p) => matchesFilter(p, projectState(w, p.id).stage, filter))
    .filter((p) => !query || `${p.name} ${p.neighborhood} ${p.type}`.toLowerCase().includes(query))
    // Open raises first: that's where your money can go today.
    .sort((a, b) => Number(projectState(w, b.id).stage === "Raising") - Number(projectState(w, a.id).stage === "Raising"));

  return (
    <main className="px-4">
      <header className="pt-4">
        <h1 className="text-2xl font-extrabold tracking-tight">Explore</h1>
        <p className="text-muted">Homes, businesses and spaces around NC A&amp;T and Bennett College</p>
      </header>

      <label className="mt-3 flex min-h-12 items-center gap-2 rounded-xl bg-card px-3 text-muted focus-within:ring-2 focus-within:ring-green">
        <SearchIcon />
        <span className="sr-only">Search properties</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or neighborhood"
          className="h-12 w-full bg-transparent text-base text-ink outline-none placeholder:text-muted"
        />
      </label>

      <Link href="/simulate" className="mt-3 flex items-center gap-3 rounded-2xl bg-green p-3.5 text-white">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15">
          <PlayIcon className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-extrabold">Block Simulator</span>
          <span className="block text-sm text-white/80">Try buying and fixing a house before you invest</span>
        </span>
        <span className="text-gold" aria-hidden>→</span>
      </Link>

      <BlockMap />

      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4" role="group" aria-label="Filters">
        {EXPLORE_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className={`min-h-11 shrink-0 rounded-xl px-4 text-sm font-bold ${filter === f.id ? "bg-green text-white" : "bg-card text-ink"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-3">
        {shown.map((p) => (
          <ProjectCard key={p.id} p={p} s={projectState(w, p.id)} month={w.month} />
        ))}
        {shown.length === 0 && <p className="rounded-2xl bg-card p-4 text-center text-sm text-muted">{query ? <>No properties match &ldquo;{q}&rdquo;.</> : "Nothing here right now."}</p>}
      </div>

      <SectionTitle>Community Pitch Board</SectionTitle>
      <p className="-mt-1 mb-2 text-sm text-muted">Neighbors propose projects. The community votes, OwnTheBlock checks the numbers, then the raise opens.</p>
      <div className="space-y-3">
        {pitch.map((p) => {
          const s = projectState(w, p.id);
          const my = w.votes[p.id];
          return (
            <Card key={p.id} className="overflow-hidden p-0">
              <Link href={`/project/${p.id}`} className="flex gap-3 p-3">
                <Photo id={p.photos[0]} alt="" className="size-20 shrink-0 rounded-xl" sizes="80px" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold leading-tight">{p.name}</p>
                    <Pill tone="gold">{s.stage}</Pill>
                  </div>
                  <p className="text-sm text-muted">{p.neighborhood}</p>
                  <p className="mt-1 text-sm">
                    Raise opens {p.start.opensMonth !== undefined && p.start.opensMonth > w.month ? `in ${p.start.opensMonth - w.month} mo` : "soon"} · goal {fmt0(p.raiseGoal)}
                  </p>
                </div>
              </Link>
              <ol className="flex gap-1 px-3" aria-label={`Status: ${s.stage}`}>
                {PIPELINE.map((st, k) => (
                  <li key={st} className={`h-1.5 flex-1 rounded-full ${k <= PIPELINE.indexOf(s.stage) ? "bg-gold" : "bg-line"}`} title={st} />
                ))}
              </ol>
              {s.stage === "Community vote" ? (
                <div className="flex items-center gap-2 p-3">
                  <p className="flex-1 text-sm">{my ? `You voted ${my}. Residents' votes count 1.5×.` : "Should the community fund this?"}</p>
                  {(["yes", "no"] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => setWorld(vote(w, p.id, c))}
                      aria-pressed={my === c}
                      className={`min-h-11 min-w-16 rounded-xl px-3 text-sm font-bold capitalize ${my === c ? "bg-green text-white" : "bg-paper text-ink"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="p-3 text-xs text-muted">Proposed → Under review → Community vote → Raising → Renovating → Operating</p>
              )}
            </Card>
          );
        })}
        {!pitch.length && <p className="text-sm text-muted">Every proposal has moved on to its raise. New pitches appear as neighbors submit them.</p>}
      </div>
    </main>
  );
}

function ProjectCard({ p, s, month }: { p: Project; s: ProjectState; month: number }) {
  const open = p.type === "fund" || s.stage === "Raising";
  const isFund = p.type === "fund";
  return (
    <Link href={`/project/${p.id}`} className="block">
      <Card className="overflow-hidden p-0">
        <Photo id={p.photos[0]} alt={p.name} className="h-44">
          <div className="absolute left-3 top-3 flex gap-1.5">
            <Pill tone={open ? "gold" : s.stage === "Refunded" ? "brick" : "green"}>{isFund ? "Always open" : s.stage}</Pill>
          </div>
        </Photo>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-lg font-bold leading-tight">{p.name}</p>
              <p className="text-sm text-muted">{p.neighborhood}</p>
            </div>
            <Pill tone={p.risk === "Low" ? "green" : p.risk === "Medium" ? "gold" : "brick"}>{p.risk} risk</Pill>
          </div>
          {isFund ? (
            <p className="mt-3 text-sm">
              <b>{fmt0(s.raised)}</b> invested by {s.investors.toLocaleString()} neighbors
            </p>
          ) : (
            <div className="mt-3">
              <Progress value={s.raised / p.raiseGoal} label={`${p.name} raise progress`} />
              <div className="mt-1 flex justify-between text-sm">
                <span>
                  <b>{fmt0(s.raised)}</b> of {fmt0(p.raiseGoal)}
                </span>
                <span className="text-muted">{s.stage === "Raising" && s.deadline !== null ? `closes in ${Math.max(0, s.deadline - month)} mo` : `${s.investors.toLocaleString()} investors`}</span>
              </div>
            </div>
          )}
          <p className="mt-2 text-sm">
            Est. yield <b className="text-gold-ink">{pct(p.yieldRange[0])} – {pct(p.yieldRange[1])}</b>
            <span className="text-muted"> a year · estimate</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {p.impactTags.map((t) => (
              <Pill key={t}>{t}</Pill>
            ))}
          </div>
        </div>
      </Card>
    </Link>
  );
}

/** Illustrated map until the Leaflet map lands in Milestone 4. */
function BlockMap() {
  const pins = [
    { id: "sample-st", x: 92, y: 70, c: "#14306b" },
    { id: "example-ave", x: 140, y: 52, c: "#14306b" },
    { id: "placeholder-ln", x: 70, y: 112, c: "#14306b" },
    { id: "demo-ct", x: 250, y: 118, c: "#14306b" },
    { id: "corner-cuts", x: 196, y: 82, c: "#d9a21b" },
    { id: "corner-market", x: 168, y: 120, c: "#d9a21b" },
    { id: "laundromat", x: 286, y: 54, c: "#6d8fb3" },
  ];
  return (
    <div className="mt-3 overflow-hidden rounded-2xl bg-[#eef2f7]">
      <svg viewBox="0 0 360 160" className="block w-full" role="img" aria-label="Map of project locations in Greensboro">
        <path d="M0 96 H360 M0 36 H360 M120 0 V160 M226 0 V160" stroke="#fff" strokeWidth={9} />
        <path d="M0 140 C 90 120, 200 160, 360 128" stroke="#cfe0ee" strokeWidth={12} fill="none" />
        <rect x={20} y={8} width={86} height={22} rx={4} fill="#dfe7f1" />
        <text x={63} y={23} fontSize={9} textAnchor="middle" fill="#5d6678" fontWeight={700}>
          NC A&amp;T
        </text>
        <rect x={250} y={8} width={92} height={22} rx={4} fill="#dfe7f1" />
        <text x={296} y={23} fontSize={9} textAnchor="middle" fill="#5d6678" fontWeight={700}>
          Bennett College
        </text>
        {pins.map((p) => (
          <a key={p.id} href={`/project/${p.id}`} aria-label={PROJECTS.find((x) => x.id === p.id)?.name}>
            <circle cx={p.x} cy={p.y} r={14} fill="transparent" />
            <path d={`M${p.x} ${p.y + 9} l-7 -10 a8 8 0 1 1 14 0 z`} fill={p.c} stroke="#fff" strokeWidth={1.5} />
            <circle cx={p.x} cy={p.y - 4} r={2.5} fill="#fff" />
          </a>
        ))}
      </svg>
      <div className="flex gap-3 px-3 pb-2 text-xs text-muted">
        <span>
          <b className="text-green">●</b> Homes
        </span>
        <span>
          <b className="text-gold">●</b> Businesses
        </span>
        <span>
          <b className="text-[#6d8fb3]">●</b> Proposed spaces
        </span>
      </div>
    </div>
  );
}
