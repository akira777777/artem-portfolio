import test from "node:test";
import assert from "node:assert/strict";
import handler, { resetContactRateLimitsForTests } from "../../api/contact.js";

function createResponse() {
  return {
    statusCode: 200,
    headers: new Map(),
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
    },
    setHeader(name, value) {
      this.headers.set(name.toLowerCase(), value);
    }
  };
}

function createRequest(overrides = {}) {
  return {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.10"
    },
    body: {
      name: "Alex Novak",
      email: "alex@example.com",
      subject: "Junior frontend role",
      message: "Hello Artem, I would like to discuss a frontend role.",
      website: ""
    },
    socket: { remoteAddress: "203.0.113.10" },
    ...overrides
  };
}

test.beforeEach(() => {
  resetContactRateLimitsForTests();
  delete process.env.RESEND_API_KEY;
  delete process.env.CONTACT_TO_EMAIL;
  delete process.env.CONTACT_FROM_EMAIL;
});

test("rejects methods other than POST", async () => {
  const response = createResponse();
  await handler(createRequest({ method: "GET" }), response);
  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.get("allow"), "POST");
});

test("rejects whitespace-only and malformed fields", async () => {
  const response = createResponse();
  await handler(
    createRequest({
      body: {
        name: " ",
        email: "not-an-email",
        subject: "",
        message: " ",
        website: ""
      }
    }),
    response
  );
  assert.equal(response.statusCode, 422);
  assert.deepEqual(response.body, {
    code: "VALIDATION_ERROR",
    message: "Name must be between 2 and 80 characters."
  });
});

test("silently accepts the honeypot without contacting the delivery provider", async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return new Response(null, { status: 200 });
  };

  try {
    const response = createResponse();
    await handler(
      createRequest({ body: { name: "", email: "", subject: "", message: "", website: "bot" } }),
      response
    );
    assert.equal(response.statusCode, 200);
    assert.equal(fetchCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("reports unavailable delivery instead of returning fake success", async () => {
  const response = createResponse();
  await handler(createRequest(), response);
  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.body, {
    code: "DELIVERY_UNAVAILABLE",
    message: "Message delivery is temporarily unavailable."
  });
});

test("rate limits repeated submissions from the same address", async () => {
  let response = createResponse();
  for (let index = 0; index < 6; index += 1) {
    response = createResponse();
    await handler(createRequest(), response);
  }
  assert.equal(response.statusCode, 429);
  assert.equal(response.body.code, "RATE_LIMITED");
  assert.equal(response.headers.get("x-ratelimit-remaining"), 0);
});

test("delivers validated plain text through the configured provider", async () => {
  process.env.RESEND_API_KEY = "test_key";
  process.env.CONTACT_TO_EMAIL = "artem@example.com";
  process.env.CONTACT_FROM_EMAIL = "Portfolio <portfolio@example.com>";

  const originalFetch = globalThis.fetch;
  let requestBody = "";
  globalThis.fetch = async (_url, init) => {
    requestBody = String(init?.body || "");
    return new Response(JSON.stringify({ id: "email_123" }), { status: 200 });
  };

  try {
    const response = createResponse();
    await handler(createRequest(), response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.ok, true);
    const providerPayload = JSON.parse(requestBody);
    assert.equal(providerPayload.reply_to, "alex@example.com");
    assert.match(providerPayload.text, /Hello Artem/);
    assert.equal("html" in providerPayload, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
