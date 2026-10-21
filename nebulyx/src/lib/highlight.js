import hljs from "highlight.js/lib/core";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";

hljs.registerLanguage("c", c);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("java", java);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("python", python);

/**
 * Highlights `code` and returns one HTML string per line.
 * Spans that cross line breaks are closed and re-opened so every line is valid HTML.
 */
export function highlightLines(code, language) {
  let html;
  try {
    html = hljs.highlight(code, { language, ignoreIllegals: true }).value;
  } catch {
    html = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  const lines = [];
  const stack = [];
  let cur = "";
  const re = /(<span[^>]*>)|(<\/span>)|(\n)|([^<\n]+)/g;
  let m;
  while ((m = re.exec(html))) {
    if (m[1]) {
      stack.push(m[1]);
      cur += m[1];
    } else if (m[2]) {
      stack.pop();
      cur += m[2];
    } else if (m[3]) {
      cur += "</span>".repeat(stack.length);
      lines.push(cur);
      cur = stack.join("");
    } else {
      cur += m[4];
    }
  }
  lines.push(cur);
  return lines;
}
