"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ReactNode, useEffect, useId } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  // Default to a white card unless the caller picks its own background.
  const bg = /(^|\s)bg-/.test(className) ? "" : "bg-card";
  const pad = /(^|\s)p-\S+/.test(className) ? "" : "p-4";
  return <div className={`rounded-2xl ${pad} ${bg} ${className}`}>{children}</div>;
}

type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "gold" | "soft";
  href?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
  "aria-label"?: string;
};

const variants = {
  primary: "bg-green text-white active:bg-green-2",
  gold: "bg-gold text-ink active:brightness-95",
  soft: "bg-card text-green active:bg-green-soft",
  secondary: "bg-paper text-green border-2 border-green active:bg-green-soft",
  ghost: "text-green underline-offset-4 hover:underline",
};

/** 48px tall minimum so every button is an easy thumb target (spec: 44px minimum). */
export function Button({ children, variant = "primary", href, onClick, className = "", disabled, type = "button", ...rest }: ButtonProps) {
  const cls = `inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-base font-bold transition disabled:opacity-40 ${variants[variant]} ${className}`;
  if (href)
    return (
      <Link href={href} className={cls} aria-label={rest["aria-label"]}>
        {children}
      </Link>
    );
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled} aria-label={rest["aria-label"]}>
      {children}
    </button>
  );
}

export function Pill({ children, tone = "green" }: { children: ReactNode; tone?: "green" | "gold" | "brick" | "gray" | "pos" }) {
  const t = {
    green: "bg-green-soft text-green",
    pos: "bg-pos-soft text-pos",
    gold: "bg-gold-soft text-gold-ink",
    brick: "bg-brick-soft text-brick",
    gray: "bg-line/60 text-muted",
  }[tone];
  return <span className={`inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-bold ${t}`}>{children}</span>;
}

export function Progress({ value, tone = "green", label }: { value: number; tone?: "green" | "gold"; label: string }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v * 100)} className="h-2.5 w-full overflow-hidden rounded-full bg-line">
      <div className={`h-full rounded-full transition-[width] duration-500 ${tone === "gold" ? "bg-gold" : "bg-green"}`} style={{ width: `${v * 100}%` }} />
    </div>
  );
}

/** Bottom sheet used for every explainer ("What is USDC?", "How is this calculated?"). */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const id = useId();
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby={id}>
          <motion.button
            aria-label="Close"
            className="absolute inset-0 bg-ink/40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-paper px-5 pt-3 pb-8 pb-safe"
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 id={id} className="text-lg font-bold">
                {title}
              </h2>
              <button onClick={onClose} className="-mr-2 -mt-1 grid size-11 place-items-center rounded-full text-2xl text-muted" aria-label="Close">
                ×
              </button>
            </div>
            <div className="space-y-3 text-[15px] leading-relaxed">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function DemoBanner({ children = "Demo using test money. No real dollars are invested." }: { children?: ReactNode }) {
  return (
    <div className="sticky top-0 z-40 bg-green px-4 py-1.5 text-center text-xs font-semibold text-white" role="status">
      {children}
    </div>
  );
}

export function Disclosure() {
  return (
    <p className="text-xs leading-relaxed text-muted">
      Estimates, not guarantees. You can lose some or all of your investment. Past results don&apos;t predict future results.
    </p>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 mt-6 flex items-end justify-between">
      <h2 className="text-[17px] font-extrabold tracking-tight">{children}</h2>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, back }: { title: string; subtitle?: string; back?: string }) {
  return (
    <header className="px-4 pt-4 pb-2">
      {back && (
        <Link href={back} className="-ml-2 mb-1 inline-flex min-h-11 items-center px-2 text-sm font-semibold text-green">
          ← Back
        </Link>
      )}
      <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
    </header>
  );
}
