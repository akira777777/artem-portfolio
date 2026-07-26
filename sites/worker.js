// @ts-check

/**
 * @typedef {{
 *   ASSETS: { fetch: (request: Request) => Promise<Response> };
 *   RESEND_API_KEY?: string;
 *   CONTACT_TO_EMAIL?: string;
 *   CONTACT_FROM_EMAIL?: string;
 * }} SitesEnvironment
 */

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};

/** @param {unknown} body @param {number} status */
const json = (body, status) =>
  new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS
  });

/** @param {string} value */
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

/** @param {unknown} value @param {number} maxLength */
const clean = (value, maxLength) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

/** @param {Request} request @param {SitesEnvironment} env */
const handleContact = async (request, env) => {
  if (request.method !== "POST") {
    return json({ code: "METHOD_NOT_ALLOWED", message: "Only POST requests are accepted." }, 405);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 16_384) {
    return json({ code: "PAYLOAD_TOO_LARGE", message: "The message is too large." }, 413);
  }

  /** @type {unknown} */
  let rawBody;
  try {
    rawBody = await request.json();
  } catch {
    return json({ code: "VALIDATION_ERROR", message: "Invalid request body." }, 400);
  }

  if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
    return json({ code: "VALIDATION_ERROR", message: "Invalid request body." }, 400);
  }

  const body = /** @type {Record<string, unknown>} */ (rawBody);
  const name = clean(body.name, 81);
  const email = clean(body.email, 255);
  const subject = clean(body.subject, 121);
  const message = clean(body.message, 3_001);
  const website = clean(body.website, 200);

  if (website) {
    return json({ ok: true }, 200);
  }

  if (
    name.length < 2 ||
    name.length > 80 ||
    !isEmail(email) ||
    email.length > 254 ||
    subject.length > 120 ||
    message.length < 10 ||
    message.length > 3_000
  ) {
    return json(
      { code: "VALIDATION_ERROR", message: "Please check the form fields and try again." },
      422
    );
  }

  if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL) {
    return json(
      {
        code: "DELIVERY_UNAVAILABLE",
        message:
          "Message delivery is not configured yet. Please use the email link instead."
      },
      503
    );
  }

  try {
    const providerResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM_EMAIL,
        to: [env.CONTACT_TO_EMAIL],
        reply_to: email,
        subject: subject || `Portfolio message from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`
      })
    });

    if (!providerResponse.ok) {
      return json(
        {
          code: "DELIVERY_FAILED",
          message: "Message delivery is temporarily unavailable. Please use email instead."
        },
        502
      );
    }

    return json({ ok: true, message: "Message delivered." }, 200);
  } catch {
    return json(
      {
        code: "DELIVERY_FAILED",
        message: "Message delivery is temporarily unavailable. Please use email instead."
      },
      502
    );
  }
};

export default {
  /** @param {Request} request @param {SitesEnvironment} env */
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/contact") {
      return handleContact(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};
