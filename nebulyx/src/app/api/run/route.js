import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const LANGS = new Set(["c", "cpp", "java", "python"]);
const MAX_CODE = 200_000;
const MAX_OUT = 200_000;

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const probeCache = new Map();
function probe(cmd, args = ["--version"]) {
  const key = cmd + args.join(" ");
  if (probeCache.has(key)) return probeCache.get(key);
  let ok = false;
  try {
    const r = spawnSync(cmd, args, { stdio: "ignore", timeout: 5000, windowsHide: true });
    ok = !r.error && r.status === 0;
  } catch {
    ok = false;
  }
  probeCache.set(key, ok);
  return ok;
}

function pick(cmds, args) {
  return cmds.find((c) => probe(c, args)) || null;
}

function execute(cmd, args, { cwd, stdin = "", timeoutMs = 10000, env }) {
  return new Promise((resolve) => {
    const started = Date.now();
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let truncated = false;
    let child;

    try {
      child = spawn(cmd, args, { cwd, env, windowsHide: true });
    } catch (err) {
      return resolve({ stdout: "", stderr: String(err.message || err), code: 127, timedOut: false, time: 0 });
    }

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    const add = (kind) => (chunk) => {
      if (kind === "out") stdout += chunk;
      else stderr += chunk;
      if (stdout.length + stderr.length > MAX_OUT) {
        truncated = true;
        stdout = stdout.slice(0, MAX_OUT);
        stderr = stderr.slice(0, MAX_OUT);
        child.kill("SIGKILL");
      }
    };
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", add("out"));
    child.stderr.on("data", add("err"));

    child.stdin.on("error", () => {});
    child.stdin.end(stdin);

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ stdout, stderr: stderr + String(err.message || err), code: 127, timedOut, time: Date.now() - started });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (truncated) stderr += "\n[output truncated]";
      resolve({ stdout, stderr, code: code ?? 1, timedOut, time: Date.now() - started });
    });
  });
}

function cleanEnv(dir) {
  const keep = ["PATH", "Path", "SystemRoot", "SYSTEMROOT", "TEMP", "TMP", "LANG", "JAVA_HOME", "WINDIR", "ComSpec"];
  const env = { HOME: dir, USERPROFILE: dir, PYTHONIOENCODING: "utf-8", PYTHONUNBUFFERED: "1" };
  for (const k of keep) if (process.env[k]) env[k] = process.env[k];
  return env;
}

function detectJavaClass(code) {
  const m = code.match(/public\s+(?:final\s+|abstract\s+)*(?:class|interface|enum|record)\s+([A-Za-z_$][\w$]*)/);
  return m ? m[1] : "Main";
}

/* ------------------------------------------------------------------ */
/* local runner                                                        */
/* ------------------------------------------------------------------ */

function localToolchain(lang) {
  switch (lang) {
    case "python":
      return pick(["python3", "python", "py"]) ? true : false;
    case "c":
      return pick(["gcc", "cc", "clang"]) ? true : false;
    case "cpp":
      return pick(["g++", "c++", "clang++"]) ? true : false;
    case "java":
      return probe("javac", ["-version"]) && probe("java", ["-version"]);
    default:
      return false;
  }
}

