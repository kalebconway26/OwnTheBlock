"use client";

import { motion } from "framer-motion";
import { ASSETS, AssetId, AssetState, BuildingStatus } from "@/lib/sim";

// Visual order along the street (left to right) and how each building is drawn.
const SLOTS: { id: AssetId; shape: "house" | "shop" | "lot"; color: string; h: number; sign?: string }[] = [
  { id: "sample-st", shape: "house", color: "#e3a92f", h: 66 },
  { id: "corner-cuts", shape: "shop", color: "#a23b2a", h: 58, sign: "CUTS" },
  { id: "example-ave", shape: "house", color: "#7fb08f", h: 74 },
  { id: "corner-store", shape: "shop", color: "#2f7a50", h: 62, sign: "MARKET" },
  { id: "market-lot", shape: "lot", color: "#e3a92f", h: 30 },
  { id: "laundromat", shape: "shop", color: "#6d8fb3", h: 60, sign: "WASH" },
  { id: "demo-ct", shape: "house", color: "#d98b6a", h: 70 },
];

const W = 360;
const H = 176;
const BASE = 140; // sidewalk line
const SLOT_W = W / SLOTS.length;
const BW = 42; // building width

const STATUS_TEXT: Record<BuildingStatus, string> = {
  unfunded: "Owned by outside investors / vacant",
  raising: "Raising money",
  renovating: "Being renovated",
  operating: "Open and earning",
  vacant: "Empty, looking for a tenant",
  sold: "Sold",
  closed: "Closed",
  paidOff: "Paid investors back in full",
};

export const statusText = (s: BuildingStatus) => STATUS_TEXT[s];

const fresh = (s: BuildingStatus) => s === "renovating" || s === "operating" || s === "vacant" || s === "sold" || s === "paidOff" || s === "closed";
const lit = (s: BuildingStatus) => s === "operating" || s === "paidOff";

export default function Street({
  assets,
  onSelect,
  highlight,
}: {
  assets: Pick<AssetState, "id" | "status" | "raised">[];
  onSelect?: (id: AssetId) => void;
  highlight?: AssetId;
}) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="Illustrated street with seven buildings">
      <defs>
        <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#dcebf1" />
          <stop offset="1" stopColor="#f7f1e3" />
        </linearGradient>
      </defs>
      <rect width={W} height={BASE} fill="url(#sky)" />
      <circle cx={318} cy={26} r={13} fill="#f3c766" opacity={0.85} />
      {/* sidewalk + street */}
      <rect y={BASE} width={W} height={10} fill="#d9cfbb" />
      <rect y={BASE + 10} width={W} height={H - BASE - 10} fill="#5c6660" />
      {Array.from({ length: 9 }).map((_, i) => (
        <rect key={i} x={i * 42 + 8} y={BASE + 20} width={22} height={3} rx={1.5} fill="#e9e1cf" />
      ))}

      {SLOTS.map((slot, i) => {
        const a = assets.find((x) => x.id === slot.id);
        if (!a) return null;
        const def = ASSETS.find((d) => d.id === slot.id)!;
        const x = i * SLOT_W + (SLOT_W - BW) / 2;
        const progress = Math.min(1, a.raised / def.raise);
        return (
          <g
            key={slot.id}
            role="button"
            tabIndex={0}
            aria-label={`${def.name}: ${STATUS_TEXT[a.status]}`}
            onClick={() => onSelect?.(slot.id)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect?.(slot.id)}
            style={{ cursor: onSelect ? "pointer" : undefined, outline: "none" }}
          >
            {highlight === slot.id && (
              <motion.rect
                x={x - 4}
                y={BASE - slot.h - 26}
                width={BW + 8}
                height={slot.h + 30}
                rx={6}
                fill="none"
                stroke="#e3a92f"
                strokeWidth={2.5}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.6 }}
              />
            )}
            <Building shape={slot.shape} color={slot.color} h={slot.h} x={x} status={a.status} sign={slot.sign} />
            {a.status === "raising" && (
              <g>
                <rect x={x} y={BASE - slot.h - 22} width={BW} height={5} rx={2.5} fill="#ffffff" stroke="#c9bfa9" strokeWidth={0.5} />
                <motion.rect x={x} y={BASE - slot.h - 22} height={5} rx={2.5} fill="#1e5b3a" initial={false} animate={{ width: Math.max(2, BW * progress) }} />
              </g>
            )}
            {lit(a.status) && <People x={x} seed={i} />}
          </g>
        );
      })}
    </svg>
  );
}

