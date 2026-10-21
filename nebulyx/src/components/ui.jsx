"use client";

import { AnimatePresence, motion } from "motion/react";
import { LuCircleCheck, LuCircleX, LuInfo } from "react-icons/lu";

export const cx = (...parts) => parts.filter(Boolean).join(" ");

export function Logo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="mrp-g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#mrp-g)" />
      <path d="M12 11l-5 5 5 5" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 11l5 5-5 5" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="16" r="1.9" fill="#fff" />
    </svg>
  );
}

export function Aurora({ accent }) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        className="aurora-blob animate-float-a -left-[10%] -top-[20%] h-[55vmax] w-[55vmax]"
        style={{ background: "radial-gradient(circle, #6d28d9 0%, transparent 65%)" }}
      />
      <div
        className="aurora-blob animate-float-b -right-[12%] top-[8%] h-[50vmax] w-[50vmax]"
        style={{ background: `radial-gradient(circle, ${accent} 0%, transparent 65%)`, opacity: 0.28, transition: "background 0.8s" }}
      />
      <div
        className="aurora-blob animate-float-c -bottom-[25%] left-[20%] h-[48vmax] w-[48vmax]"
        style={{ background: "radial-gradient(circle, #0e7490 0%, transparent 65%)", opacity: 0.35 }}
      />
      <div className="grid-bg absolute inset-0" />
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group flex w-full items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/5"
    >
      <span className="min-w-0">
        <span className="block text-[13.5px] font-medium text-white/90">{label}</span>
        {hint && <span className="block text-xs text-white/45">{hint}</span>}
      </span>
      <span
        className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
        style={{ background: checked ? "var(--accent)" : "rgba(255,255,255,0.14)" }}
      >
        <motion.span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md"
          animate={{ left: checked ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 520, damping: 32 }}
        />
      </span>
    </button>
  );
}

export function Segmented({ value, onChange, options }) {
  return (
    <div className="relative grid auto-cols-fr grid-flow-col rounded-xl bg-white/5 p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cx(
              "relative z-10 flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
              active ? "text-white" : "text-white/55 hover:text-white/85"
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${options.map((x) => x.value).join("-")}`}
                className="absolute inset-0 -z-10 rounded-lg bg-white/12 shadow-sm"
                style={{ background: "color-mix(in srgb, var(--accent) 28%, rgba(255,255,255,0.06))" }}
                transition={{ type: "spring", stiffness: 500, damping: 36 }}
              />
            )}
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Toasts({ items }) {
  const icons = {
    success: <LuCircleCheck className="text-emerald-400" size={18} />,
    error: <LuCircleX className="text-rose-400" size={18} />,
    info: <LuInfo className="text-sky-400" size={18} />,
  };
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] flex flex-col items-center gap-2 px-4 lg:bottom-10">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="glass pointer-events-auto flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-medium text-white shadow-2xl"
            style={{ background: "rgba(14,14,26,0.88)" }}
          >
            {icons[t.type || "success"]}
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function Modal({ open, onClose, children, className = "" }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className={cx("glass relative z-10 flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl", className)}
            style={{ background: "rgba(12,12,22,0.96)" }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
