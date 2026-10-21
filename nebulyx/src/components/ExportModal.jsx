"use client";

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { LuCheck, LuClipboardCopy, LuImageDown, LuLoaderCircle, LuX } from "react-icons/lu";
import ExportCard, { BACKGROUNDS } from "./ExportCard";
import { Modal, Segmented, Toggle, cx } from "./ui";
import { downloadDataUrl } from "@/lib/download";

const DEFAULT_OPTS = { bg: "aurora", lineNumbers: true, chrome: true, output: false, watermark: true, padding: 56, quality: 2 };

function ExportBody({ onClose, code, lang, fileName, fileBase, output, toast }) {
  const [opts, setOpts] = useState(DEFAULT_OPTS);
  const [busy, setBusy] = useState(null);
  const [avail, setAvail] = useState(0);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const cardRef = useRef(null);
  const wrapRef = useRef(null);
  const set = (patch) => setOpts((o) => ({ ...o, ...patch }));

  // fit the live preview into the available width
  useEffect(() => {
    const wrap = wrapRef.current;
    const card = cardRef.current;
    if (!wrap || !card) return;
    const measure = () => {
      setAvail(wrap.clientWidth);
      setSize({ w: card.offsetWidth, h: card.offsetHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    ro.observe(card);
    return () => ro.disconnect();
  }, []);

  const scale = size.w && avail ? Math.min(1, avail / size.w) : 1;

  async function render() {
    const node = cardRef.current;
    if (document.fonts?.ready) await document.fonts.ready;
    const w = node.offsetWidth;
    const h = node.offsetHeight;
    const ratio = Math.max(0.5, Math.min(opts.quality, 16000 / Math.max(w, h)));
    // first pass warms up fonts/images (fixes blank text in some browsers)
    await toPng(node, { pixelRatio: 0.2, cacheBust: true }).catch(() => {});
    return toPng(node, { pixelRatio: ratio, cacheBust: true });
  }

  async function download() {
    setBusy("download");
    try {
      const url = await render();
      downloadDataUrl(url, `${fileBase}-code.png`);
      toast("Image downloaded");
    } catch (e) {
      console.error(e);
      toast("Could not create the image", "error");
    } finally {
      setBusy(null);
    }
  }

  async function copy() {
    setBusy("copy");
    try {
      const url = await render();
      const blob = await (await fetch(url)).blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast("Image copied to clipboard");
    } catch (e) {
      console.error(e);
      toast("Copy isn't supported here — use Download instead", "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <header className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.06]">
            <LuImageDown size={18} style={{ color: "var(--accent)" }} />
          </span>
          <div>
            <h2 className="text-base font-bold text-white">Export as image</h2>
            <p className="text-xs text-white/45">Your whole code on one beautiful page</p>
          </div>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          <LuX size={18} />
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        {/* live preview */}
        <div className="min-h-0 flex-1 overflow-auto bg-black/40 p-4 sm:p-6">
          <div ref={wrapRef} className="mx-auto w-full" style={{ maxWidth: size.w || undefined }}>
            <div style={{ height: size.h * scale, width: size.w * scale, margin: "0 auto" }}>
              <div style={{ width: size.w, transform: `scale(${scale})`, transformOrigin: "top left" }}>
                <div className="overflow-hidden" style={{ borderRadius: 4 }}>
                  <ExportCard ref={cardRef} code={code} lang={lang} fileName={fileName} opts={opts} output={output} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* options */}
        <aside className="shrink-0 overflow-y-auto border-t border-white/[0.07] p-4 lg:w-[320px] lg:border-l lg:border-t-0">
          <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">Background</p>
          <div className="mb-4 flex flex-wrap gap-2 px-1">
            {BACKGROUNDS.map((b) => (
              <button
                key={b.id}
                title={b.name}
                aria-label={b.name}
                onClick={() => set({ bg: b.id })}
                className={cx(
                  "relative grid h-9 w-9 place-items-center rounded-full border-2 transition hover:scale-110",
                  opts.bg === b.id ? "border-white" : "border-white/15"
                )}
                style={{ background: b.css }}
              >
                {opts.bg === b.id && <LuCheck size={15} className={b.light ? "text-slate-800" : "text-white"} />}
              </button>
            ))}
          </div>

          <div className="mb-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-1.5">
            <Toggle label="Line numbers" checked={opts.lineNumbers} onChange={(v) => set({ lineNumbers: v })} />
            <Toggle label="Window header" checked={opts.chrome} onChange={(v) => set({ chrome: v })} />
            <Toggle label="Include output" hint={output ? "Adds the last run's result" : "Run your code first"} checked={opts.output && !!output} onChange={(v) => output && set({ output: v })} />
            <Toggle label="Watermark" checked={opts.watermark} onChange={(v) => set({ watermark: v })} />
          </div>

          <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">Padding</p>
          <div className="mb-4">
            <Segmented
              value={opts.padding}
              onChange={(v) => set({ padding: v })}
              options={[
                { value: 28, label: "S" },
                { value: 56, label: "M" },
                { value: 88, label: "L" },
              ]}
            />
          </div>

          <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">Quality</p>
          <div className="mb-5">
            <Segmented
              value={opts.quality}
              onChange={(v) => set({ quality: v })}
              options={[
                { value: 1, label: "1x" },
                { value: 2, label: "2x" },
                { value: 3, label: "3x" },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            <button className="run-btn justify-center" onClick={download} disabled={!!busy}>
              {busy === "download" ? <LuLoaderCircle className="animate-spin" size={17} /> : <LuImageDown size={17} />}
              Download PNG
            </button>
            <button
              onClick={copy}
              disabled={!!busy}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.05] text-sm font-semibold text-white/85 transition hover:bg-white/10"
            >
              {busy === "copy" ? <LuLoaderCircle className="animate-spin" size={17} /> : <LuClipboardCopy size={17} />}
              Copy image
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}

export default function ExportModal({ open, onClose, ...rest }) {
  return (
    <Modal open={open} onClose={onClose} className="h-[94dvh] sm:max-w-6xl">
      <ExportBody onClose={onClose} {...rest} />
    </Modal>
  );
}
