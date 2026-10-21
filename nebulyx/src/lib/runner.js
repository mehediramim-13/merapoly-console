/**
 * Client-side execution helpers.
 *  - JavaScript runs in a sandboxed Web Worker (public/js-runner.worker.js)
 *  - C / C++ / Java / Python go through /api/run
 */

export function runJavaScript(code, stdin, timeoutMs, onMessage) {
  let cancel = () => {};

  const promise = new Promise((resolve) => {
    let finished = false;
    const worker = new Worker("/js-runner.worker.js");

    const finish = (result) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      worker.terminate();
      resolve(result);
    };

    const timer = setTimeout(() => finish({ ok: false, timedOut: true, time: timeoutMs }), timeoutMs);
    cancel = () => finish({ ok: false, cancelled: true, time: 0 });

    worker.onmessage = (ev) => {
      const d = ev.data;
      if (d.type === "done") finish(d);
      else onMessage(d);
    };
    worker.onerror = (ev) => finish({ ok: false, error: ev.message || "Worker error", time: 0 });
    worker.postMessage({ code, stdin });
  });

  return { promise, cancel: () => cancel() };
}

export function runOnServer(language, code, stdin, timeoutSec) {
  const controller = new AbortController();

  const promise = (async () => {
    const res = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, code, stdin, timeout: timeoutSec }),
      signal: controller.signal,
    });
    let data = null;
    try {
      data = await res.json();
    } catch {
      /* ignore */
    }
    if (!res.ok) throw new Error(data?.error || `Runner error (${res.status})`);
    return data;
  })();

  return { promise, cancel: () => controller.abort() };
}
