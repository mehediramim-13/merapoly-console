"use client";

import { AnimatePresence, motion } from "motion/react";
import { LuCheck, LuColumns2, LuRows2, LuRotateCcw, LuX } from "react-icons/lu";
import { THEMES, DEFAULT_SETTINGS } from "@/lib/themes";
import { Segmented, Toggle, cx } from "./ui";

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h3 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">{title}</h3>
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-2">{children}</div>
    </div>
  );
}

function Row({ label, value, children }) {
  return (
    <div className="px-3 py-2.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[13.5px] font-medium text-white/90">{label}</span>
        {value != null && <span className="font-mono text-xs text-white/50">{value}</span>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsDrawer({ open, onClose, settings, setSettings }) {
  const set = (patch) => setSettings((s) => ({ ...s, ...patch }));

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 36 }}
            className="absolute inset-y-0 right-0 flex w-full max-w-[400px] flex-col border-l border-white/10 shadow-2xl"
            style={{ background: "rgba(10,10,20,0.97)" }}
          >
            <header className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-white">Settings</h2>
                <p className="text-xs text-white/45">Saved automatically on this device</p>
              </div>
              <button className="icon-btn" onClick={onClose} aria-label="Close settings">
                <LuX size={18} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-5">
              <Section title="Editor theme">
                <div className="grid grid-cols-2 gap-2 p-1">
                  {THEMES.map((t) => {
                    const active = settings.theme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => set({ theme: t.id })}
                        className={cx(
                          "group relative overflow-hidden rounded-xl border p-2.5 text-left transition",
                          active ? "border-[color:var(--accent)] bg-white/[0.07]" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.06]"
                        )}
                      >
                        <div className="mb-2 flex h-7 overflow-hidden rounded-lg">
                          {t.swatch.map((c) => (
                            <span key={c} className="flex-1" style={{ background: c }} />
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-[12.5px] font-medium text-white/90">
                          {t.name}
                          {active && <LuCheck size={14} style={{ color: "var(--accent)" }} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Section>

              <Section title="Text">
                <Row label="Font size" value={`${settings.fontSize}px`}>
                  <input
                    type="range"
                    min={11}
                    max={24}
                    value={settings.fontSize}
                    onChange={(e) => set({ fontSize: Number(e.target.value) })}
                    className="range"
                  />
                </Row>
                <Row label="Tab size">
                  <Segmented
                    value={settings.tabSize}
                    onChange={(v) => set({ tabSize: v })}
                    options={[2, 4, 8].map((n) => ({ value: n, label: `${n} spaces` }))}
                  />
                </Row>
                <Toggle label="Word wrap" hint="Wrap long lines" checked={settings.wordWrap} onChange={(v) => set({ wordWrap: v })} />
                <Toggle label="Line numbers" checked={settings.lineNumbers} onChange={(v) => set({ lineNumbers: v })} />
                <Toggle label="Minimap" hint="Code overview on the right" checked={settings.minimap} onChange={(v) => set({ minimap: v })} />
                <Toggle label="Font ligatures" hint="=> != >= look like symbols" checked={settings.ligatures} onChange={(v) => set({ ligatures: v })} />
                <Toggle label="Smooth caret" hint="Animated cursor movement" checked={settings.smoothCursor} onChange={(v) => set({ smoothCursor: v })} />
              </Section>

              <Section title="Running">
                <Toggle label="Clear console on run" checked={settings.clearOnRun} onChange={(v) => set({ clearOnRun: v })} />
                <Toggle
                  label="Live mode (JavaScript)"
                  hint="Auto-run shortly after you stop typing"
                  checked={settings.autoRun}
                  onChange={(v) => set({ autoRun: v })}
                />
                <Row label="Time limit" value={`${settings.timeout}s`}>
                  <input
                    type="range"
                    min={3}
                    max={30}
                    value={settings.timeout}
                    onChange={(e) => set({ timeout: Number(e.target.value) })}
                    className="range"
                  />
                </Row>
              </Section>

              <Section title="Layout (desktop)">
                <div className="p-1">
                  <Segmented
                    value={settings.layout}
                    onChange={(v) => set({ layout: v })}
                    options={[
                      { value: "split", label: "Side by side", icon: <LuColumns2 size={15} /> },
                      { value: "stacked", label: "Stacked", icon: <LuRows2 size={15} /> },
                    ]}
                  />
                </div>
              </Section>

              <button
                onClick={() => setSettings({ ...DEFAULT_SETTINGS })}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-[13px] font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <LuRotateCcw size={15} />
                Reset all settings
              </button>

              <div className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 text-xs leading-relaxed text-white/50">
                <p className="mb-2 font-semibold text-white/70">Shortcuts</p>
                <p><kbd className="font-mono text-white/80">Ctrl/⌘ + Enter</kbd> — Run</p>
                <p><kbd className="font-mono text-white/80">Ctrl/⌘ + S</kbd> — Download file</p>
                <p><kbd className="font-mono text-white/80">Ctrl/⌘ + ,</kbd> — Settings</p>
                <p><kbd className="font-mono text-white/80">Esc</kbd> — Close panels</p>
              </div>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