async function runLocal(lang, code, stdin, timeoutMs) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "merapoly-"));
  const env = cleanEnv(dir);
  const exe = path.join(dir, process.platform === "win32" ? "main.exe" : "main");
  const result = { runner: "local", stdout: "", stderr: "", compileOutput: "", exitCode: 0, time: 0, timedOut: false };

  try {
    let run;
    if (lang === "python") {
      const py = pick(["python3", "python", "py"]);
      await fs.writeFile(path.join(dir, "main.py"), code);
      run = await execute(py, ["main.py"], { cwd: dir, stdin, timeoutMs, env });
    } else if (lang === "c" || lang === "cpp") {
      const isC = lang === "c";
      const cc = isC ? pick(["gcc", "cc", "clang"]) : pick(["g++", "c++", "clang++"]);
      const file = path.join(dir, isC ? "main.c" : "main.cpp");
      await fs.writeFile(file, code);
      const args = isC ? [file, "-o", exe, "-lm", "-O1"] : [file, "-o", exe, "-std=c++17", "-O1"];
      const compile = await execute(cc, args, { cwd: dir, timeoutMs: 20000, env });
      if (compile.code !== 0) {
        result.compileOutput = (compile.stderr || compile.stdout).replaceAll(dir + path.sep, "");
        result.exitCode = compile.code;
        return result;
      }
      if (compile.stderr.trim()) result.compileOutput = compile.stderr.replaceAll(dir + path.sep, "");
      run = await execute(exe, [], { cwd: dir, stdin, timeoutMs, env });
    } else {
      const cls = detectJavaClass(code);
      await fs.writeFile(path.join(dir, `${cls}.java`), code);
      const compile = await execute("javac", ["-encoding", "UTF-8", `${cls}.java`], { cwd: dir, timeoutMs: 25000, env });
      if (compile.code !== 0) {
        result.compileOutput = (compile.stderr || compile.stdout).replaceAll(dir + path.sep, "");
        result.exitCode = compile.code;
        return result;
      }
      run = await execute("java", ["-Dfile.encoding=UTF-8", "-cp", dir, cls], { cwd: dir, stdin, timeoutMs, env });
    }

    result.stdout = run.stdout;
    result.stderr = run.stderr;
    result.exitCode = run.code;
    result.time = run.time;
    result.timedOut = run.timedOut;
    return result;
  } finally {
    fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

/* ------------------------------------------------------------------ */
/* cloud runner (Judge0 CE)                                            */
/* ------------------------------------------------------------------ */

const JUDGE0_URL = (process.env.JUDGE0_URL || "https://ce.judge0.com").replace(/\/$/, "");
const FALLBACK_IDS = { c: 50, cpp: 54, java: 62, python: 71 };
let langCache = null;

const b64 = (s) => Buffer.from(s ?? "", "utf8").toString("base64");
const unb64 = (s) => (s ? Buffer.from(s, "base64").toString("utf8") : "");

function judgeHeaders() {
  const h = { "Content-Type": "application/json" };
  if (process.env.JUDGE0_API_KEY) h["X-Auth-Token"] = process.env.JUDGE0_API_KEY;
  return h;
}

async function resolveLanguageId(lang) {
  try {
    if (!langCache) {
      const res = await fetch(`${JUDGE0_URL}/languages`, { headers: judgeHeaders(), signal: AbortSignal.timeout(8000) });
      if (res.ok) langCache = await res.json();
    }
    if (langCache) {
      const patterns = {
        c: /^C \(GCC/i,
        cpp: /^C\+\+ \(GCC/i,
        java: /^Java \(OpenJDK/i,
        python: /^Python \(3/i,
      };
      const matches = langCache.filter((l) => patterns[lang].test(l.name));
      if (matches.length) return matches.sort((a, b) => b.id - a.id)[0].id;
    }
  } catch {
    /* use fallback */
  }
  return FALLBACK_IDS[lang];
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runCloud(lang, code, stdin, timeoutMs) {
  const language_id = await resolveLanguageId(lang);
  const body = JSON.stringify({
    source_code: b64(code),
    language_id,
    stdin: b64(stdin),
    cpu_time_limit: Math.max(2, Math.min(timeoutMs / 1000, 15)),
  });
  const qs = "base64_encoded=true&fields=*";

  let data;
  let res = await fetch(`${JUDGE0_URL}/submissions?${qs}&wait=true`, {
    method: "POST",
    headers: judgeHeaders(),
    body,
    signal: AbortSignal.timeout(45000),
  });

  if (res.ok) {
    data = await res.json();
  } else {
    // "wait" may be disabled: create and poll instead
    res = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=true`, {
      method: "POST",
      headers: judgeHeaders(),
      body,
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`Cloud runner responded with ${res.status}`);
    const { token } = await res.json();
    for (let i = 0; i < 30; i++) {
      await sleep(700);
      const poll = await fetch(`${JUDGE0_URL}/submissions/${token}?${qs}`, { headers: judgeHeaders(), signal: AbortSignal.timeout(10000) });
      if (!poll.ok) continue;
      data = await poll.json();
      if (data.status && data.status.id > 2) break;
    }
    if (!data) throw new Error("Cloud runner timed out");
  }

  const statusId = data.status?.id ?? 0;
  const out = {
    runner: "cloud",
    stdout: unb64(data.stdout),
    stderr: unb64(data.stderr),
    compileOutput: unb64(data.compile_output),
    exitCode: data.exit_code ?? (statusId === 3 ? 0 : 1),
    time: Math.round(parseFloat(data.time || "0") * 1000),
    timedOut: statusId === 5,
  };
  const message = unb64(data.message);
  if (message && !out.stderr) out.stderr = message;
  if (statusId > 3 && statusId !== 5 && statusId !== 6 && !out.stderr && !out.compileOutput) {
    out.stderr = data.status?.description || "Runtime error";
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* route                                                               */
/* ------------------------------------------------------------------ */

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { language, code, stdin = "", timeout = 10 } = payload || {};
  if (!LANGS.has(language)) return Response.json({ error: `Unsupported language: ${language}` }, { status: 400 });
  if (typeof code !== "string" || !code.trim()) return Response.json({ error: "Write some code first." }, { status: 400 });
  if (code.length > MAX_CODE) return Response.json({ error: "Code is too large." }, { status: 413 });

  const timeoutMs = Math.min(Math.max(Number(timeout) || 10, 2), 30) * 1000;
  const mode = (process.env.MERAPOLY_RUNNER || "auto").toLowerCase();
  const localFlag = process.env.MERAPOLY_LOCAL_RUNNER;
  const localAllowed = localFlag === "true" || (localFlag !== "false" && process.env.NODE_ENV !== "production");

  const useLocal = mode !== "cloud" && localAllowed && localToolchain(language);

  try {
    if (useLocal) {
      return Response.json(await runLocal(language, code, String(stdin), timeoutMs));
    }
    if (mode === "local") {
      return Response.json(
        {
          error: localAllowed
            ? `No local ${language.toUpperCase()} toolchain found. Install the compiler/interpreter or set MERAPOLY_RUNNER=auto.`
            : "Local runner is disabled in production. Set MERAPOLY_LOCAL_RUNNER=true to enable it.",
        },
        { status: 503 }
      );
    }
    return Response.json(await runCloud(language, code, String(stdin), timeoutMs));
  } catch (err) {
    return Response.json(
      {
        error:
          "Could not reach a code runner. Install the compiler locally (gcc, g++, JDK, Python) for offline runs, or check your internet connection. (" +
          (err?.message || "unknown error") +
          ")",
      },
      { status: 502 }
    );
  }
}

export async function GET() {
  const status = {};
  for (const l of LANGS) status[l] = localToolchain(l);
  return Response.json({ local: status });
}
