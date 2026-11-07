"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui";
import { ShieldIcon } from "@/components/icons";
import { photo } from "@/lib/photos";
import Logo from "@/components/Logo";

// Each slide: a photo card on top, with one floating "app card" that previews what the slide promises.
const SLIDES = [
  {
    title: "Own a piece of your block.",
    body: "Invest as little as $10 in the homes and businesses in your own neighborhood.",
    img: "street",
    chip: { label: "Starting at", value: "$10", note: "per share" },
  },
  {
    title: "Watch your money work.",
    body: "Follow every dollar from your phone into a house, and back to you as rent.",
    img: "sample-st",
    chip: { label: "Rent paid to you", value: "+$4.12", note: "this month" },
  },
  {
    title: "Learn as you earn.",
    body: "Two-minute lessons teach investing and blockchain right when you need them.",
    img: "porch",
    chip: { label: "Lesson 1 of 8", value: "2 min", note: "What is a share?" },
  },
];

export default function Welcome() {
  const [i, setI] = useState(0);
  const slide = SLIDES[i];
  const last = i === SLIDES.length - 1;
  const go = (k: number) => setI(Math.max(0, Math.min(SLIDES.length - 1, k)));

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col bg-paper text-ink">
      {/* Photo card */}
      <div className="flex flex-1 flex-col px-4 pt-3">
        <motion.div
          className="relative min-h-[240px] flex-1 overflow-hidden rounded-[28px] bg-green"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={(_, info) => {
            if (info.offset.x < -50) go(i + 1);
            if (info.offset.x > 50) go(i - 1);
          }}
        >
          <AnimatePresence initial={false}>
            <motion.div
              key={slide.img}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Image src={photo(slide.img)} alt="" fill priority sizes="448px" className="pointer-events-none object-cover" />
            </motion.div>
          </AnimatePresence>
          {/* light shade only behind the logo */}
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ink/55 to-transparent" />
          <div className="absolute left-5 top-5">
            <Logo size="md" light />
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="absolute bottom-4 left-4 flex items-center gap-3 rounded-2xl bg-paper/95 py-2.5 pl-3 pr-4 shadow-lg shadow-ink/20 backdrop-blur"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-gold-soft text-lg font-extrabold text-gold-ink">$</span>
              <span className="leading-tight">
                <span className="block text-xs font-medium text-muted">{slide.chip.label}</span>
                <span className="text-lg font-extrabold text-ink">{slide.chip.value}</span>{" "}
                <span className="text-xs text-muted">{slide.chip.note}</span>
              </span>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Text + actions */}
      <div className="flex flex-col px-6 pb-6 pt-5">
        <div className="flex gap-1.5" role="tablist" aria-label="Intro slides">
          {SLIDES.map((s, k) => (
            <button
              key={k}
              role="tab"
              aria-selected={k === i}
              aria-label={`Slide ${k + 1}: ${s.title}`}
              onClick={() => setI(k)}
              className="flex h-6 items-center"
            >
              <span className={`block h-1.5 rounded-full transition-all duration-300 ${k === i ? "w-7 bg-green" : "w-1.5 bg-green/20"}`} />
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
            className="mt-3"
          >
            <h1 className="text-[34px] font-extrabold leading-[1.1] tracking-tight text-green">{slide.title}</h1>
            <p className="mt-3 text-[17px] leading-relaxed text-muted">{slide.body}</p>
          </motion.div>
        </AnimatePresence>

        <div className="space-y-2 pt-6">
          <Button variant="primary" href="/home" className="h-14 w-full rounded-2xl text-[17px] shadow-lg shadow-green/25">
            Try the demo with $500 pretend
          </Button>
          {last ? (
            <Button variant="ghost" href="/simulate" className="h-12 w-full text-green">
              Watch the Block Simulator
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => go(i + 1)} className="h-12 w-full text-green">
              Next
            </Button>
          )}
          <p className="flex items-start justify-center gap-1.5 text-center text-xs leading-relaxed text-muted">
            <ShieldIcon className="mt-0.5 size-3.5 shrink-0" />
            <span>No signup, pretend money only. We&apos;ll never ask for your login code by text or DM.</span>
          </p>
        </div>
      </div>
    </main>
  );
}
