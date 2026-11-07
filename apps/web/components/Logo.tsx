/** The OwnTheBlock mark: four rounded "blocks", the one you own in gold. */
export function LogoMark({ size = 16, light = false }: { size?: number; light?: boolean }) {
  const c = size / 2 - 1;
  const blk = light ? "#ffffff" : "var(--green)";
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={(i % 2) * (c + 2)} y={Math.floor(i / 2) * (c + 2)} width={c} height={c} rx={c * 0.3} fill={i === 3 ? "var(--gold)" : blk} />
      ))}
    </svg>
  );
}

export default function Logo({ size = "sm", light = false }: { size?: "sm" | "md" | "lg"; light?: boolean }) {
  const px = { sm: 16, md: 22, lg: 34 }[size];
  const text = { sm: "text-[15px]", md: "text-xl", lg: "text-3xl" }[size];
  return (
    <span className={`inline-flex items-center gap-2 font-extrabold tracking-tight ${text} ${light ? "text-white" : "text-ink"}`}>
      <LogoMark size={px} light={light} />
      OwnTheBlock
    </span>
  );
}
