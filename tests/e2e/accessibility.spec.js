import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("landing page has no serious or critical axe violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  const blocking = results.violations.filter((violation) =>
    ["serious", "critical"].includes(violation.impact || "")
  );
  expect(blocking).toEqual([]);
});

test("project dialog has no serious or critical axe violations", async ({ page }) => {
  await page.goto("/#projects");
  await page
    .getByRole("button", { name: "Open Barbershop Iron and Steel case study" })
    .click();
  const results = await new AxeBuilder({ page })
    .include("#projectModal")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  const blocking = results.violations.filter((violation) =>
    ["serious", "critical"].includes(violation.impact || "")
  );
  expect(blocking).toEqual([]);
});

test("mobile navigation has no serious or critical axe violations", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  const blocking = results.violations.filter((violation) =>
    ["serious", "critical"].includes(violation.impact || "")
  );
  expect(blocking).toEqual([]);
});
