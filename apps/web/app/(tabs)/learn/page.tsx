"use client";

import Link from "next/link";
import { Card, Pill, Progress } from "@/components/ui";
import { BookIcon, CashIcon, ChainIcon, ChartIcon, HomeIcon, ShieldIcon, StoreIcon, TrophyIcon } from "@/components/icons";
import { LESSONS, TRACKS } from "@/lib/lessons";
import { useLessonsDone } from "@/lib/progress";

const TRACK_ICON: Record<string, (p: { className?: string }) => React.ReactElement> = {
  money: CashIcon,
  investing: ChartIcon,
  realestate: HomeIcon,
  business: StoreIcon,
  blockchain: ChainIcon,
  safety: ShieldIcon,
};

export default function LearnPage() {
  const done = useLessonsDone();
  const badges = TRACKS.filter((t) => {
    const ls = LESSONS.filter((l) => l.track === t.id);
    return ls.length > 0 && ls.every((l) => done.includes(l.slug));
  });

  return (
    <main className="px-4">
      <header className="pt-4">
        <h1 className="text-2xl font-extrabold">Level Up</h1>
        <p className="text-muted">2-minute lessons. Finish a track to earn a badge that lives on the blockchain and can&apos;t be traded.</p>
      </header>

      <Card className="mt-4 flex items-center gap-4 bg-gold-soft">
        <span className="grid size-12 place-items-center rounded-xl bg-gold text-ink">
          <TrophyIcon />
        </span>
        <div className="flex-1">
          <p className="font-bold">
            {done.length} of {LESSONS.length} lessons done
          </p>
          <p className="text-sm text-gold-ink">Finishing tracks cuts your trading fee, up to 50% off.</p>
          <div className="mt-2">
            <Progress value={done.length / LESSONS.length} label="Lessons completed" tone="gold" />
          </div>
        </div>
      </Card>

      {badges.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Badges earned">
          {badges.map((b) => (
            <Pill key={b.id} tone="green">
              Badge: {b.title}
            </Pill>
          ))}
        </div>
      )}

      <div className="mt-5 space-y-5">
        {TRACKS.map((t) => {
          const lessons = LESSONS.filter((l) => l.track === t.id);
          const Icon = TRACK_ICON[t.id] ?? BookIcon;
          return (
            <section key={t.id} aria-labelledby={`track-${t.id}`}>
              <div className="mb-2 flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-green-soft text-green">
                  <Icon className="size-5" />
                </span>
                <div>
                  <h2 id={`track-${t.id}`} className="font-bold">
                    {t.title}
                  </h2>
                  <p className="text-xs text-muted">{t.blurb}</p>
                </div>
              </div>
              {lessons.length ? (
                <div className="space-y-2">
                  {lessons.map((l) => (
                    <Link key={l.slug} href={`/learn/${l.slug}`} className="block">
                      <Card className="flex items-center justify-between p-3">
                        <span className="font-semibold">{l.title}</span>
                        <span className={`text-sm ${done.includes(l.slug) ? "font-bold text-green" : "text-muted"}`}>{done.includes(l.slug) ? "Done ✓" : `${l.minutes} min →`}</span>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <Card className="p-3">
                  <p className="text-sm text-muted">More lessons coming in the next milestone.</p>
                </Card>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
