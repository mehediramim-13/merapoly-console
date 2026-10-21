"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LuCode, LuCpu, LuLoaderCircle, LuPlay, LuSquare, LuTerminal, LuKeyboard, LuUpload } from "react-icons/lu";

import { LANG_MAP, EXT_TO_LANG, fileNameFor } from "@/lib/languages";
import { DEFAULT_SETTINGS } from "@/lib/themes";
import { runJavaScript, runOnServer } from "@/lib/runner";
import { copyText, downloadText } from "@/lib/download";
import { useStoredState } from "@/hooks/useStoredState";

import { Aurora, Logo, Toasts, cx } from "./ui";
import LanguageTabs from "./LanguageTabs";
import EditorPanel from "./EditorPanel";
import ConsolePanel from "./ConsolePanel";
import StdinPanel from "./StdinPanel";
import SettingsDrawer from "./SettingsDrawer";
import TemplatesModal from "./TemplatesModal";
import ExportModal from "./ExportModal";

const MAX_ENTRIES = 5000;

export default function Playground() {
  /* ------------------------------ persisted state ------------------------------ */
  const [settings, setSettings, sReady] = useStoredState("merapoly:settings", DEFAULT_SETTINGS);
  const [langId, setLangId, lReady] = useStoredState("merapoly:lang", "javascript");
  const [codes, setCodes, cReady] = useStoredState("merapoly:codes", {});
  const [stdins, setStdins] = useStoredState("merapoly:stdins", {});
  const [names, setNames] = useStoredState("merapoly:names", {});
  const ready = sReady && lReady && cReady;

  const lang = LANG_MAP[langId] || LANG_MAP.javascript;
  const code = codes[lang.id] ?? lang.template;
  const stdin = stdins[lang.id] ?? "";
  const baseName = names[lang.id] ?? lang.defaultName;
  const fileName = fileNameFor(lang, baseName, code);
  const fileBase = fileName.replace(/\.[^.]+$/, "");

  /* ------------------------------- ui state ------------------------------- */
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState({ state: "idle" });
  const [view, setView] = useState("editor");
  const [focus, setFocus] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const [copied, setCopied] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [dragging, setDragging] = useState(false);

  /* --------------------------------- refs --------------------------------- */
  const latest = useRef({});
  latest.current = { lang, code, stdin, settings, fileName };
  const handlersRef = useRef({ run: () => {}, download: () => {} });
  const editorRef = useRef(null);
  const jobRef = useRef(null);
  const runningRef = useRef(false);
  const idRef = useRef(0);
  const bufferRef = useRef([]);
  const rafRef = useRef(0);
  const dragDepth = useRef(0);

  const running = status.state === "running";

  /* -------------------------------- toasts -------------------------------- */
  const toast = useCallback((message, type = "success") => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-2), { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2400);
  }, []);

  /* ---------------------------- console entries ---------------------------- */
  const flush = useCallback(() => {
    rafRef.current = 0;
    const batch = bufferRef.current;
    bufferRef.current = [];
    if (!batch.length) return;
    setEntries((prev) => {
      const next = [...prev, ...batch];
      return next.length > MAX_ENTRIES ? next.slice(-MAX_ENTRIES) : next;
    });
  }, []);

  const push = useCallback(
    (type, text, extra) => {
      bufferRef.current.push({ id: ++idRef.current, type, text, ...extra });
      if (!rafRef.current) rafRef.current = requestAnimationFrame(flush);
    },
    [flush]
  );

  const clearEntries = useCallback(() => {
    bufferRef.current = [];
    setEntries([]);
  }, []);

  /* --------------------------------- run --------------------------------- */
  const run = useCallback(
    async ({ quiet = false } = {}) => {
      if (runningRef.current) return;
      const { lang, code, stdin, settings } = latest.current;
      if (!code.trim()) {
        toast("Write some code first", "info");
        return;
      }

      runningRef.current = true;
      if (settings.clearOnRun) clearEntries();
      if (!quiet && typeof window !== "undefined" && window.innerWidth < 1024) setView("output");
      setStatus({ state: "running", runner: lang.runtime === "browser" ? "browser" : undefined });
      const t0 = performance.now();

      try {
        if (lang.runtime === "browser") {
          const job = runJavaScript(code, stdin, settings.timeout * 1000, (m) => {
            if (m.type === "log") push(m.level, m.text);
            else if (m.type === "clear") clearEntries();
          });
          jobRef.current = job;
          const res = await job.promise;

          if (res.cancelled) {
            push("system", "Execution stopped");
            setStatus({ state: "idle", runner: "browser" });
          } else if (res.timedOut) {
            push("error", `Execution timed out after ${settings.timeout}s`);
            setStatus({ state: "timeout", runner: "browser", time: settings.timeout * 1000 });
          } else if (res.ok) {
            push("success", `Finished in ${res.time}ms`);
            setStatus({ state: "success", runner: "browser", time: res.time });
          } else {
            push("fail", `Failed · ${res.time ?? 0}ms`);
            setStatus({ state: "error", runner: "browser", time: res.time ?? 0 });
          }
        } else {
          const job = runOnServer(lang.id, code, stdin, settings.timeout);
          jobRef.current = job;
          const data = await job.promise;

          const out = (data.stdout || "").replace(/\n$/, "");
          const err = (data.stderr || "").replace(/\n$/, "");
          const comp = (data.compileOutput || "").replace(/\n$/, "");
          const compileFailed = !!comp && !out && !err && data.exitCode !== 0;
          const elapsed = Math.round(performance.now() - t0);

          if (comp) push(compileFailed ? "compile" : "warn", comp, { label: compileFailed ? "Compile error" : "Compiler" });
          if (out) push("stdout", out);
          if (err) push("stderr", err);

          if (data.timedOut) {
            push("error", `Time limit exceeded (${settings.timeout}s)`);
            setStatus({ state: "timeout", runner: data.runner, time: data.time || elapsed });
          } else if (data.exitCode === 0) {
            if (!out && !err) push("system", "Program finished with no output");
            push("success", `Finished in ${data.time}ms`);
            setStatus({ state: "success", runner: data.runner, time: data.time });
          } else {
            push("fail", compileFailed ? "Compilation failed" : `Process exited with code ${data.exitCode} · ${data.time}ms`);
            setStatus({ state: "error", runner: data.runner, time: compileFailed ? elapsed : data.time });
          }
        }
      } catch (e) {
        if (e?.name === "AbortError") {
          push("system", "Execution stopped");
          setStatus({ state: "idle" });
        } else {
          push("error", e?.message || "Something went wrong");
          setStatus({ state: "error", time: Math.round(performance.now() - t0) });
        }
      } finally {
        runningRef.current = false;
        jobRef.current = null;
      }
    },
    [clearEntries, push, toast]
  );

  const stop = useCallback(() => jobRef.current?.cancel(), []);

  /* ------------------------------ file actions ------------------------------ */
  const download = useCallback(() => {
    const { lang, code, fileName } = latest.current;
    downloadText(code, fileName);
    toast(`Saved ${fileName}`);
    void lang;
  }, [toast]);

  const copyCode = useCallback(async () => {
    const ok = await copyText(latest.current.code);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast("Code copied");
    } else toast("Copy failed", "error");
  }, [toast]);

  const outputText = useMemo(
    () => entries.map((e) => (e.label ? `[${e.label}] ` : "") + e.text).join("\n"),
    [entries]
  );

  const copyOutput = async () => ((await copyText(outputText)) ? toast("Output copied") : toast("Copy failed", "error"));
  const downloadOutput = () => {
    downloadText(outputText, `${fileBase}-output.txt`);
    toast("Output saved");
  };

  const exportOutput = useMemo(() => {
    if (!exportOpen) return "";
    return entries
      .filter((e) => !["system", "success", "fail"].includes(e.type))
      .map((e) => e.text)
      .join("\n")
      .split("\n")
      .slice(0, 30)
      .join("\n");
  }, [entries, exportOpen]);

  const openFile = useCallback(
    async (file) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const id = EXT_TO_LANG[ext] || latest.current.lang.id;
      const text = await file.text();
      setLangId(id);
      setCodes((c) => ({ ...c, [id]: text }));
      if (id !== "java") setNames((n) => ({ ...n, [id]: file.name.replace(/\.[^.]+$/, "").replace(/[^\w\-]/g, "").slice(0, 24) || LANG_MAP[id].defaultName }));
      clearEntries();
      setStatus({ state: "idle" });
      toast(`Opened ${file.name}`);
    },
    [clearEntries, setCodes, setLangId, setNames, toast]
  );

  /* ------------------------------ other actions ------------------------------ */
  const changeLang = (id) => {
    if (id === langId) return;
    setLangId(id);
    clearEntries();
    setStatus({ state: "idle" });
  };

  const setCode = useCallback((value) => setCodes((c) => ({ ...c, [latest.current.lang.id]: value })), [setCodes]);

  const reset = () => {
    setCodes((c) => ({ ...c, [lang.id]: lang.template }));
    toast("Reset to starter template", "info");
  };

  const format = () => editorRef.current?.editor?.getAction("editor.action.formatDocument")?.run();

  const pickTemplate = (s) => {
    setCodes((c) => ({ ...c, [lang.id]: s.code }));
    if (s.stdin != null) setStdins((x) => ({ ...x, [lang.id]: s.stdin }));
    setTemplatesOpen(false);
    toast(`Loaded “${s.title}”`);
  };

  /* ------------------------------ side effects ------------------------------ */
  handlersRef.current = { run, download };

  // live mode (JS)
  useEffect(() => {
    if (!ready || !settings.autoRun || lang.runtime !== "browser") return;
    const t = setTimeout(() => run({ quiet: true }), 900);
    return () => clearTimeout(t);
  }, [code, settings.autoRun, lang.id, lang.runtime, ready, run]);

  // global shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === "Enter") {
        e.preventDefault();
        run();
      } else if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        download();
      } else if (mod && e.key === ",") {
        e.preventDefault();
        setSettingsOpen(true);
      } else if (e.key === "Escape") {
        setSettingsOpen(false);
        setTemplatesOpen(false);
        setExportOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [run, download]);

  // drag & drop a file anywhere
  useEffect(() => {
    const hasFiles = (e) => Array.from(e.dataTransfer?.types || []).includes("Files");
    const enter = (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current++;
      setDragging(true);
    };
    const over = (e) => hasFiles(e) && e.preventDefault();
    const leave = (e) => {
      if (!hasFiles(e)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (!dragDepth.current) setDragging(false);
    };
    const drop = (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      const f = e.dataTransfer.files?.[0];
      if (f) openFile(f);
    };
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragover", over);
    window.addEventListener("dragleave", leave);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragover", over);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("drop", drop);
    };
  }, [openFile]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  /* --------------------------------- render --------------------------------- */
  const stacked = settings.layout === "stacked";

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden" style={{ "--accent": lang.color }}>
      <Aurora accent={lang.color} />

      {/* header */}
      <header className="relative z-20 flex items-center gap-3 px-3 pb-2 pt-3 sm:px-4 lg:px-5 lg:pb-3 lg:pt-4">
        <div className="flex items-center gap-2.5">
          <Logo size={38} />
          <div className="leading-tight">
            <div className="bg-linear-to-r from-white via-white to-white/55 bg-clip-text text-[19px] font-extrabold tracking-tight text-transparent">
              MeRa Poly
            </div>
            <div className="hidden text-[11px] font-medium tracking-wide text-white/40 sm:block">Polyglot code console</div>
          </div>
        </div>

        <LanguageTabs value={langId} onChange={changeLang} idPrefix="desk" className="mx-auto hidden lg:flex" />

        <div className="ml-auto flex items-center gap-2">
          <button
            className="run-btn"
            data-stop={running}
            onClick={running ? stop : () => run()}
            aria-label={running ? "Stop" : "Run code"}
          >
            {running ? <LuSquare size={15} fill="currentColor" /> : <LuPlay size={16} fill="currentColor" />}
            {running ? "Stop" : "Run"}
            {!running && (
              <kbd className="ml-1 hidden rounded-md bg-black/25 px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-white/80 md:inline">Ctrl ⏎</kbd>
            )}
          </button>
        </div>
      </header>

      <div className="relative z-20 px-3 pb-2 lg:hidden">
        <LanguageTabs value={langId} onChange={changeLang} idPrefix="mob" />
      </div>

      {/* workspace */}
      <main
        className={cx(
          "relative z-10 flex min-h-0 flex-1 gap-3 px-3 pb-3 lg:gap-4 lg:px-5",
          stacked ? "lg:flex-col" : "lg:flex-row"
        )}
      >
        <div className={cx(view === "editor" ? "flex" : "hidden", "min-h-0 min-w-0 flex-1 flex-col lg:flex lg:flex-[1.4]")}>
          <EditorPanel
            ready={ready}
            lang={lang}
            code={code}
            onChange={setCode}
            settings={settings}
            fileName={fileName}
            baseName={baseName}
            onBaseName={(v) => setNames((n) => ({ ...n, [lang.id]: v }))}
            copied={copied}
            focus={focus}
            onToggleFocus={() => setFocus((f) => !f)}
            onCopy={copyCode}
            onDownload={download}
            onExportImage={() => setExportOpen(true)}
            onOpenFile={openFile}
            onReset={reset}
            onFormat={format}
            onTemplates={() => setTemplatesOpen(true)}
            onSettings={() => setSettingsOpen(true)}
            onCursor={setCursor}
            handlersRef={handlersRef}
            editorRef={editorRef}
          />
        </div>

        <div
          className={cx(
            view === "editor" ? "hidden" : "flex",
            focus ? "lg:hidden" : "lg:flex",
            "min-h-0 min-w-0 flex-1 flex-col gap-3 lg:gap-4"
          )}
        >
          <div className={cx(view === "input" ? "hidden lg:flex" : "flex", "min-h-0 flex-1 flex-col")}>
            <ConsolePanel
              entries={entries}
              status={status}
              accent={lang.color}
              onClear={() => {
                clearEntries();
                setStatus({ state: "idle" });
              }}
              onCopy={copyOutput}
              onDownload={downloadOutput}
            />
          </div>
          <div className={cx(view === "output" ? "hidden lg:flex" : "flex", "min-h-0 flex-1 flex-col lg:flex-none")}>
            <StdinPanel
              value={stdin}
              onChange={(v) => setStdins((s) => ({ ...s, [lang.id]: v }))}
              hint={lang.stdinHint}
              accent={lang.color}
            />
          </div>
        </div>
      </main>

      {/* status bar (desktop) */}
      <footer className="relative z-10 hidden items-center justify-between px-6 pb-3 text-[11.5px] text-white/40 lg:flex">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium text-white/60">
            <lang.Icon size={13} style={{ color: lang.color }} />
            {lang.name} <span className="text-white/30">{lang.version}</span>
          </span>
          <span>
            Ln {cursor.line}, Col {cursor.col}
          </span>
          <span>Spaces: {settings.tabSize}</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <LuCpu size={12} />
            {lang.runtime === "browser" ? "Runs in your browser" : "Runs on server"}
          </span>
          <span>Ctrl+Enter run · Ctrl+S save</span>
        </div>
      </footer>

      {/* mobile bottom bar */}
      <nav className="glass relative z-20 mx-3 mb-[max(0.75rem,env(safe-area-inset-bottom))] grid grid-cols-3 gap-1 rounded-2xl p-1 lg:hidden">
        {[
          { id: "editor", label: "Code", icon: LuCode },
          { id: "output", label: "Output", icon: LuTerminal, dot: entries.length > 0 },
          { id: "input", label: "Input", icon: LuKeyboard },
        ].map((t) => {
          const active = view === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className={cx(
                "relative flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold transition-colors",
                active ? "text-white" : "text-white/50"
              )}
            >
              {active && (
                <motion.span
                  layoutId="mobile-tab"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: "color-mix(in srgb, var(--accent) 24%, rgba(255,255,255,0.05))" }}
                  transition={{ type: "spring", stiffness: 500, damping: 36 }}
                />
              )}
              <t.icon size={16} className="relative" />
              <span className="relative">{t.label}</span>
              {t.dot && !active && <span className="absolute right-3 top-2 h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />}
            </button>
          );
        })}
      </nav>

      {/* overlays */}
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} settings={settings} setSettings={setSettings} />
      <TemplatesModal open={templatesOpen} onClose={() => setTemplatesOpen(false)} lang={lang} onPick={pickTemplate} />
      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        code={code}
        lang={lang}
        fileName={fileName}
        fileBase={fileBase}
        output={exportOutput}
        toast={toast}
      />

      <AnimatePresence>
        {dragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-[90] grid place-items-center bg-black/70 backdrop-blur-md"
          >
            <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-white/30 px-14 py-12 text-white">
              <LuUpload size={34} style={{ color: "var(--accent)" }} />
              <p className="text-lg font-semibold">Drop a file to open it</p>
              <p className="text-sm text-white/50">.c · .cpp · .java · .js · .py</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!ready && (
        <div className="pointer-events-none fixed right-4 top-4 z-[95] text-white/40">
          <LuLoaderCircle className="animate-spin" size={16} />
        </div>
      )}

      <Toasts items={toasts} />
    </div>
  );
}
