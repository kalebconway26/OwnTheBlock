"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookIcon, CompassIcon, HomeIcon, LinkChainIcon, UserIcon } from "./icons";

const tabs = [
  { href: "/home", label: "Home", Icon: HomeIcon },
  { href: "/explore", label: "Explore", Icon: CompassIcon },
  { href: "/blockchain", label: "Blockchain", Icon: LinkChainIcon },
  { href: "/learn", label: "Learn", Icon: BookIcon },
  { href: "/me", label: "Account", Icon: UserIcon },
];

export default function TabBar() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur pb-safe">
      <ul className="mx-auto grid max-w-md grid-cols-5 px-1">
        {tabs.map(({ href, label, Icon }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-15 flex-col items-center justify-center gap-1 pt-1.5 pb-1 text-[11px] font-bold ${active ? "text-green" : "text-muted"}`}
              >
                <span className={`grid h-7 w-10 place-items-center rounded-lg ${active ? "bg-green-soft" : ""}`}>
                  <Icon className="size-[22px]" />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
