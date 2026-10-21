/* MeRa Poly — sandboxed JavaScript runner (runs inside a Web Worker) */

const MAX_LOGS = 3000;
let logCount = 0;
let truncated = false;
let indent = 0;
let stdinLines = [];
const timers = new Map();
const counts = new Map();
const pending = new Set();
let mainDone = false;
let finished = false;
let failed = false;
const started = () => performance.now();
let t0 = 0;

/* ----------------------------- formatting ----------------------------- */

const IDENT = /^[A-Za-z_$][\w$]*$/;

function pad(text) {
  return text
    .split("\n")
    .map((l) => "  " + l)
    .join("\n");
}

function wrap(open, items, close, extra) {
  if (!items.length) return extra ? extra + open + close : open + close;
  const single = open + " " + items.join(", ") + " " + close;
  const prefix = extra || "";
  if (single.length <= 72 && !single.includes("\n")) return prefix + single;
  return prefix + open + "\n" + items.map(pad).join(",\n") + "\n" + close;
}

function isError(v) {
  return v instanceof Error || (v !== null && typeof v === "object" && typeof v.message === "string" && typeof v.name === "string" && "stack" in v);
}

function inspect(v, depth = 0, seen = new WeakSet(), top = true) {
  const t = typeof v;
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  if (t === "string") return top ? v : "'" + v.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n") + "'";
  if (t === "number") return Object.is(v, -0) ? "-0" : String(v);
  if (t === "boolean") return String(v);
  if (t === "bigint") return v + "n";
  if (t === "symbol") return v.toString();
  if (t === "function") {
    let src = "";
    try {
      src = Function.prototype.toString.call(v);
    } catch {}
    if (/^class[\s{]/.test(src)) return "[class " + (v.name || "(anonymous)") + "]";
    return "[Function" + (v.name ? ": " + v.name : " (anonymous)") + "]";
  }
  if (isError(v)) return cleanStack(v);
  if (seen.has(v)) return "[Circular]";
  if (depth > 3) return Array.isArray(v) ? "[Array]" : "[Object]";
  seen.add(v);
  let out;
  try {
    if (v instanceof Date) out = isNaN(v) ? "Invalid Date" : v.toISOString();
    else if (v instanceof RegExp) out = String(v);
    else if (typeof Promise !== "undefined" && v instanceof Promise) out = "Promise { <pending> }";
    else if (Array.isArray(v)) {
      const items = [];
      const max = Math.min(v.length, 100);
      for (let i = 0; i < max; i++) items.push(inspect(v[i], depth + 1, seen, false));
      if (v.length > max) items.push("... " + (v.length - max) + " more items");
      out = wrap("[", items, "]");
    } else if (v instanceof Map) {
      const items = [];
      for (const [k, val] of v) items.push(inspect(k, depth + 1, seen, false) + " => " + inspect(val, depth + 1, seen, false));
      out = wrap("{", items, "}", "Map(" + v.size + ") ");
    } else if (v instanceof Set) {
      const items = [];
      for (const val of v) items.push(inspect(val, depth + 1, seen, false));
      out = wrap("{", items, "}", "Set(" + v.size + ") ");
    } else if (ArrayBuffer.isView(v) && !(v instanceof DataView)) {
      const items = Array.from(v)
        .slice(0, 100)
        .map((n) => String(n));
      out = wrap("[", items, "]", v.constructor.name + "(" + v.length + ") ");
    } else {
      const keys = Object.keys(v);
      const items = keys.slice(0, 100).map((k) => {
        let val;
        try {
          val = inspect(v[k], depth + 1, seen, false);
        } catch {
          val = "[Getter]";
        }
        return (IDENT.test(k) ? k : "'" + k + "'") + ": " + val;
      });
      if (keys.length > 100) items.push("... " + (keys.length - 100) + " more properties");
      const name = v.constructor && v.constructor.name;
      const prefix = !name ? "[Object: null prototype] " : name !== "Object" ? name + " " : "";
      out = wrap("{", items, "}", prefix);
    }
  } finally {
    seen.delete(v);
  }
  return out;
}

function cleanStack(err) {
  const head = err.name + ": " + err.message;
  return head;
}

function format(args) {
  if (!args.length) return "";
  let [first, ...rest] = args;
  let out = "";
  if (typeof first === "string" && first.includes("%")) {
    out = first.replace(/%([sdifoOjc%])/g, (m, f) => {
      if (f === "%") return "%";
      if (!rest.length) return m;
      const a = rest.shift();
      switch (f) {
        case "s":
          return typeof a === "string" ? a : inspect(a, 1, new WeakSet(), false);
        case "d":
        case "i":
          return typeof a === "bigint" ? a + "n" : String(f === "i" ? parseInt(a) : Number(a));
        case "f":
          return String(parseFloat(a));
        case "j":
          try {
            return JSON.stringify(a);
          } catch {
            return "[Circular]";
          }
        case "c":
          return "";
        default:
          return inspect(a, 0, new WeakSet(), false);
      }
    });
  } else {
    out = inspect(first);
  }
  for (const a of rest) out += " " + inspect(a);
  return out;
}

/* ------------------------------ output ------------------------------ */

function emit(level, text) {
  if (logCount >= MAX_LOGS) {
    if (!truncated) {
      truncated = true;
      self.postMessage({ type: "log", level: "warn", text: "Output limit reached — further logs are hidden." });
    }
    return;
  }
  logCount++;
  const prefix = "  ".repeat(indent);
  const out = indent ? text.split("\n").map((l) => prefix + l).join("\n") : text;
  self.postMessage({ type: "log", level, text: out });
}

function table(data, columns) {
  if (data === null || typeof data !== "object") return emit("log", format([data]));
  const rows = [];
  const cols = [];
  let hasValues = false;
  const add = (c) => {
    if (!cols.includes(c)) cols.push(c);
  };
  const entries = data instanceof Map ? Array.from(data.entries()) : data instanceof Set ? Array.from(data).map((v, i) => [i, v]) : Object.entries(data);
  for (const [idx, val] of entries) {
    const row = { "(index)": String(idx) };
    if (val !== null && typeof val === "object") {
      for (const k of Object.keys(val)) {
        add(k);
        row[k] = inspect(val[k], 2, new WeakSet(), false);
      }
    } else {
      hasValues = true;
      row.Values = inspect(val, 2, new WeakSet(), false);
    }
    rows.push(row);
  }
  let headers = ["(index)", ...(Array.isArray(columns) ? columns : cols)];
  if (hasValues) headers.push("Values");
  const widths = headers.map((h) => Math.max(h.length, ...rows.map((r) => (r[h] ?? "").length)) + 2);
  const center = (s, w) => {
    const total = w - s.length;
    const left = Math.floor(total / 2);
    return " ".repeat(left) + s + " ".repeat(total - left);
  };
  const line = (l, m, r) => l + widths.map((w) => "─".repeat(w)).join(m) + r;
  const out = [
    line("┌", "┬", "┐"),
    "│" + headers.map((h, i) => center(h, widths[i])).join("│") + "│",
    line("├", "┼", "┤"),
    ...rows.map((r) => "│" + headers.map((h, i) => center(r[h] ?? "", widths[i])).join("│") + "│"),
    line("└", "┴", "┘"),
  ];
  emit("log", out.join("\n"));
}

const con = {
  log: (...a) => emit("log", format(a)),
  info: (...a) => emit("info", format(a)),
  debug: (...a) => emit("debug", format(a)),
  warn: (...a) => emit("warn", format(a)),
  error: (...a) => emit("error", format(a)),
  trace: (...a) => emit("log", "Trace: " + format(a)),
  dir: (v) => emit("log", inspect(v, 0, new WeakSet(), false)),
  table,
  assert: (cond, ...a) => {
    if (!cond) emit("error", "Assertion failed" + (a.length ? ": " + format(a) : ""));
  },
  count: (label = "default") => {
    counts.set(label, (counts.get(label) || 0) + 1);
    emit("log", label + ": " + counts.get(label));
  },
  countReset: (label = "default") => counts.delete(label),
  time: (label = "default") => timers.set(label, performance.now()),
  timeLog: (label = "default", ...a) => {
    if (!timers.has(label)) return emit("warn", "Timer '" + label + "' does not exist");
    emit("log", label + ": " + (performance.now() - timers.get(label)).toFixed(3) + "ms" + (a.length ? " " + format(a) : ""));
  },
  timeEnd: (label = "default") => {
    if (!timers.has(label)) return emit("warn", "Timer '" + label + "' does not exist");
    emit("log", label + ": " + (performance.now() - timers.get(label)).toFixed(3) + "ms");
    timers.delete(label);
  },
  group: (...a) => {
    if (a.length) emit("log", format(a));
    indent++;
  },
  groupCollapsed: (...a) => {
    if (a.length) emit("log", format(a));
    indent++;
  },
  groupEnd: () => {
    indent = Math.max(0, indent - 1);
  },
  clear: () => self.postMessage({ type: "clear" }),
};
self.console = Object.assign(Object.create(null), con);

/* ------------------------ timers & stdin helpers ----------------------- */

const _setTimeout = self.setTimeout.bind(self);
const _setInterval = self.setInterval.bind(self);
const _clearTimeout = self.clearTimeout.bind(self);
const _clearInterval = self.clearInterval.bind(self);

self.setTimeout = (fn, ms, ...args) => {
  if (typeof fn !== "function") return _setTimeout(fn, ms);
  const id = _setTimeout(() => {
    pending.delete(id);
    try {
      fn(...args);
    } catch (err) {
      reportError(err);
    }
    check();
  }, ms);
  pending.add(id);
  return id;
};
self.setInterval = (fn, ms, ...args) => {
  const id = _setInterval(() => {
    try {
      fn(...args);
    } catch (err) {
      reportError(err);
    }
  }, ms);
  pending.add(id);
  return id;
};
self.clearTimeout = (id) => {
  pending.delete(id);
  _clearTimeout(id);
  check();
};
self.clearInterval = (id) => {
  pending.delete(id);
  _clearInterval(id);
  check();
};

self.prompt = (msg) => {
  if (msg !== undefined) emit("info", String(msg));
  return stdinLines.length ? stdinLines.shift() : null;
};
self.alert = (msg) => emit("info", String(msg));
self.readline = self.prompt;

/* ------------------------------ lifecycle ------------------------------ */

function describe(err) {
  if (isError(err)) {
    let line = "";
    const stack = String(err.stack || "");
    const m = /(?:<anonymous>|AsyncFunction):(\d+):(\d+)/.exec(stack);
    if (m && /eval at|AsyncFunction/.test(stack) && Number(m[1]) > 2) line = "  (line " + (Number(m[1]) - 2) + ")";
    return err.name + ": " + err.message + line;
  }
  return "Uncaught " + inspect(err, 0, new WeakSet(), false);
}

function reportError(err) {
  failed = true;
  emit("error", describe(err));
}

function finish(ok, error) {
  if (finished) return;
  finished = true;
  self.postMessage({ type: "done", ok, error, time: Math.round(performance.now() - t0) });
}

function check() {
  if (mainDone && pending.size === 0 && !finished) _setTimeout(() => pending.size === 0 && finish(!failed), 0);
}

self.addEventListener("unhandledrejection", (ev) => {
  ev.preventDefault();
  failed = true;
  emit("error", "Uncaught (in promise) " + describe(ev.reason));
});
self.addEventListener("error", (ev) => {
  ev.preventDefault();
  failed = true;
  emit("error", ev.message || "Error");
});

self.onmessage = async (e) => {
  const { code, stdin } = e.data;
  stdinLines = (stdin || "").split(/\r?\n/);
  if (stdinLines.length && stdinLines[stdinLines.length - 1] === "") stdinLines.pop();
  t0 = performance.now();

  try {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const fn = new AsyncFunction(code);
    const result = await fn();
    if (result !== undefined) emit("log", "← " + inspect(result, 0, new WeakSet(), false));
    mainDone = true;
    check();
  } catch (err) {
    failed = true;
    emit("error", describe(err));
    mainDone = true;
    finish(false, describe(err));
  }
};
