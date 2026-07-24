import { expect, test as base } from "@playwright/test";

type AutomaticQaFixtures = {
  qaGuard: {
    expectNextConsoleError: (pattern: RegExp) => void;
  };
};

export const test = base.extend<AutomaticQaFixtures>({
  qaGuard: [async ({ page }, use) => {
    const consoleErrors: string[] = [];
    const expectedConsoleErrors: RegExp[] = [];
    const writes: string[] = [];
    page.on("console", (message) => {
      if (message.type() !== "error") return;
      const expectedIndex = expectedConsoleErrors.findIndex((pattern) => pattern.test(message.text()));
      if (expectedIndex >= 0) expectedConsoleErrors.splice(expectedIndex, 1);
      else consoleErrors.push(message.text());
    });
    page.on("request", (request) => {
      if (["POST", "PUT", "PATCH"].includes(request.method())) writes.push(`${request.method()} ${request.url()}`);
    });

    await use({
      expectNextConsoleError: (pattern) => expectedConsoleErrors.push(pattern),
    });

    expect(writes, "브라우저 처리 중 외부 쓰기 요청이 없어야 합니다.").toEqual([]);
    expect(consoleErrors, "예상하지 않은 console.error가 없어야 합니다.").toEqual([]);
    expect(expectedConsoleErrors, "명시한 console.error가 실제로 발생해야 합니다.").toEqual([]);
  }, { auto: true }],
});

export { expect };
