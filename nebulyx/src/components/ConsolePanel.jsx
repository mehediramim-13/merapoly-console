"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
  LuChevronRight,
  LuCircleCheck,
  LuCircleX,
  LuCloud,
  LuCopy,
  LuCpu,
  LuDownload,
  LuGlobe,
  LuInfo,
  LuLoaderCircle,
  LuTerminal,
  LuTrash2,
  LuTriangleAlert,
} from "react-icons/lu";
import { cx } from "./ui";

const STYLES = {
  log: { icon: LuChevronRight, text: "text-slate-200", row: "", ic: "text-white/25" },
  debug: { icon: LuChevronRight, text: "text-slate-400", row: "", ic: "text-white/20" },
  info: { icon: LuInfo, text: "text-sky-300", row: "bg-sky-400/[0.05]", ic: "text-sky-400" },
  warn: { icon: LuTriangleAlert, text: "text-amber-200", row: "bg-amber-400/[0.07]", ic: "text-amber-400" },
  error: { icon: LuCircleX, text: "text-rose-300", row: "bg-rose-500/[0.09]", ic: "text-rose-400" },
  stdout: { icon: LuChevronRight, text: "text-slate-100", row: "", ic: "text-white/25" },
  stderr: { icon: LuCircleX, text: "text-rose-300", row: "bg-rose-500/[0.09]", ic: "text-rose-400" },
  compile: { icon: LuTriangleAlert, text: "text-amber-200", row: "bg-amber-400/[0.07]", ic: "text-amber-400" },
  system: { icon: LuTerminal, text: "text-violet-300/80", row: "", ic: "text-violet-400/70" },
  success: { icon: LuCircleCheck, text: "text-emerald-300", row: "bg-emerald-400/[0.06]", ic: "text-emerald-400" },
  fail: { icon: LuCircleX, text: "text-rose-300", row: "bg-rose-500/[0.09]", ic: "text-rose-400" },
};

const RUNNERS = {
  browser: { label: "Browser", icon: LuGlobe },
  local: { label: "Local", icon: LuCpu },
  cloud: { label: "Cloud", icon: LuCloud },
};

function StatusPill({ status }) {
  const map = {
    idle: { label: "Idle", dot: "bg-white/30", text: "text-white/60" },
    running: { label: "Running", dot: "bg-sky-400", text: "text-sky-300" },
    success: { label: "Success", dot: "bg-emerald-400", text: "text-emerald-300" },
    error: { label: "Error", dot: "bg-rose-400", text: "text-rose-300" },
    timeout: { label: "Timed out", dot: "bg-amber-400", text: "text-amber-300" },
  };
  const s = map[status.state] || map.idle;
  const runner = status.runner && RUNNERS[status.runner];
  return (
    <div className="flex items-center gap-2">
      <span className={cx("chip", s.text)}>
        {status.state === "running" ? (
          <LuLoaderCircle className="animate-spin" size={12} />
        ) : (
          <span className={cx("h-1.5 w-1.5 rounded-full", s.dot)} />
        )}
        {s.label}
        {status.time != null && status.state !== "running" && <span className="font-mono text-white/50">· {status.time}ms</span>}
      </span>
      {runner && (
        <span className="chip hidden text-white/60 sm:inline-flex">
          <runner.icon size={12} />
          {runner.label}
        </span>
      )}
    </div>
  );
}

export default function ConsolePanel({ entries, status, onClear, onCopy, onDownload, accent }) {
  const scroller = useRef(null);
  const stick = useRef(true);

  useEffect(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [entries]);

  const onScroll = (e) => {
    const el = e.currentTarget;
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  };

  return (
    <section className="glass flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl lg:rounded-3xl">
      <header className="flex items-center justify-between gap-2 border-b border-white/[0.07] px-3 py-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-white/90">
            <LuTerminal size={16} style={{ color: accent }} />
            Console
          </div>
          <StatusPill status={status} />
        </div>
        <div className="flex items-center">
          <button className="icon-btn" onClick={onCopy} disabled={!entries.length} title="Copy output" aria-label="Copy output">
            <LuCopy size={16} />
          </button>
          <button className="icon-btn" onClick={onDownload} disabled={!entries.length} title="Download output (.txt)" aria-label="Download output">
            <LuDownload size={16} />
          </button>
          <button className="icon-btn" onClick={onClear} disabled={!entries.length} title="Clear console" aria-label="Clear console">
            <LuTrash2 size={16} />
          </button>
        </div>
      </header>

      <div ref={scroller} onScroll={onScroll} className="relative min-h-0 flex-1 overflow-y-auto bg-black/25 py-2">
        {entries.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]"
              style={{ boxShadow: `0 0 40px -8px ${accent}` }}
            >
              <LuTerminal size={24} style={{ color: accent }} />
            </motion.div>
            <p className="text-sm font-medium text-white/70">Output appears here</p>
            <p className="text-xs text-white/40">
              Press <kbd className="rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[11px] text-white/70">Ctrl</kbd>{" "}
              +{" "}
              <kbd className="rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[11px] text-white/70">Enter</kbd> or tap Run
            </p>
          </div>
        ) : (
          entries.map((e) => {
            const s = STYLES[e.type] || STYLES.log;
            const Icon = s.icon;
            return (
              <div key={e.id} className={cx("entry-in flex gap-2 border-b border-white/[0.04] px-3 py-1 sm:px-4", s.row)}>
                <Icon size={13} className={cx("mt-[5px] shrink-0", s.ic)} />
                <div className={cx("console-line min-w-0 flex-1", s.text)}>
                  {e.label && (
                    <span className="mr-2 rounded bg-white/10 px-1.5 py-px text-[10px] font-bold uppercase tracking-wider text-white/70">{e.label}</span>
                  )}
                  {e.text}
                </div>
              </div>
            );
          })
        )}
        {status.state === "running" && (
          <div className="flex items-center gap-2 px-4 py-2 text-xs text-white/40">
            <span className="caret inline-block h-3.5 w-1.5 rounded-sm" style={{ background: accent }} />
            Running…
          </div>
        )}
      </div>
    </section>
  );
}
