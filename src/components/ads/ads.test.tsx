import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AdSenseConfig } from "@/config/adsense";
import { AdSenseScript } from "./AdSenseScript";
import { AdSlot } from "./AdSlot";

const disabled: AdSenseConfig = { requested: false, enabled: false, ready: false };
const incomplete: AdSenseConfig = {
  requested: true,
  enabled: true,
  client: "ca-pub-1234567890123456",
  ready: false,
};
const complete: AdSenseConfig = {
  requested: true,
  enabled: true,
  client: "ca-pub-1234567890123456",
  contentSlot: "1234567890",
  ready: true,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AdSense components", () => {
  it("renders zero DOM when ads are disabled", async () => {
    const script = render(<AdSenseScript config={disabled} />);
    const slot = render(AdSlot({ config: disabled, placement: "home-content-break" }));

    expect(script.container).toBeEmptyDOMElement();
    expect(slot.container).toBeEmptyDOMElement();
  });

  it("still renders zero DOM for an incomplete enabled configuration", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const script = render(<AdSenseScript config={incomplete} />);
    const slot = render(AdSlot({ config: incomplete, placement: "guide-content-break" }));

    expect(script.container).toBeEmptyDOMElement();
    expect(slot.container).toBeEmptyDOMElement();
    expect(warning).toHaveBeenCalled();
  });

  it("renders one script and one slot only for a complete configuration", async () => {
    render(<AdSenseScript config={complete} />);
    const slot = render(AdSlot({ config: complete, placement: "tool-explainer-end" }));

    expect(document.querySelectorAll("script[data-pixelfit-adsense='script']")).toHaveLength(1);
    await waitFor(() => expect(slot.container.querySelectorAll("ins.adsbygoogle")).toHaveLength(1));
    expect(slot.container.querySelectorAll("script[data-pixelfit-adsense='slot-init']")).toHaveLength(1);
    expect(slot.getByLabelText("광고")).toHaveAttribute("data-ad-placement", "tool-explainer-end");
  });
});
