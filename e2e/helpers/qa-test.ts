import { expect, test as base } from "@playwright/test";

type AutomaticQaFixtures = {
  qaGuard: {
    expectNextConsoleError: (pattern: RegExp) => void;
    protectOutgoingValues: (...values: string[]) => void;
  };
};

export const test = base.extend<AutomaticQaFixtures>({
  qaGuard: [async ({ page, baseURL }, use) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    const pageErrors: string[] = [];
    const expectedConsoleErrors: RegExp[] = [];
    const writes: string[] = [];
    const externalRequests: string[] = [];
    const leakedRequests: string[] = [];
    const leakedConsoleValues: string[] = [];
    const protectedValues = new Set(["QA Fixture Maker", "PixelFit E2E", "Synthetic test image"]);
    const allowedOrigin = baseURL ? new URL(baseURL).origin : null;

    page.on("console", (message) => {
      const searchableMessage = message.text().toLocaleLowerCase("en-US");
      for (const value of protectedValues) {
        if (searchableMessage.includes(value.toLocaleLowerCase("en-US"))) {
          leakedConsoleValues.push(`${message.type()} [${value}]`);
        }
      }
      if (message.type() === "warning") {
        consoleWarnings.push(message.text());
        return;
      }
      if (message.type() !== "error") return;
      const expectedIndex = expectedConsoleErrors.findIndex((pattern) => {
        pattern.lastIndex = 0;
        return pattern.test(message.text());
      });
      if (expectedIndex >= 0) expectedConsoleErrors.splice(expectedIndex, 1);
      else consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => {
      pageErrors.push(error.stack ?? error.message);
    });
    page.on("request", (request) => {
      const method = request.method();
      const url = request.url();
      const summary = `${method} ${url}`;
      if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) writes.push(summary);

      try {
        const parsed = new URL(url);
        if ((parsed.protocol === "http:" || parsed.protocol === "https:") && allowedOrigin && parsed.origin !== allowedOrigin) {
          externalRequests.push(summary);
        }
      } catch {
        // blob: and data: resources are browser-local and do not have an HTTP origin.
      }

      let decodedUrl = url;
      try {
        decodedUrl = decodeURIComponent(url);
      } catch {
        // Keep the raw URL when percent-encoding is malformed.
      }
      const searchableRequest = `${decodedUrl}\n${request.postData() ?? ""}`.toLocaleLowerCase("en-US");
      for (const value of protectedValues) {
        if (searchableRequest.includes(value.toLocaleLowerCase("en-US"))) leakedRequests.push(`${summary} [${value}]`);
      }
    });

    await use({
      expectNextConsoleError: (pattern) => expectedConsoleErrors.push(pattern),
      protectOutgoingValues: (...values) => {
        for (const value of values) if (value.trim()) protectedValues.add(value);
      },
    });

    expect(writes, "브라우저 처리 중 외부 쓰기 요청이 없어야 합니다.").toEqual([]);
    expect(externalRequests, "브라우저 처리 중 외부 호스트 요청이 없어야 합니다.").toEqual([]);
    expect(leakedRequests, "파일명이나 테스트 개인정보 표식이 요청으로 유출되지 않아야 합니다.").toEqual([]);
    expect(leakedConsoleValues, "파일명이나 테스트 개인정보 표식이 console로 유출되지 않아야 합니다.").toEqual([]);
    expect(consoleWarnings, "예상하지 않은 console.warning이 없어야 합니다.").toEqual([]);
    expect(consoleErrors, "예상하지 않은 console.error가 없어야 합니다.").toEqual([]);
    expect(pageErrors, "예상하지 않은 pageerror가 없어야 합니다.").toEqual([]);
    expect(expectedConsoleErrors, "명시한 console.error가 실제로 발생해야 합니다.").toEqual([]);
  }, { auto: true }],
});

export { expect };