function Building({ shape, color, h, x, status, sign }: { shape: "house" | "shop" | "lot"; color: string; h: number; x: number; status: BuildingStatus; sign?: string }) {
  const isFresh = fresh(status);
  const body = isFresh ? color : "#b9b3a6";
  const trim = isFresh ? "#fbf6ec" : "#8e877a";
  const y = BASE - h;
  const windowFill = lit(status) ? "#ffd979" : status === "vacant" || status === "closed" || status === "sold" ? "#4c5650" : "#6f675c";
  const boarded = !isFresh;

  if (shape === "lot") {
    const open = lit(status);
    return (
      <g>
        <rect x={x - 2} y={BASE - 4} width={BW + 4} height={4} fill={open ? "#8cbf7a" : "#a69c84"} />
        {open ? (
          <>
            {[0, 1].map((k) => (
              <g key={k}>
                <path d={`M${x + 2 + k * 21} ${BASE - 18} l9 -8 l9 8 z`} fill={k ? "#e3a92f" : "#a23b2a"} />
                <rect x={x + 3 + k * 21} y={BASE - 18} width={16} height={14} fill="#fbf6ec" />
                <rect x={x + 5 + k * 21} y={BASE - 12} width={12} height={4} fill="#7fb08f" />
              </g>
            ))}
          </>
        ) : (
          <>
            {Array.from({ length: 8 }).map((_, k) => (
              <rect key={k} x={x + k * 6} y={BASE - 16} width={2} height={12} fill="#8e877a" />
            ))}
            <rect x={x - 1} y={BASE - 13} width={BW + 2} height={2} fill="#8e877a" />
            {status === "renovating" || status === "raising" ? (
              <rect x={x + 10} y={BASE - 26} width={22} height={9} rx={1} fill="#fbf6ec" stroke="#8e877a" strokeWidth={0.5} />
            ) : (
              <path d={`M${x + 8} ${BASE - 4} q3 -8 6 0 M${x + 26} ${BASE - 4} q3 -9 6 0`} stroke="#7a8c5f" strokeWidth={1.5} fill="none" />
            )}
          </>
        )}
      </g>
    );
  }

  return (
    <g>
      {shape === "house" ? (
        <>
          <motion.rect x={x} y={y + 14} width={BW} height={h - 14} initial={false} animate={{ fill: body }} transition={{ duration: 0.8 }} />
          <motion.path d={`M${x - 4} ${y + 16} L${x + BW / 2} ${y - 2} L${x + BW + 4} ${y + 16} Z`} initial={false} animate={{ fill: isFresh ? "#3b4a41" : "#857e72" }} transition={{ duration: 0.8 }} />
          <rect x={x + BW / 2 - 5} y={BASE - 18} width={10} height={18} fill={isFresh ? "#1e5b3a" : "#6f675c"} />
        </>
      ) : (
        <>
          <motion.rect x={x} y={y} width={BW} height={h} initial={false} animate={{ fill: body }} transition={{ duration: 0.8 }} />
          <rect x={x - 2} y={y - 3} width={BW + 4} height={5} fill={trim} />
          {/* awning */}
          <g opacity={isFresh ? 1 : 0.35}>
            {Array.from({ length: 6 }).map((_, k) => (
              <rect key={k} x={x + k * 7} y={BASE - 30} width={7} height={6} fill={k % 2 ? "#fbf6ec" : color} />
            ))}
          </g>
          {sign && (
            <text x={x + BW / 2} y={y + 11} textAnchor="middle" fontSize={6.5} fontWeight={800} fill={isFresh ? "#fbf6ec" : "#efe9dc"} letterSpacing={0.5}>
              {sign}
            </text>
          )}
          <rect x={x + 4} y={BASE - 22} width={BW - 8} height={14} fill={windowFill} />
          <rect x={x + BW / 2 - 4} y={BASE - 22} width={8} height={22} fill={isFresh ? "#3b4a41" : "#6f675c"} />
        </>
      )}

      {/* upper windows */}
      {[0, 1].map((k) => {
        const wx = x + 7 + k * 19;
        const wy = shape === "house" ? y + 22 : y + 18;
        return (
          <g key={k}>
            <motion.rect x={wx} y={wy} width={9} height={11} initial={false} animate={{ fill: windowFill }} transition={{ duration: 0.8 }} />
            {boarded && <path d={`M${wx - 1} ${wy + 2} l11 7 M${wx - 1} ${wy + 9} l11 -7`} stroke="#8a6a46" strokeWidth={2} />}
          </g>
        );
      })}

      {/* scaffolding while raising or renovating */}
      {(status === "raising" || status === "renovating") && (
        <g stroke="#8a6a46" strokeWidth={1.2} opacity={0.9}>
          <path d={`M${x - 3} ${BASE} V${y + 4} M${x + BW + 3} ${BASE} V${y + 4}`} />
          {[0.25, 0.5, 0.75].map((f) => (
            <path key={f} d={`M${x - 3} ${y + h * f + 4} H${x + BW + 3}`} />
          ))}
          <path d={`M${x - 3} ${BASE} L${x + BW + 3} ${y + h / 2}`} strokeWidth={0.8} />
        </g>
      )}

      {status === "vacant" && <Tag x={x} y={BASE - 14} text="FOR RENT" fill="#a23b2a" />}
      {status === "sold" && <Tag x={x} y={BASE - 14} text="SOLD" fill="#1e5b3a" />}
      {status === "closed" && (
        <>
          <rect x={x + 4} y={BASE - 22} width={BW - 8} height={14} fill="#7d8580" />
          <Tag x={x} y={BASE - 14} text="CLOSED" fill="#a23b2a" />
        </>
      )}
      {status === "paidOff" && <Tag x={x} y={y - 10} text="PAID ✓" fill="#1e5b3a" />}
      {!isFresh && status === "unfunded" && shape === "house" && <Tag x={x} y={BASE - 14} text="LLC OUT OF STATE" fill="#857e72" small />}
    </g>
  );
}

function Tag({ x, y, text, fill, small }: { x: number; y: number; text: string; fill: string; small?: boolean }) {
  return (
    <g>
      <rect x={x + 1} y={y - 7} width={BW - 2} height={9} rx={2} fill={fill} />
      <text x={x + BW / 2} y={y} textAnchor="middle" fontSize={small ? 4.2 : 5.5} fontWeight={800} fill="#fff">
        {text}
      </text>
    </g>
  );
}

function People({ x, seed }: { x: number; seed: number }) {
  const colors = ["#a23b2a", "#1e5b3a", "#6d8fb3", "#e3a92f"];
  return (
    <g>
      {[0, 1].map((k) => {
        const px = x + 6 + k * 26 + (seed % 3) * 2;
        const c = colors[(seed + k) % colors.length];
        return (
          <motion.g key={k} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + k * 0.2 }}>
            <circle cx={px} cy={BASE + 1} r={2.4} fill="#4a3426" />
            <rect x={px - 2.5} y={BASE + 3} width={5} height={6} rx={2} fill={c} />
          </motion.g>
        );
      })}
    </g>
  );
}
