"use client";

import { memo, useMemo, useRef } from "react";
import Editor from "@monaco-editor/react";
import {
  LuCheck,
  LuCopy,
  LuDownload,
  LuFolderOpen,
  LuImageDown,
  LuMaximize2,
  LuMinimize2,
  LuRotateCcw,
  LuSettings2,
  LuSparkles,
  LuWandSparkles,
} from "react-icons/lu";
import { defineThemes } from "@/lib/themes";
import { cx } from "./ui";

function EditorSkeleton() {
  return (
    <div className="flex h-full flex-col gap-3 p-6">
      {[60, 80, 45, 70, 35, 55].map((w, i) => (
        <div key={i} className="shimmer h-3.5 rounded-full" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

function Btn({ onClick, title, children, active, disabled }) {
  return (
    <button className="icon-btn" onClick={onClick} title={title} aria-label={title} data-active={active} disabled={disabled}>
      {children}
    </button>
  );
}

function EditorPanel({
  lang,
  code,
  onChange,
  settings,
  fileName,
  baseName,
  onBaseName,
  copied,
  focus,
  onToggleFocus,
  onCopy,
  onDownload,
  onExportImage,
  onOpenFile,
  onReset,
  onFormat,
  onTemplates,
  onSettings,
  onCursor,
  handlersRef,
  editorRef,
  ready,
}) {
  const fileInput = useRef(null);
  const isJava = lang.id === "java";

  const options = useMemo(
    () => ({
      fontFamily: "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace",
      fontSize: settings.fontSize,
      fontLigatures: settings.ligatures,
      tabSize: settings.tabSize,
      insertSpaces: true,
      wordWrap: settings.wordWrap ? "on" : "off",
      minimap: { enabled: settings.minimap },
      lineNumbers: settings.lineNumbers ? "on" : "off",
      smoothScrolling: true,
      cursorSmoothCaretAnimation: settings.smoothCursor ? "on" : "off",
      cursorBlinking: "smooth",
      padding: { top: 16, bottom: 16 },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      renderLineHighlight: "all",
      bracketPairColorization: { enabled: true },
      guides: { bracketPairs: true, indentation: true },
      roundedSelection: true,
      mouseWheelZoom: false,
      folding: true,
      lineDecorationsWidth: 8,
      lineNumbersMinChars: 3,
      overviewRulerBorder: false,
      hideCursorInOverviewRuler: true,
      scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10, useShadows: false },
      fixedOverflowWidgets: true,
      quickSuggestions: true,
      suggestOnTriggerCharacters: true,
      contextmenu: true,
    }),
    [settings]
  );

  const handleMount = (editor, monaco) => {
    editorRef.current = { editor, monaco };
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => handlersRef.current.run());
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => handlersRef.current.download());
    editor.onDidChangeCursorPosition((e) => onCursor({ line: e.position.lineNumber, col: e.position.column }));
    editor.focus();
  };

  return (
    <section className="glass flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl lg:rounded-3xl">
      {/* toolbar */}
      <header className="flex items-center gap-1 border-b border-white/[0.07] px-2 py-2 sm:px-3">
        <div className="mr-1 flex min-w-0 items-center gap-2 rounded-xl bg-white/[0.05] py-1 pl-2.5 pr-2">
          <lang.Icon size={15} style={{ color: lang.color }} className="shrink-0" />
          {isJava ? (
            <span className="max-w-[110px] truncate font-mono text-[12.5px] text-white/85">{fileName}</span>
          ) : (
            <label className="flex items-center font-mono text-[12.5px] text-white/85">
              <input
                value={baseName}
                onChange={(e) => onBaseName(e.target.value.replace(/[^\w\-]/g, "").slice(0, 24))}
                spellCheck={false}
                aria-label="File name"
                className="w-[74px] bg-transparent text-white outline-none sm:w-[96px]"
              />
              <span className="text-white/40">.{lang.ext}</span>
            </label>
          )}
        </div>

        <div className="no-scrollbar -mr-1 flex flex-1 items-center gap-0.5 overflow-x-auto">
          <Btn onClick={onTemplates} title="Templates & snippets">
            <LuSparkles size={17} />
            <span className="hidden xl:inline">Templates</span>
          </Btn>
          <Btn onClick={() => fileInput.current?.click()} title="Open a file">
            <LuFolderOpen size={17} />
          </Btn>
          <span className="mx-1 h-5 w-px shrink-0 bg-white/10" />
          <Btn onClick={onCopy} title="Copy code">
            {copied ? <LuCheck size={17} className="text-emerald-400" /> : <LuCopy size={17} />}
          </Btn>
          <Btn onClick={onDownload} title="Download as file (Ctrl+S)">
            <LuDownload size={17} />
            <span className="hidden xl:inline">File</span>
          </Btn>
          <Btn onClick={onExportImage} title="Download as image">
            <LuImageDown size={17} />
            <span className="hidden xl:inline">Image</span>
          </Btn>
          <span className="mx-1 h-5 w-px shrink-0 bg-white/10" />
          {lang.id === "javascript" && (
            <Btn onClick={onFormat} title="Format code">
              <LuWandSparkles size={17} />
            </Btn>
          )}
          <Btn onClick={onReset} title="Reset to starter template">
            <LuRotateCcw size={17} />
          </Btn>
          <Btn onClick={onToggleFocus} title={focus ? "Exit focus mode" : "Focus mode"} active={focus}>
            {focus ? <LuMinimize2 size={17} /> : <LuMaximize2 size={17} />}
          </Btn>
          <Btn onClick={onSettings} title="Settings (Ctrl+,)">
            <LuSettings2 size={17} />
          </Btn>
        </div>

        <input
          ref={fileInput}
          type="file"
          className="hidden"
          accept=".c,.h,.cpp,.cc,.cxx,.hpp,.java,.js,.mjs,.cjs,.py,.txt"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onOpenFile(f);
            e.target.value = "";
          }}
        />
      </header>

      {/* editor */}
      <div className={cx("relative min-h-0 flex-1")} style={{ background: "var(--color-panel)" }}>
        {ready ? (
          <Editor
            height="100%"
            language={lang.monaco}
            value={code}
            theme={settings.theme}
            onChange={(v) => onChange(v ?? "")}
            beforeMount={defineThemes}
            onMount={handleMount}
            loading={<EditorSkeleton />}
            options={options}
          />
        ) : (
          <EditorSkeleton />
        )}
      </div>
    </section>
  );
}

export default memo(EditorPanel);
