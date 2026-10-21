"use client";

import { forwardRef, useMemo } from "react";
import { highlightLines } from "@/lib/highlight";

export const BACKGROUNDS = [
  { id: "aurora", name: "Aurora", css: "linear-gradient(135deg,#7c3aed 0%,#4f46e5 45%,#06b6d4 100%)" },
  { id: "sunset", name: "Sunset", css: "linear-gradient(135deg,#f97316 0%,#ec4899 55%,#8b5cf6 100%)" },
  { id: "ocean", name: "Ocean", css: "linear-gradient(135deg,#0ea5e9 0%,#2563eb 50%,#312e81 100%)" },
  { id: "forest", name: "Forest", css: "linear-gradient(135deg,#10b981 0%,#059669 45%,#0e7490 100%)" },
  { id: "rose", name: "Rose", css: "linear-gradient(135deg,#fb7185 0%,#e11d48 50%,#7c2d92 100%)" },
  { id: "midnight", name: "Midnight", css: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 55%,#312e81 100%)" },
  { id: "paper", name: "Paper", css: "linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%)", light: true },
];

const MONO = "'JetBrains Mono Variable','JetBrains Mono',ui-monospace,Menlo,Consolas,monospace";
const SANS = "'Inter Variable',Inter,ui-sans-serif,system-ui,sans-serif";

const ExportCard = forwardRef(function ExportCard({ code, lang, fileName, opts, output }, ref) {
  const prepared = useMemo(() => code.replace(/\t/g, "    ").replace(/\s+$/g, ""), [code]);
  const lines = useMemo(() => highlightLines(prepared, lang.hljs), [prepared, lang.hljs]);
  const bg = BACKGROUNDS.find((b) => b.id === opts.bg) || BACKGROUNDS[0];

  const longest = useMemo(() => Math.max(...prepared.split("\n").map((l) => l.length), 20), [prepared]);
  const gutter = opts.lineNumbers ? 52 : 0;
  const width = Math.round(Math.min(1400, Math.max(640, longest * 8.45 + gutter + 56 + opts.padding * 2)));

  return (
    <div
      ref={ref}
      style={{
        width,
        padding: opts.padding,
        background: bg.css,
        fontFamily: SANS,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          borderRadius: 16,
          background: "#0b0b16",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 40px 90px -25px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        {opts.chrome && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 18px",
              background: "rgba(255,255,255,0.04)",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ width: 12, height: 12, borderRadius: 99, background: "#ff5f57" }} />
              <span style={{ width: 12, height: 12, borderRadius: 99, background: "#febc2e" }} />
              <span style={{ width: 12, height: 12, borderRadius: 99, background: "#28c840" }} />
            </div>
            <div
              style={{
                flex: 1,
                textAlign: "center",
                fontFamily: MONO,
                fontSize: 13,
                color: "rgba(228,228,240,0.65)",
                marginRight: 52,
              }}
            >
              {fileName}
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.04em",
                color: lang.color,
                border: `1px solid ${lang.color}55`,
                background: `${lang.color}18`,
                padding: "3px 10px",
                borderRadius: 99,
                marginLeft: -52,
              }}
            >
              {lang.name}
            </span>
          </div>
        )}

        <div className="export-code" style={{ padding: "22px 0", fontFamily: MONO, fontSize: 14, lineHeight: 1.65, color: "#e4e4f0" }}>
          {lines.map((html, i) => (
            <div key={i} style={{ display: "flex" }}>
              {opts.lineNumbers && (
                <span
                  style={{
                    width: gutter,
                    flexShrink: 0,
                    textAlign: "right",
                    paddingRight: 20,
                    color: "#4a4d6a",
                    boxSizing: "border-box",
                  }}
                >
                  {i + 1}
                </span>
              )}
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  paddingLeft: opts.lineNumbers ? 0 : 28,
                  paddingRight: 28,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  minHeight: "1.65em",
                }}
                dangerouslySetInnerHTML={{ __html: html || "&#8203;" }}
              />
            </div>
          ))}
        </div>

        {opts.output && output && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.38)", padding: "14px 28px 20px" }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.16em", color: "rgba(228,228,240,0.4)", marginBottom: 8 }}>
              OUTPUT
            </div>
            <pre
              style={{
                margin: 0,
                fontFamily: MONO,
                fontSize: 13,
                lineHeight: 1.6,
                color: "#a7f3d0",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {output}
            </pre>
          </div>
        )}
      </div>

      {opts.watermark && (
        <div
          style={{
            marginTop: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 8,
            fontSize: 12.5,
            fontWeight: 600,
            letterSpacing: "0.04em",
            color: bg.light ? "rgba(15,23,42,0.55)" : "rgba(255,255,255,0.75)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="9" fill={bg.light ? "#4f46e5" : "rgba(255,255,255,0.9)"} />
            <path d="M12 11l-5 5 5 5M20 11l5 5-5 5" stroke={bg.light ? "#fff" : "#4f46e5"} strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Made with MeRa Poly
        </div>
      )}
    </div>
  );
});

export default ExportCard;
