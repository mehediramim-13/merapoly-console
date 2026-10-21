"use client";

import { motion } from "motion/react";
import { LuFileCode, LuSparkles, LuX } from "react-icons/lu";
import { Modal } from "./ui";

export default function TemplatesModal({ open, onClose, lang, onPick }) {
  return (
    <Modal open={open} onClose={onClose} className="sm:max-w-lg">
      <header className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.06]">
            <LuSparkles size={18} style={{ color: lang.color }} />
          </span>
          <div>
            <h2 className="text-base font-bold text-white">{lang.name} templates</h2>
            <p className="text-xs text-white/45">Pick one to replace the editor content</p>
          </div>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          <LuX size={18} />
        </button>
      </header>

      <div className="grid gap-2 overflow-y-auto p-4">
        {[{ title: "Starter template", desc: "Default example for " + lang.name, code: lang.template }, ...lang.snippets].map((s, i) => (
          <motion.button
            key={s.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onPick(s)}
            className="group flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3.5 text-left transition hover:border-white/20 hover:bg-white/[0.07]"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black/30 transition group-hover:scale-105">
              <LuFileCode size={19} style={{ color: lang.color }} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-white">{s.title}</span>
              <span className="block truncate text-xs text-white/45">{s.desc}</span>
            </span>
          </motion.button>
        ))}
      </div>
    </Modal>
  );
}
