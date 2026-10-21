"use client";

import { motion } from "motion/react";
import { LANGUAGES } from "@/lib/languages";
import { cx } from "./ui";

export default function LanguageTabs({ value, onChange, idPrefix, className = "" }) {
  return (
    <nav
      aria-label="Language"
      className={cx("no-scrollbar glass flex items-center gap-1 overflow-x-auto rounded-2xl p-1", className)}
    >
      {LANGUAGES.map((l) => {
        const active = l.id === value;
        return (
          <button
            key={l.id}
            onClick={() => onChange(l.id)}
            aria-pressed={active}
            className={cx(
              "relative flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-[13.5px] font-semibold transition-colors",
              active ? "text-white" : "text-white/50 hover:text-white/85"
            )}
          >
            {active && (
              <motion.span
                layoutId={`${idPrefix}-pill`}
                className="absolute inset-0 rounded-xl"
                style={{
                  background: `linear-gradient(180deg, ${l.color}26, ${l.color}0f)`,
                  boxShadow: `0 0 0 1px ${l.color}55 inset, 0 8px 24px -10px ${l.color}`,
                }}
                transition={{ type: "spring", stiffness: 480, damping: 34 }}
              />
            )}
            <l.Icon size={17} className="relative" style={{ color: active ? l.color : undefined }} />
            <span className="relative">{l.name}</span>
          </button>
        );
      })}
    </nav>
  );
}
