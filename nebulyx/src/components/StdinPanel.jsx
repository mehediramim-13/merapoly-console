"use client";

import { LuKeyboard } from "react-icons/lu";

export default function StdinPanel({ value, onChange, hint, accent }) {
  return (
    <section className="glass flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl lg:h-44 lg:flex-none lg:rounded-3xl">
      <header className="flex items-center justify-between gap-2 border-b border-white/[0.07] px-4 py-2.5">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-white/90">
          <LuKeyboard size={16} style={{ color: accent }} />
          Input <span className="font-normal text-white/40">(stdin)</span>
        </div>
        <span className="hidden truncate text-[11.5px] text-white/40 sm:block">{hint}</span>
      </header>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        placeholder={"Type the input your program reads — one value per line.\nExample:\nMeRa\n21"}
        className="min-h-0 flex-1 resize-none bg-black/25 px-4 py-3 font-mono text-[13px] leading-relaxed text-slate-200 outline-none placeholder:text-white/25"
      />
    </section>
  );
}
