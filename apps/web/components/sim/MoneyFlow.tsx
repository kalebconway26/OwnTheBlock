"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Flow, NodeId } from "@/lib/sim";
import { fmt } from "@/lib/finance";

// Solid boxes are on-chain (smart contracts and wallets); dashed boxes happen in
// the real world and are proven with documents (spec section 4 diagram).
const NODES: Record<NodeId, { x: number; y: number; label: string; onchain: boolean }> = {
  you: { x: 52, y: 26, label: "You", onchain: true },
  escrow: { x: 180, y: 26, label: "Escrow", onchain: true },
  tenants: { x: 52, y: 104, label: "Tenants", onchain: false },
  llc: { x: 180, y: 104, label: "Property LLC", onchain: true },
  expenses: { x: 308, y: 70, label: "Expenses", onchain: false },
  reserve: { x: 308, y: 140, label: "Reserve", onchain: true },
  distributor: { x: 180, y: 184, label: "Distributor", onchain: true },
  investors: { x: 52, y: 184, label: "Investors", onchain: true },
};

type EdgeKey = `${NodeId}>${NodeId}`;

// Hand-placed curves so lines never cross labels.
const EDGES: Partial<Record<EdgeKey, string>> = {
  "you>escrow": "M84 26 L148 26",
  "investors>escrow": "M52 170 C 110 150, 120 60, 150 34",
  "escrow>llc": "M180 40 L180 90",
  "tenants>llc": "M84 104 L140 104",
  "llc>expenses": "M220 98 Q 262 74 276 70",
  "llc>reserve": "M220 110 Q 262 136 276 140",
  "reserve>expenses": "M308 128 L308 82",
  "llc>distributor": "M180 118 L180 170",
  "distributor>you": "M150 180 C 110 160, 100 70, 70 40",
  "distributor>investors": "M148 184 L84 184",
  "llc>you": "M150 98 Q 110 60 72 38",
};

const STAGE: Partial<Record<EdgeKey, number>> = {
  "you>escrow": 0,
  "investors>escrow": 0,
  "tenants>llc": 0,
  "escrow>llc": 1,
  "llc>expenses": 1,
  "llc>reserve": 1,
  "reserve>expenses": 1,
  "llc>distributor": 1,
  "llc>you": 1,
  "distributor>you": 2,
  "distributor>investors": 2,
};

