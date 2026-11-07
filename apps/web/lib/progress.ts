"use client";

/** Lessons finished on this phone (badges are minted on-chain in Milestone 5). */
import { useSyncExternalStore } from "react";

const KEY = "otb-lessons-done";
const EMPTY: string[] = [];
let cache: string[] | null = null;
const listeners = new Set<() => void>();

function read(): string[] {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    cache = [];
  }
  return cache!;
}

export function markLessonDone(slug: string) {
  const done = read();
  if (done.includes(slug)) return;
  cache = [...done, slug];
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* fine: progress just won't persist */
  }
  listeners.forEach((l) => l());
}

export function useLessonsDone(): string[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => EMPTY,
  );
}
