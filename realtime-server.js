const http = require("http");
const fs = require("fs");
const path = require("path");

const port = Number(process.env.PORT || 3000);
const stateFile = process.env.REALTIME_STATE_FILE || path.join(process.cwd(), "sessions.json");
const sessions = new Map();
const listeners = new Map();

function loadState() {
  try {
    const saved = JSON.parse(fs.readFileSync(stateFile, "utf8"));
    Object.entries(saved).forEach(([session, state]) => sessions.set(session, state));
  } catch (error) {
    if (error.code !== "ENOENT") console.error("Unable to load realtime state:", error.message);
  }
}

function persistState() {
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  const serialized = Object.fromEntries(sessions.entries());
  fs.writeFileSync(stateFile, JSON.stringify(serialized, null, 2));
}

function validSession(value) {
  return /^[a-zA-Z0-9_-]{1,64}$/.test(value || "") ? value : null;
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  res.setHeader("Cache-Control", "no-store, max-age=0");
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function sessionFromPath(pathname) {
  const match = pathname.match(/^\/sessions\/([a-zA-Z0-9_-]{1,64})(?:\.json)?$/);
  return match ? validSession(match[1]) : null;
}

function publish(session, state) {
  const message = `event: put\ndata: ${JSON.stringify({ path: "/", data: state })}\n\n`;
  const sessionListeners = listeners.get(session) || new Set();
  for (const response of sessionListeners) {
    try { response.write(message); } catch (error) { sessionListeners.delete(response); }
  }
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 32_000) req.destroy(new Error("Request body too large"));
    });
    req.on("end", () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch (error) { reject(new Error("Request body must be valid JSON")); }
    });
    req.on("error", reject);
  });
}

function openStream(req, res, session) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();
  res.write("retry: 1800\n\n");
  res.write(`event: put\ndata: ${JSON.stringify({ path: "/", data: sessions.get(session) || null })}\n\n`);

  if (!listeners.has(session)) listeners.set(session, new Set());
  listeners.get(session).add(res);
  const heartbeat = setInterval(() => { try { res.write(": keep-alive\n\n"); } catch (error) {} }, 20_000);
  req.on("close", () => {
    clearInterval(heartbeat);
    listeners.get(session)?.delete(res);
  });
}

loadState();

const server = http.createServer(async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") return res.writeHead(204).end();

  const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (req.method === "GET" && requestUrl.pathname === "/health") return sendJson(res, 200, { ok: true, service: "agent37-presentation-realtime" });

  const session = sessionFromPath(requestUrl.pathname);
  if (!session) return sendJson(res, 404, { error: "Unknown realtime route" });

  if (req.method === "GET") {
    if ((req.headers.accept || "").includes("text/event-stream")) return openStream(req, res, session);
    return sendJson(res, 200, sessions.get(session) || null);
  }

  if (req.method === "PUT") {
    try {
      const input = await parseBody(req);
      const slide = Number(input.slide);
      if (!Number.isInteger(slide) || slide < 0 || slide > 999) return sendJson(res, 400, { error: "Slide must be a non-negative integer" });
      const state = { slide, updatedAt: new Date().toISOString() };
      sessions.set(session, state);
      persistState();
      publish(session, state);
      return sendJson(res, 200, { ok: true, session, state });
    } catch (error) {
      return sendJson(res, 400, { error: error.message || "Unable to publish slide" });
    }
  }

  return sendJson(res, 405, { error: "Method not allowed" });
});

server.listen(port, "0.0.0.0", () => console.log(`Presentation realtime server listening on ${port}`));