/** Sample points along an SVG path string (M/L/Q/C only) so coins can follow it. */
function samplePath(d: string, n = 14): { x: number[]; y: number[] } {
  const nums = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
  const cmd = d.match(/[MLQC]/g)!;
  const pts: [number, number][] = [];
  let i = 0;
  let cur: [number, number] = [0, 0];
  for (const c of cmd) {
    if (c === "M") {
      cur = [nums[i++], nums[i++]];
      pts.push(cur);
    } else if (c === "L") {
      const to: [number, number] = [nums[i++], nums[i++]];
      for (let k = 1; k <= n; k++) pts.push([cur[0] + ((to[0] - cur[0]) * k) / n, cur[1] + ((to[1] - cur[1]) * k) / n]);
      cur = to;
    } else if (c === "Q") {
      const c1 = [nums[i++], nums[i++]];
      const to: [number, number] = [nums[i++], nums[i++]];
      for (let k = 1; k <= n; k++) {
        const t = k / n;
        pts.push([(1 - t) ** 2 * cur[0] + 2 * (1 - t) * t * c1[0] + t * t * to[0], (1 - t) ** 2 * cur[1] + 2 * (1 - t) * t * c1[1] + t * t * to[1]]);
      }
      cur = to;
    } else if (c === "C") {
      const c1 = [nums[i++], nums[i++]];
      const c2 = [nums[i++], nums[i++]];
      const to: [number, number] = [nums[i++], nums[i++]];
      for (let k = 1; k <= n; k++) {
        const t = k / n;
        const u = 1 - t;
        pts.push([
          u ** 3 * cur[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t ** 3 * to[0],
          u ** 3 * cur[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t ** 3 * to[1],
        ]);
      }
      cur = to;
    }
  }
  return { x: pts.map((p) => p[0]), y: pts.map((p) => p[1]) };
}

const SAMPLED = Object.fromEntries(Object.entries(EDGES).map(([k, d]) => [k, samplePath(d!)])) as Record<EdgeKey, { x: number[]; y: number[] }>;

export default function MoneyFlow({ flows, tick, duration = 0.9, pulse }: { flows: Flow[]; tick: number; duration?: number; pulse?: NodeId }) {
  const reduce = useReducedMotion();
  const totals = new Map<EdgeKey, number>();
  for (const f of flows) {
    const k = `${f.from}>${f.to}` as EdgeKey;
    totals.set(k, (totals.get(k) ?? 0) + f.amount);
  }
  const max = Math.max(1, ...totals.values());
  const width = (amt: number) => 1.5 + 6 * Math.sqrt(amt / max);

  // One coin per edge per month (the biggest flow), labeled for the ones that touch you.
  const coins = [...totals.entries()].filter(([k]) => EDGES[k]);

  return (
    <svg viewBox="0 0 360 206" className="block w-full" role="img" aria-label={describe(flows)}>
      {Object.entries(EDGES).map(([k, d]) => {
        const active = totals.get(k as EdgeKey);
        return (
          <path
            key={k}
            d={d}
            fill="none"
            stroke={active ? (k.endsWith(">you") ? "#d9a21b" : "#2f7a50") : "#d8cfbd"}
            strokeWidth={active ? width(active) : 1.2}
            strokeLinecap="round"
            opacity={active ? 0.75 : 0.6}
            style={{ transition: "stroke-width 300ms, stroke 300ms" }}
          />
        );
      })}

      {Object.entries(NODES).map(([id, n]) => (
        <g key={id}>
          {pulse === id && !reduce && (
            <motion.rect x={n.x - 39} y={n.y - 13} width={78} height={26} rx={9} fill="#d9a21b" animate={{ opacity: [0.15, 0.5, 0.15] }} transition={{ repeat: Infinity, duration: 1.4 }} />
          )}
          <rect
            x={n.x - 36}
            y={n.y - 11}
            width={72}
            height={22}
            rx={7}
            fill={id === "you" ? "#14306b" : "#ffffff"}
            stroke={n.onchain ? "#14306b" : "#8e877a"}
            strokeWidth={1.4}
            strokeDasharray={n.onchain ? undefined : "4 3"}
          />
          <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={id === "you" ? "#ffffff" : "#1d2a22"}>
            {n.label}
          </text>
        </g>
      ))}

      {!reduce &&
        coins.map(([k, amt]) => {
          const p = SAMPLED[k];
          const stage = STAGE[k] ?? 1;
          const mine = k.endsWith(">you") || k.startsWith("you>");
          return (
            <motion.g
              key={`${tick}-${k}`}
              initial={{ opacity: 0, x: p.x[0], y: p.y[0] }}
              animate={{ opacity: [0, 1, 1, 0], x: p.x, y: p.y }}
              transition={{ duration, delay: stage * duration * 0.9, ease: "easeInOut" }}
            >
              <circle r={mine ? 7 : 5.5} fill={mine ? "#d9a21b" : "#f3c766"} stroke="#8a6400" strokeWidth={1} />
              <text y={2.5} textAnchor="middle" fontSize={7} fontWeight={900} fill="#8a6400">
                $
              </text>
              {mine && (
                <text y={-10} textAnchor="middle" fontSize={8.5} fontWeight={800} fill="#8a6400" stroke="#ffffff" strokeWidth={3} paintOrder="stroke">
                  {fmt(amt)}
                </text>
              )}
            </motion.g>
          );
        })}

      <g fontSize={8} fill="#5d6678">
        <rect x={244} y={190} width={10} height={7} rx={2} fill="#fff" stroke="#14306b" />
        <text x={258} y={197}>on-chain</text>
        <rect x={296} y={190} width={10} height={7} rx={2} fill="#fff" stroke="#8e877a" strokeDasharray="2 2" />
        <text x={310} y={197}>real world</text>
      </g>
    </svg>
  );
}

function describe(flows: Flow[]) {
  if (!flows.length) return "Money flow diagram. No money moved this month.";
  return "Money flow this month: " + flows.slice(0, 6).map((f) => `${fmt(f.amount)} from ${NODES[f.from].label} to ${NODES[f.to].label}`).join("; ");
}
