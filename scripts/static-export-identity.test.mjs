import { describe, expect, it } from "vitest";
import {
  DEFAULT_CONTACT_EMAIL as ENV_DEFAULT_CONTACT_EMAIL,
  DEFAULT_OPERATOR_NAME as ENV_DEFAULT_OPERATOR_NAME,
  parseEnvironment,
} from "../src/config/env.ts";
import {
  DEFAULT_CONTACT_EMAIL,
  DEFAULT_OPERATOR_NAME,
  resolveExpectedPublicIdentity,
} from "./static-export-identity.mjs";

describe("static export public identity", () => {
  it("keeps verifier defaults synchronized with the application environment", () => {
    expect(DEFAULT_CONTACT_EMAIL).toBe(ENV_DEFAULT_CONTACT_EMAIL);
    expect(DEFAULT_OPERATOR_NAME).toBe(ENV_DEFAULT_OPERATOR_NAME);
    expect(resolveExpectedPublicIdentity()).toEqual({
      contactEmail: ENV_DEFAULT_CONTACT_EMAIL,
      operatorName: ENV_DEFAULT_OPERATOR_NAME,
    });
  });

  it.each([
    {
      label: "fallback aliases",
      source: {
        CONTACT_EMAIL: "fallback@pixel.fit",
        OPERATOR_NAME: "Fallback Operator",
      },
    },
    {
      label: "public aliases over different fallback values",
      source: {
        NEXT_PUBLIC_CONTACT_EMAIL: "public@pixel.fit",
        CONTACT_EMAIL: "fallback@pixel.fit",
        NEXT_PUBLIC_OPERATOR_NAME: "Public Operator",
        OPERATOR_NAME: "Fallback Operator",
      },
    },
    {
      label: "trimmed public values",
      source: {
        NEXT_PUBLIC_CONTACT_EMAIL: "  trimmed@pixel.fit  ",
        NEXT_PUBLIC_OPERATOR_NAME: "  Trimmed Operator  ",
      },
    },
    {
      label: "invalid public values falling back to defaults instead of fallback aliases",
      source: {
        NEXT_PUBLIC_CONTACT_EMAIL: "not-an-email",
        CONTACT_EMAIL: "fallback@pixel.fit",
        NEXT_PUBLIC_OPERATOR_NAME: "\u0000invalid",
        OPERATOR_NAME: "Fallback Operator",
      },
    },
    {
      label: "blank public values allowing fallback aliases",
      source: {
        NEXT_PUBLIC_CONTACT_EMAIL: "   ",
        CONTACT_EMAIL: "fallback@pixel.fit",
        NEXT_PUBLIC_OPERATOR_NAME: "",
        OPERATOR_NAME: "Fallback Operator",
      },
    },
  ])("matches parseEnvironment for $label", ({ source }) => {
    const applicationIdentity = parseEnvironment(source);

    expect(resolveExpectedPublicIdentity(source)).toEqual({
      contactEmail: applicationIdentity.contactEmail,
      operatorName: applicationIdentity.operatorName,
    });
  });
});
