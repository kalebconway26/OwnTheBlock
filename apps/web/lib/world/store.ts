"use client";

/**
 * Keeps one demo world for the whole app and saves it on the phone (localStorage),
 * so your pretend portfolio survives closing the app. Screens read it with useWorld()
 * and change it only through the pure functions in ./index.
 */
import { useSyncExternalStore } from "react";
import { World, initialWorld } from ".";

const KEY = "otb-world-v2";
const SERVER = initialWorld(); // what the server renders before the phone's saved world loads
let current: World | null = null;
const listeners = new Set<() => void>();

function load(): World {
  if (current) return current;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as World) : null;
    current = parsed && parsed.v === 2 ? parsed : initialWorld();
  } catch {
    current = initialWorld(); // private mode or broken data: start fresh
  }
  return current;
}

export function setWorld(next: World) {
  current = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked: the demo still works for this session */
  }
  listeners.forEach((l) => l());
}

export function resetWorld() {
  setWorld(initialWorld());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      current = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useWorld(): World {
  return useSyncExternalStore(subscribe, load, () => SERVER);
}

export const today = () => new Date().toISOString().slice(0, 10);
