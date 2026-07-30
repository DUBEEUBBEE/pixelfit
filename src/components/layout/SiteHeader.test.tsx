import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SiteHeader } from "./SiteHeader";

describe("SiteHeader", () => {
  it("keeps the desktop links and exposes the compact mobile navigation", () => {
    render(<SiteHeader />);

    const desktop = screen.getByRole("navigation", { name: "주요 메뉴" });
    expect(desktop).toHaveTextContent("도구");
    expect(desktop).toHaveTextContent("가이드");
    expect(desktop).toHaveTextContent("소개");
    expect(desktop).toHaveTextContent("문의");

    const mobile = screen.getByRole("navigation", { name: "모바일 주요 메뉴" });
    expect(mobile).toHaveTextContent("도구");
    expect(mobile).toHaveTextContent("가이드");
    expect(screen.getByRole("button", { name: "메뉴 열기" })).toHaveAttribute("aria-controls", "mobile-more-menu");
    expect(screen.getByRole("button", { name: "메뉴 열기" })).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the mobile menu with Escape, an outside pointer, and a menu link", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);

    const openButton = screen.getByRole("button", { name: "메뉴 열기" });
    await user.click(openButton);
    const closeButton = screen.getByRole("button", { name: "메뉴 닫기" });
    expect(closeButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("더 보기 메뉴")).not.toHaveAttribute("hidden");
    for (const label of ["소개", "문의", "개인정보", "이용약관", "GitHub"]) {
      expect(screen.getByLabelText("더 보기 메뉴")).toHaveTextContent(label);
    }

    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "메뉴 열기" })).toHaveFocus();
    expect(screen.getByLabelText("더 보기 메뉴")).toHaveAttribute("hidden");

    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));
    fireEvent.pointerDown(document.body);
    expect(screen.getByLabelText("더 보기 메뉴")).toHaveAttribute("hidden");

    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));
    const firstMenuLink = screen.getByLabelText("더 보기 메뉴").querySelector("a") as HTMLAnchorElement;
    firstMenuLink.addEventListener("click", (event) => event.preventDefault(), { once: true });
    await user.click(firstMenuLink);
    expect(screen.getByLabelText("더 보기 메뉴")).toHaveAttribute("hidden");
  });
});
