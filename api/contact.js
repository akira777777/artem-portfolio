// @ts-check

/**
 * @typedef {{
 *   method?: string;
 *   headers: import("node:http").IncomingHttpHeaders;
 *   body?: unknown;
 *   socket?: { remoteAddress?: string };
 * }} ContactRequest
 *
 * @typedef {{
 *   status: (code: number) => ContactResponse;
 *   json: (body: unknown) => void;
 *   setHeader: (name: string, value: string | number) => void;
 * }} ContactResponse
 */

const rateLimitWindowMs = 10 * 60 * 1000;
const rateLimitMaximum = 5;
/** @type {Map<string, {count: number, resetAt: number}>} */
const requestBuckets = new Map();

/** @param {ContactRequest} request */
function getClientAddress(request) {
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  if (Array.isArray(forwarded)) return forwarded[0] || "unknown";
  return request.socket?.remoteAddress || "unknown";
}

/** @param {string} address */
function consumeRateLimit(address) {
  const now = Date.now();
  const current = requestBuckets.get(address);
  if (!current || current.resetAt <= now) {
    requestBuckets.set(address, { count: 1, resetAt: now + rateLimitWindowMs });
    return { allowed: true, remaining: rateLimitMaximum - 1, resetAt: now + rateLimitWindowMs };
  }
  current.count += 1;
  requestBuckets.set(address, current);
  return {
    allowed: current.count <= rateLimitMaximum,
    remaining: Math.max(0, rateLimitMaximum - current.count),
    resetAt: current.resetAt
  };
}

/** @param {unknown} body */
function parseBody(body) {
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }
  return body && typeof body === "object" ? body : null;
}

/** @param {unknown} value */
function asTrimmedString(value) {
  return typeof value === "string" ? value.trim() : "";
}

/** @param {unknown} body */
function validatePayload(body) {
  const parsed = parseBody(body);
  if (!parsed || Array.isArray(parsed)) {
    return { ok: false, message: "Invalid request body." };
  }

  const record = /** @type {Record<string, unknown>} */ (parsed);
  const payload = {
    name: asTrimmedString(record.name),
    email: asTrimmedString(record.email),
    subject: asTrimmedString(record.subject),
    message: asTrimmedString(record.message),
    website: asTrimmedString(record.website)
  };
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (payload.website) return { ok: true, spam: true, payload };
  if (payload.name.length < 2 || payload.name.length > 80) {
    return { ok: false, message: "Name must be between 2 and 80 characters." };
  }
  if (payload.email.length > 254 || !emailPattern.test(payload.email)) {
    return { ok: false, message: "Enter a valid email address." };
  }
  if (payload.subject.length > 120) {
    return { ok: false, message: "Subject must be 120 characters or fewer." };
  }
  if (payload.message.length < 10 || payload.message.length > 3000) {
    return { ok: false, message: "Message must be between 10 and 3,000 characters." };
  }
  return { ok: true, spam: false, payload };
}

/** @param {ContactRequest} request @param {ContactResponse} response */
export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({
      code: "METHOD_NOT_ALLOWED",
      message: "Only POST requests are accepted."
    });
    return;
  }

  const contentLength = Number(request.headers["content-length"] || 0);
  if (Number.isFinite(contentLength) && contentLength > 16_384) {
    response.status(413).json({
      code: "PAYLOAD_TOO_LARGE",
      message: "The message is too large."
    });
    return;
  }

  const validation = validatePayload(request.body);
  if (!validation.ok) {
    response.status(422).json({
      code: "VALIDATION_ERROR",
      message: validation.message
    });
    return;
  }

  if (validation.spam) {
    response.status(200).json({ ok: true });
    return;
  }

  const rateLimit = consumeRateLimit(getClientAddress(request));
  response.setHeader("X-RateLimit-Limit", rateLimitMaximum);
  response.setHeader("X-RateLimit-Remaining", rateLimit.remaining);
  response.setHeader("X-RateLimit-Reset", Math.ceil(rateLimit.resetAt / 1000));
  if (!rateLimit.allowed) {
    response.setHeader(
      "Retry-After",
      Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))
    );
    response.status(429).json({
      code: "RATE_LIMITED",
      message: "Too many messages were sent. Please try again later."
    });
    return;
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const destination = process.env.CONTACT_TO_EMAIL;
  const sender = process.env.CONTACT_FROM_EMAIL;
  if (!resendApiKey || !destination || !sender) {
    response.status(503).json({
      code: "DELIVERY_UNAVAILABLE",
      message: "Message delivery is temporarily unavailable."
    });
    return;
  }

  const payload = validation.payload;
  if (!payload) {
    response.status(500).json({
      code: "INTERNAL_ERROR",
      message: "The message could not be processed."
    });
    return;
  }
  const subject = payload.subject || `Portfolio message from ${payload.name}`;
  const messageText = [
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Subject: ${subject}`,
    "",
    payload.message
  ].join("\n");

  try {
    const deliveryResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: sender,
        to: [destination],
        reply_to: payload.email,
        subject,
        text: messageText
      }),
      signal: AbortSignal.timeout(8_000)
    });

    if (!deliveryResponse.ok) {
      console.error("Contact delivery provider returned", deliveryResponse.status);
      response.status(502).json({
        code: "DELIVERY_FAILED",
        message: "The message could not be delivered."
      });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Message delivered."
    });
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error("Contact delivery failed", errorName);
    response.status(502).json({
      code: "DELIVERY_FAILED",
      message: "The message could not be delivered."
    });
  }
}

export function resetContactRateLimitsForTests() {
  requestBuckets.clear();
}
