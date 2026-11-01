import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import http from "http";

const DEV_URL = process.env.DEV_URL || "http://127.0.0.1:5173/settings";
const OUT_FILE = process.env.OUT_FILE || "screenshots/settings-telegram.png";
const CDP_PORT = process.env.CDP_PORT || 9222;
const USER_DATA_DIR = process.env.USER_DATA_DIR || "/tmp/opencode/chrome-profile-" + Date.now();
const TELEGRAM = process.env.TELEGRAM === "1";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    }).on("error", reject);
  });
}

async function wsConnect(wsUrl) {
  const socket = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  return socket;
}

function send(socket, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.random().toString(36).slice(2);
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === id) {
        socket.removeEventListener("message", handler);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
    socket.addEventListener("message", handler);
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function run() {
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });

  const chrome = spawn("chromium", [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--hide-scrollbars",
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    `--window-size=390,844`,
  ]);

  try {
    await sleep(1500);

    const versions = await fetchJson(`http://127.0.0.1:${CDP_PORT}/json/version`);
    console.log("Chrome version:", versions.Browser);

    const targets = await fetchJson(`http://127.0.0.1:${CDP_PORT}/json/list`);
    const pageTarget = targets.find((t) => t.type === "page") || targets[0];
    const socket = await wsConnect(pageTarget.webSocketDebuggerUrl);

    await send(socket, "Page.enable");
    await send(socket, "Runtime.enable");

    // Inject auth before navigation
    await send(socket, "Runtime.evaluate", {
      expression: `
        localStorage.setItem("ielts_token", "fake-token-for-screenshot");
        localStorage.setItem("ielts_user", JSON.stringify({
          id: 1, email: "test@example.com", first_name: "Test", last_name: "User",
          full_name: "Test User", role: "student", group: 3,
          group_detail: { id: 3, name: "IELTS-1", slug: "ielts-1", group_type: "ielts" },
          is_blocked: false
        }));
        localStorage.setItem("ielts_registered", "1");
        ${TELEGRAM
          ? `window.Telegram = { WebApp: { ready: () => {}, expand: () => {}, setHeaderColor: () => {}, disableVerticalSwipes: () => {} } };`
          : ""
        }
      `,
    });

    await send(socket, "Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true,
    });

    await send(socket, "Emulation.setUserAgentOverride", {
      userAgent:
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
    });

    await send(socket, "Page.navigate", { url: DEV_URL });
    await new Promise((resolve) => {
      const handler = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method === "Page.loadEventFired") {
          socket.removeEventListener("message", handler);
          resolve();
        }
      };
      socket.addEventListener("message", handler);
    });

    // Wait for lazy Settings chunk and React render
    await sleep(1500);

    const metrics = await send(socket, "Runtime.evaluate", {
      expression: `({
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        overflows: [...document.querySelectorAll('*')].filter(el => el.getBoundingClientRect().right > window.innerWidth + 1).length,
        tapTargets: [...document.querySelectorAll('button, a')].filter(el => el.getBoundingClientRect().height < 44).length,
        telegramCard: !!document.querySelector('a[href*="t.me"]'),
        googleBtn: !!document.querySelector('[data-testid="google-button"]') || !!document.querySelector('iframe[src*="accounts.google"]'),
        consoleErrors: []
      })`,
      returnByValue: true,
    });
    console.log("Metrics:", metrics.result.value);

    const screenshot = await send(socket, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(OUT_FILE, Buffer.from(screenshot.data, "base64"));
    console.log("Screenshot saved:", OUT_FILE);

    socket.close();
  } finally {
    chrome.kill("SIGKILL");
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
