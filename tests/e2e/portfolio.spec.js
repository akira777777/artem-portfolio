import { test, expect } from "@playwright/test";

test("home page loads with meaningful content and no critical console errors", async ({ page }) => {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");
  await expect(page).toHaveTitle(/Artem Mikhailov/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("artem");
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.locator(".project-card")).toHaveCount(5);
  expect(errors).toEqual([]);
});

test("navigation reaches sections and browser Back restores the previous anchor", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /^about/ }).click();
  await expect(page).toHaveURL(/#about$/);
  await page.getByRole("link", { name: /^projects/ }).click();
  await expect(page).toHaveURL(/#projects$/);
  await page.goBack();
  await expect(page).toHaveURL(/#about$/);
});

test("project search, combined filters, empty state and reset stay consistent", async ({ page }) => {
  await page.goto("/#projects");
  const search = page.getByRole("searchbox", { name: "Search projects" });

  await search.fill("  SECRETTRAVEL  ");
  await expect(page.locator(".project-card:visible")).toHaveCount(1);
  await expect(page.getByRole("status", { name: "" }).filter({ hasText: "Showing 1 of 5 projects" })).toBeVisible();

  await search.fill("");
  await page
    .getByRole("group", { name: "Filter projects by technology" })
    .getByRole("button", { name: "TypeScript" })
    .click();
  await search.fill("dental");
  await expect(page.locator(".project-card:visible")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Vakalova Dental" })).toBeVisible();

  await search.fill("project-that-does-not-exist");
  await expect(page.getByText("No projects match the current search and filter.")).toBeVisible();
  await expect(page.locator("#projectsGrid")).toBeHidden();

  await page.getByRole("button", { name: "reset search & filters" }).click();
  await expect(page.locator(".project-card:visible")).toHaveCount(5);
  await expect(search).toHaveValue("");
  await expect(page.getByRole("button", { name: /all/ })).toHaveAttribute("aria-pressed", "true");
});

test("project dialog is populated, closes with Escape and restores focus", async ({ page }) => {
  await page.goto("/#projects");
  const trigger = page.getByRole("button", {
    name: "Open Barbershop Iron and Steel case study"
  });
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "Barbershop Iron & Steel" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Public demo", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Challenge" })).toBeVisible();
  await expect(dialog.getByRole("link", { name: /Open Barbershop.*live demo/ })).toHaveAttribute(
    "href",
    "https://barber-am.vercel.app/"
  );
  await expect(page.getByRole("button", { name: "Close modal" })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("CV dialog opens, exposes working actions and restores focus", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "resume / cv" });
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "Curriculum Vitae" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Selected Work" })).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Request Interview" })).toHaveAttribute(
    "href",
    /mailto:artemmikhailov20031001@gmail.com/
  );

  await page.getByRole("button", { name: "Close CV modal" }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("CLI supports quick commands, history and safe unknown-command rendering", async ({ page }) => {
  await page.goto("/#skills");
  const input = page.getByRole("textbox", { name: "Terminal command" });

  await page.getByRole("button", { name: "help", exact: true }).click();
  await expect(input).toBeFocused();
  await expect(page.getByRole("log")).toContainText("Available commands");

  await input.fill("skills");
  await input.press("Enter");
  await input.fill("projects");
  await input.press("Enter");
  await input.press("ArrowUp");
  await expect(input).toHaveValue("projects");
  await input.press("ArrowUp");
  await expect(input).toHaveValue("skills");
  await input.press("ArrowDown");
  await expect(input).toHaveValue("projects");

  await input.fill("<img src=x onerror=window.__xss=1>");
  await input.press("Enter");
  await expect(page.getByRole("log")).toContainText("<img src=x");
  await expect(page.getByRole("log").locator("img")).toHaveCount(0);
  expect(await page.evaluate(() => window.__xss)).toBeUndefined();
});

test("contact form validates, prevents fake success and handles real API responses", async ({ page }) => {
  await page.goto("/#contact");
  await page.getByRole("button", { name: "Send Message" }).click();
  await expect(page.getByLabel("Your Name *")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Your Email *")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Message *")).toHaveAttribute("aria-invalid", "true");

  await page.route("**/api/contact", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "Message delivery is temporarily unavailable." })
    });
  });
  await page.getByLabel("Your Name *").fill("Alex Novak");
  await page.getByLabel("Your Email *").fill("alex@example.com");
  await page.getByLabel("Message *").fill("Hello Artem, this is a valid test message.");
  await page.getByRole("button", { name: "Send Message" }).click();
  await expect(page.getByRole("status").filter({ hasText: /temporarily unavailable/ })).toBeVisible();
  await expect(page.getByLabel("Message *")).toHaveValue(/valid test message/);
  await expect(page.getByText(/Message delivered\. Thank you/)).toHaveCount(0);

  await page.unroute("**/api/contact");
  await page.route("**/api/contact", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, message: "Message delivered." })
    });
  });
  await page.getByRole("button", { name: "Send Message" }).click();
  await expect(page.getByRole("status").filter({ hasText: /Message delivered/ })).toBeVisible();
  await expect(page.getByLabel("Your Name *")).toHaveValue("");
});

test("quick topics prepare useful, keyboard-focusable message text", async ({ page }) => {
  await page.goto("/#contact");
  await page.getByRole("button", { name: "Junior Role" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Subject")).toHaveValue("Junior Developer Role / Internship");
  await expect(page.getByLabel("Message *")).toHaveValue(/discuss a junior frontend opportunity/);
  await expect(page.getByLabel("Message *")).toBeFocused();
});

test("all external links are validly formed and protected when opening a new tab", async ({ page }) => {
  await page.goto("/");
  const links = await page.locator('a[target="_blank"]').evaluateAll((elements) =>
    elements.map((element) => ({
      href: element.getAttribute("href"),
      rel: element.getAttribute("rel")
    }))
  );
  expect(links.length).toBeGreaterThan(5);
  for (const link of links) {
    expect(link.href).toMatch(/^https:\/\//);
    expect(link.rel?.split(/\s+/)).toEqual(expect.arrayContaining(["noopener", "noreferrer"]));
  }
});

test("layout has no horizontal overflow at required responsive widths", async ({ page }) => {
  const widths = [320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920];
  for (const width of widths) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      page: document.documentElement.scrollWidth
    }));
    expect(dimensions.page, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(
      dimensions.viewport
    );
  }
});

test("primary content remains readable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".project-card")).toHaveCount(5);
  await expect(page.getByRole("heading", { name: "Barbershop Iron & Steel" })).toBeVisible();
  await expect(page.getByRole("form")).toHaveCount(0);
  await expect(page.locator("#contactForm")).toHaveAttribute("action", "/api/contact");
  await context.close();
});
