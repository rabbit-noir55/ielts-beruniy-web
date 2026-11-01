import fs from "node:fs";

const ORIGIN = "http://127.0.0.1:5173";
const CDP = process.env.CDP_URL || "http://127.0.0.1:9222";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForChrome() {
  for (let i = 0; i < 50; i += 1) {
    try {
      const response = await fetch(`${CDP}/json/version`);
      if (response.ok) return;
    } catch {
      // Chrome is still starting.
    }
    await delay(200);
  }
  throw new Error("Chrome DevTools endpoint did not start");
}

async function newTab() {
  const response = await fetch(`${CDP}/json/new?${encodeURIComponent(ORIGIN)}`, {
    method: "PUT",
  });
  if (!response.ok) throw new Error(`Cannot create browser tab: ${response.status}`);
  return response.json();
}

function connect(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  let nextId = 1;
  const pending = new Map();
  const runtimeErrors = [];

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }
    if (message.method === "Runtime.exceptionThrown") {
      runtimeErrors.push(
        message.params?.exceptionDetails?.exception?.description ||
          message.params?.exceptionDetails?.text ||
          "Unknown runtime exception",
      );
    }
  };

  const opened = new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = () => reject(new Error("Cannot connect to Chrome DevTools"));
  });

  async function send(method, params = {}) {
    await opened;
    const id = nextId;
    nextId += 1;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }

  return { socket, send, runtimeErrors };
}

async function evaluate(send, expression) {
  const result = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || "Browser evaluation failed");
  }
  return result.result.value;
}

function firstUsefulQuestion(part) {
  return (part.questions || []).find((q) => q.context || q.prompt);
}

function markerFor(question) {
  return String(question?.context || question?.prompt || "")
    .replace(/\[input\s*\d+\]/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 45);
}

async function auditRoute(cdp, route, expected) {
  const beforeErrors = cdp.runtimeErrors.length;
  await evaluate(
    cdp.send,
    `localStorage.setItem("ielts_token", "browser-audit-token");
     localStorage.setItem("ielts_user", JSON.stringify({
       id: 0, email: "audit@local.test", full_name: "Browser Audit",
       role: "student", group_detail: null, is_blocked: false
     })); true;`,
  );
  await cdp.send("Page.navigate", { url: `${ORIGIN}${route}` });

  let snapshot = null;
  for (let i = 0; i < 80; i += 1) {
    await delay(100);
    snapshot = await evaluate(
      cdp.send,
      `(() => ({
        path: location.pathname,
        ready: document.readyState,
        text: document.body?.innerText || "",
        controls: document.querySelectorAll("input, select, textarea").length,
        rootChildren: document.querySelector("#root")?.childElementCount || 0
      }))()`,
    );
    if (
      snapshot.ready === "complete" &&
      snapshot.path === route &&
      !/Loading|Yuklanmoqda/i.test(snapshot.text)
    ) {
      break;
    }
  }

  const errors = [];
  if (snapshot.path !== route) errors.push(`redirected to ${snapshot.path}`);
  if (!snapshot.rootChildren) errors.push("empty React root");
  if (/Test ma'lumotlari topilmadi|Data not loaded|No data found|HTTP 404/i.test(snapshot.text)) {
    errors.push("data loading error shown");
  }
  if (!snapshot.text.includes(expected.title)) errors.push("title is missing");
  if (expected.marker && !snapshot.text.replace(/\s+/g, " ").includes(expected.marker)) {
    errors.push(`question text is missing: ${expected.marker}`);
  }
  if (expected.kind === "reading" && expected.passageLength > 250) {
    const visibleText = snapshot.text.replace(/\s+/g, " ");
    if (!visibleText.includes(expected.passageMarker)) errors.push("passage text is missing");
  }
  if (snapshot.controls === 0) errors.push("no answer controls rendered");

  const routeRuntimeErrors = cdp.runtimeErrors.slice(beforeErrors);
  if (routeRuntimeErrors.length) {
    errors.push(`runtime: ${routeRuntimeErrors[0].split("\n")[0]}`);
  }
  return { route, ok: errors.length === 0, errors };
}

async function main() {
  await waitForChrome();
  const tab = await newTab();
  const cdp = connect(tab.webSocketDebuggerUrl);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await delay(800);

  await evaluate(
    cdp.send,
    `localStorage.setItem("ielts_token", "browser-audit-token");
     localStorage.setItem("ielts_user", JSON.stringify({
       id: 0, email: "audit@local.test", first_name: "Browser", last_name: "Audit",
       full_name: "Browser Audit", role: "student", group_detail: null, is_blocked: false
     })); true;`,
  );

  const cases = [];
  for (let mock = 1; mock <= 22; mock += 1) {
    const data = JSON.parse(
      fs.readFileSync(`public/json/ourMocks/reading_test${mock}.json`, "utf8"),
    );
    for (const part of data.parts || []) {
      const question = firstUsefulQuestion(part);
      const passages = part.passages || [];
      const firstPassage = passages[0];
      const passageText =
        typeof firstPassage === "string"
          ? firstPassage
          : `${firstPassage?.heading || ""} ${firstPassage?.content || ""}`;
      cases.push({
        route: `/mock/${mock}/1/reading/${part.part}`,
        expected: {
          kind: "reading",
          title: part.title,
          marker: markerFor(question),
          passageLength: passageText.length,
          passageMarker: passageText.replace(/\s+/g, " ").trim().slice(0, 55),
        },
      });
    }
  }

  for (let mock = 1; mock <= 24; mock += 1) {
    const data = JSON.parse(
      fs.readFileSync(`public/json/ourMocks/listening_test${mock}.json`, "utf8"),
    );
    for (const part of data.parts || []) {
      const question = firstUsefulQuestion(part);
      cases.push({
        route: `/mock/${mock}/1/listening/${part.part}`,
        expected: {
          kind: "listening",
          title: "Listening",
          marker: markerFor(question),
          passageLength: 0,
          passageMarker: "",
        },
      });
    }
  }

  const requestedKind = process.env.AUDIT_KIND;
  const selectedCases = requestedKind
    ? cases.filter((item) => item.expected.kind === requestedKind)
    : cases;
  const start = Number(process.env.AUDIT_START || 0);
  const end = Number(process.env.AUDIT_END || selectedCases.length);
  const auditCases = selectedCases.slice(start, end);

  const failures = [];
  for (let i = 0; i < auditCases.length; i += 1) {
    const current = auditCases[i];
    let result;
    try {
      result = await auditRoute(cdp, current.route, current.expected);
    } catch (error) {
      result = { route: current.route, ok: false, errors: [error.message] };
    }
    if (!result.ok) failures.push(result);
    if (!result.ok) console.log(`FAIL ${result.route}: ${result.errors.join("; ")}`);
    if ((i + 1) % 20 === 0 || i + 1 === auditCases.length) {
      console.log(`Checked ${i + 1}/${auditCases.length}; failures: ${failures.length}`);
    }
  }

  console.log(JSON.stringify({ total: auditCases.length, failures }, null, 2));
  cdp.socket.close();
  if (failures.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
