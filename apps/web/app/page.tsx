"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui";
import { ShieldIcon } from "@/components/icons";
import { photo } from "@/lib/photos";
import Logo from "@/components/Logo";

const SLIDES = [
  { title: "Own a piece of your block.", body: "Invest as little as $10 in the homes and businesses in your own neighborhood.", img: "street" },
  { title: "Watch your money work.", body: "Follow every dollar from your phone into a house, and back to you as rent.", img: "sample-st" },
  { title: "Learn as you earn.", body: "Two-minute lessons teach investing and blockchain right when you need them.", img: "porch" },
];

export default function Welcome() {
  const [i, setI] = useState(0);
  const slide = SLIDES[i];
  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col overflow-hidden bg-green text-white">
      {/* Full-bleed photo with a dark fade so text stays readable */}
      <AnimatePresence initial={false}>
        <motion.div key={slide.img} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
          <Image src={photo(slide.img)} alt="" fill priority sizes="448px" className="object-cover" />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/15 via-35% to-green" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-green via-green/90 to-transparent" />

      <div className="relative flex flex-1 flex-col px-6 pb-8 pt-10">
        <Logo size="md" light />
        <div className="flex flex-1 flex-col justify-end pb-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={i} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
              <h1 className="text-4xl font-extrabold leading-tight [text-shadow:0_1px_8px_rgb(0_0_0/0.35)]">{slide.title}</h1>
              <p className="mt-3 text-lg text-white/90">{slide.body}</p>
            </motion.div>
          </AnimatePresence>
          <div className="mt-6 flex gap-2" role="tablist" aria-label="Intro slides">
            {SLIDES.map((s, k) => (
              <button key={k} role="tab" aria-selected={k === i} aria-label={`Slide ${k + 1}: ${s.title}`} onClick={() => setI(k)} className="grid min-h-11 min-w-11 place-items-center">
                <span className={`block h-2 rounded-full transition-all ${k === i ? "w-8 bg-gold" : "w-2 bg-white/50"}`} />
              </button>
            ))}
          </div>
        </div>

        <p className="mb-5 text-center text-sm italic text-white/85">&ldquo;Don&apos;t wait for gentrification. Fund the glow-up yourselves.&rdquo;</p>
        <div className="space-y-3">
          <Button variant="gold" href="/home" className="w-full text-lg">
            Try the demo with $500 pretend
          </Button>
          {i < SLIDES.length - 1 ? (
            <Button variant="secondary" onClick={() => setI(i + 1)} className="w-full border-white bg-transparent text-white active:bg-white/10">
              Next
            </Button>
          ) : (
            <Button variant="secondary" href="/simulate" className="w-full border-white bg-transparent text-white active:bg-white/10">
              Watch the Block Simulator
            </Button>
          )}
          <p className="text-center text-xs text-white/75">No signup. Pretend money only.</p>
        </div>
        <p className="mt-5 flex items-start gap-2 rounded-xl bg-ink/40 p-3 text-xs leading-relaxed text-white/90 backdrop-blur">
          <ShieldIcon className="mt-0.5 size-4 shrink-0" />
          OwnTheBlock will never ask for your login code or keys by text, DM or phone. Anyone who does is a scammer.
        </p>
      </div>
    </main>
  );
}
