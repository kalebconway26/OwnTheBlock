"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Button, PageHeader } from "@/components/ui";
import { lessonBySlug } from "@/lib/lessons";
import { markLessonDone } from "@/lib/progress";
import { TrophyIcon } from "@/components/icons";

export default function LessonPlayer({ slug }: { slug: string }) {
  const lesson = lessonBySlug(slug)!;
  const [i, setI] = useState(0); // cards first, then quiz questions
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const total = lesson.cards.length + lesson.quiz.length;
  const done = i >= total;
  const isCard = i < lesson.cards.length;
  const q = !isCard && !done ? lesson.quiz[i - lesson.cards.length] : null;

  const next = () => {
    if (q && picked === q.answer) setScore((s) => s + 1);
    setPicked(null);
    if (i + 1 >= total) markLessonDone(slug);
    setI(i + 1);
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col pb-8">
      <PageHeader title={lesson.title} subtitle={`${lesson.minutes}-minute lesson`} back="/learn" />
      <div className="mx-4 flex gap-1" aria-hidden>
        {Array.from({ length: total }).map((_, k) => (
          <div key={k} className={`h-1.5 flex-1 rounded-full ${k < i ? "bg-green" : k === i ? "bg-gold" : "bg-line"}`} />
        ))}
      </div>

      <div className="flex flex-1 flex-col px-4 pt-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={i} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="flex-1">
            {isCard && (
              <div className="rounded-3xl bg-paper p-6 shadow-sm">
                <h2 className="text-2xl font-extrabold text-green">{lesson.cards[i].title}</h2>
                <p className="mt-4 text-lg leading-relaxed">{lesson.cards[i].body}</p>
              </div>
            )}

            {q && (
              <div>
                <p className="text-sm font-bold text-gold-ink">Quick check {i - lesson.cards.length + 1} of 3</p>
                <h2 className="mt-1 text-xl font-bold">{q.q}</h2>
                <div className="mt-4 space-y-2" role="radiogroup">
                  {q.options.map((o, k) => {
                    const show = picked !== null;
                    const right = k === q.answer;
                    const style = !show
                      ? "border-line bg-paper"
                      : right
                        ? "border-green bg-green-soft"
                        : k === picked
                          ? "border-brick bg-brick-soft"
                          : "border-line bg-paper opacity-60";
                    return (
                      <button
                        key={o}
                        role="radio"
                        aria-checked={picked === k}
                        disabled={show}
                        onClick={() => setPicked(k)}
                        className={`block min-h-14 w-full rounded-2xl border-2 px-4 text-left font-semibold ${style}`}
                      >
                        {o} {show && right && "✓"}
                      </button>
                    );
                  })}
                </div>
                {picked !== null && (
                  <p className={`mt-3 rounded-xl p-3 text-sm ${picked === q.answer ? "bg-green-soft text-green" : "bg-brick-soft text-brick"}`} aria-live="polite">
                    {picked === q.answer ? "Nice! " : "Not quite. "}
                    {q.why}
                  </p>
                )}
              </div>
            )}

            {done && (
              <div className="pt-8 text-center">
                <span className="mx-auto grid size-24 place-items-center rounded-full bg-gold text-ink">
                  <TrophyIcon className="size-12" />
                </span>
                <h2 className="mt-4 text-2xl font-extrabold">Lesson complete</h2>
                <p className="mt-2 text-muted">
                  You got {score} of {lesson.quiz.length} right.
                </p>
                <p className="mt-4 rounded-xl bg-gold-soft p-3 text-sm text-gold-ink">
                  Finish the track to earn a badge, minted as a non-transferable token on Base (arrives in Milestone 5).
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-6">
          {done ? (
            <Button href="/learn" className="w-full">
              Back to lessons
            </Button>
          ) : (
            <Button onClick={next} disabled={!!q && picked === null} className="w-full">
              {isCard ? "Next" : "Continue"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
