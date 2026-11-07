"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Two simulators under one tab: your money on one block, or the whole app at scale. */
export default function SimulateLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const grow = path.startsWith("/simulate/grow");
  return (
    <>
      <nav aria-label="Simulator type" className="px-4 pt-3">
        <div className="grid grid-cols-2 rounded-xl bg-card p-1 text-sm font-bold">
          <Link href="/simulate" aria-current={!grow ? "page" : undefined} className={`min-h-11 content-center rounded-lg text-center ${!grow ? "bg-paper text-green shadow-sm" : "text-muted"}`}>
            My block
          </Link>
          <Link href="/simulate/grow" aria-current={grow ? "page" : undefined} className={`min-h-11 content-center rounded-lg text-center ${grow ? "bg-paper text-green shadow-sm" : "text-muted"}`}>
            Grow the app
          </Link>
        </div>
      </nav>
      {children}
    </>
  );
}
