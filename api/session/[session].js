const crypto = require("crypto");

let cachedAccessToken = null;

function json(res, status, body) {
  res.status(status).json(body);
}

function base64Url(value) {
  return Buffer.from(value).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function getSession(value) {
  const session = String(value || "");
  return /^[a-zA-Z0-9_-]{1,64}$/.test(session) ? session : null;
}

function presenterKeyMatches(provided) {
  const expected = String(process.env.PRESENTER_ACCESS_SECRET || "");
  const candidate = String(provided || "");
  if (!expected || !candidate) return false;
  const expectedBuffer = Buffer.from(expected);
  const candidateBuffer = Buffer.from(candidate);
  return expectedBuffer.length === candidateBuffer.length && crypto.timingSafeEqual(expectedBuffer, candidateBuffer);
}

function serviceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const credentials = JSON.parse(raw);
    if (!credentials.client_email || !credentials.private_key) throw new Error("Firebase service account is missing client_email or private_key");
    return credentials;
  } catch (error) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON");
  }
}

async function getServiceAccountToken(credentials) {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) return cachedAccessToken.value;
  const tokenUri = credentials.token_uri || "https://oauth2.googleapis.com/token";
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(JSON.stringify({
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email",
    aud: tokenUri,
    iat: issuedAt,
    exp: issuedAt + 3600
  }));
  const unsigned = header + "." + claim;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const assertion = unsigned + "." + signer.sign(credentials.private_key.replace(/\\n/g, "\n")).toString("base64url");
  const response = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }).toString()
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) throw new Error(payload.error_description || "Unable to authorize Firebase service account");
  cachedAccessToken = { value: payload.access_token, expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1000 };
  return cachedAccessToken.value;
}

async function firebaseRequest(method, session, body) {
  const databaseUrl = String(process.env.FIREBASE_DATABASE_URL || "").replace(/\/+$/, "");
  if (!databaseUrl) throw new Error("FIREBASE_DATABASE_URL is not configured");
  const url = new URL(databaseUrl + "/sessions/" + encodeURIComponent(session) + ".json");
  const headers = { Accept: "application/json" };
  const secret = process.env.FIREBASE_DATABASE_SECRET;
  if (secret) url.searchParams.set("auth", secret);
  else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) headers.Authorization = "Bearer " + await getServiceAccountToken(serviceAccount());
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store" });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error || "Firebase Realtime Database request failed");
  return payload;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Presenter-Key");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();

  const session = getSession(req.query?.session);
  if (!session) return json(res, 400, { error: "Invalid presentation session" });

  if (req.method === "GET") {
    try {
      const state = await firebaseRequest("GET", session);
      return json(res, 200, {
        session,
        state: state && typeof state === "object" ? state : null,
        firebaseDatabaseUrl: String(process.env.FIREBASE_DATABASE_URL || "").replace(/\/+$/, "") || null
      });
    } catch (error) {
      return json(res, 503, { error: error.message || "Realtime backend is not configured" });
    }
  }

  if (req.method === "PUT") {
    const presenterKey = req.headers["x-presenter-key"] || String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!presenterKeyMatches(presenterKey)) return json(res, 401, { error: "Invalid presenter key" });
    const slide = Number(req.body?.slide);
    if (!Number.isInteger(slide) || slide < 0 || slide > 999) return json(res, 400, { error: "Slide must be a non-negative integer" });
    try {
      const state = { slide, updatedAt: new Date().toISOString() };
      await firebaseRequest("PUT", session, state);
      return json(res, 200, { ok: true, session, state, firebaseDatabaseUrl: String(process.env.FIREBASE_DATABASE_URL || "").replace(/\/+$/, "") || null });
    } catch (error) {
      return json(res, 503, { error: error.message || "Unable to publish slide" });
    }
  }

  return json(res, 405, { error: "Method not allowed" });
};
