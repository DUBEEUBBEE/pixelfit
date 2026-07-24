import { z } from "zod";

export const DEFAULT_SITE_URL = "https://dubeeubbee.github.io/pixelfit";
export const DEFAULT_CONTACT_URL = "https://github.com/DUBEEUBBEE/pixelfit/issues";
export const DEFAULT_OPERATOR_NAME = "픽셀핏 운영자";

const environmentKeys = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_BASE_PATH",
  "BASE_PATH",
  "NEXT_PUBLIC_CUSTOM_DOMAIN",
  "CUSTOM_DOMAIN",
  "NEXT_PUBLIC_CONTACT_EMAIL",
  "CONTACT_EMAIL",
  "NEXT_PUBLIC_OPERATOR_NAME",
  "OPERATOR_NAME",
  "NEXT_PUBLIC_CONTACT_URL",
  "CONTACT_URL",
  "NEXT_PUBLIC_ADSENSE_ENABLED",
  "ADSENSE_ENABLED",
  "NEXT_PUBLIC_ADSENSE_CLIENT",
  "ADSENSE_CLIENT",
  "NEXT_PUBLIC_ADSENSE_CONTENT_SLOT",
  "ADSENSE_CONTENT_SLOT",
  "NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION",
  "GOOGLE_SITE_VERIFICATION",
  "NEXT_PUBLIC_NAVER_SITE_VERIFICATION",
  "NAVER_SITE_VERIFICATION",
] as const;

type EnvironmentKey = (typeof environmentKeys)[number];
export type EnvironmentSource = Partial<Record<EnvironmentKey, string | undefined>>;

const optionalString = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().optional(),
);

const rawEnvironmentSchema = z.object(Object.fromEntries(
  environmentKeys.map((key) => [key, optionalString]),
) as Record<EnvironmentKey, typeof optionalString>);

const httpUrlSchema = z.string().url().superRefine((value, context) => {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    context.addIssue({ code: "custom", message: "HTTP 또는 HTTPS URL이어야 합니다." });
  }
  if (url.username || url.password || url.search || url.hash) {
    context.addIssue({ code: "custom", message: "인증정보, 쿼리, 해시를 포함할 수 없습니다." });
  }
  if (url.hostname === "example" || url.hostname.endsWith(".example")) {
    context.addIssue({ code: "custom", message: "예약된 .example 도메인은 공개 설정에 사용할 수 없습니다." });
  }
});

const customDomainSchema = z.string()
  .toLowerCase()
  .regex(
    /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/,
    "프로토콜과 경로를 제외한 DNS 호스트 이름이어야 합니다.",
  )
  .refine((value) => !value.endsWith(".example"), "예약된 .example 도메인은 공개 설정에 사용할 수 없습니다.");

const emailSchema = z.string().email();
const operatorNameSchema = z.string().min(1).max(80).refine((value) => !/[\u0000-\u001F\u007F]/u.test(value));
const adsenseEnabledSchema = z.enum(["true", "false"]);
export const adsenseClientSchema = z.string().regex(/^ca-pub-\d{16}$/);
export const adsenseSlotSchema = z.string().regex(/^\d{10}$/);
const siteVerificationSchema = z.string().regex(/^[A-Za-z0-9_-]{8,256}$/);

export type EnvironmentConfig = {
  siteUrl: string;
  basePath: string;
  customDomain?: string;
  contactEmail?: string;
  contactUrl: string;
  operatorName: string;
  adsense: {
    requested: boolean;
    enabled: boolean;
    client?: string;
    contentSlot?: string;
    ready: boolean;
  };
  googleSiteVerification?: string;
  naverSiteVerification?: string;
  warnings: readonly string[];
};

export class EnvironmentConfigurationError extends Error {
  constructor(key: EnvironmentKey, details: string) {
    super(`${key} 환경변수가 올바르지 않습니다: ${details}`);
    this.name = "EnvironmentConfigurationError";
  }
}

function requiredParse<T>(key: EnvironmentKey, schema: z.ZodType<T>, value: string): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new EnvironmentConfigurationError(key, result.error.issues.map((issue) => issue.message).join(" "));
  }
  return result.data;
}

export function normalizeBasePath(value: string | undefined): string {
  if (!value || value === "/") return "";
  if (/[:?#\\]/.test(value)) {
    throw new EnvironmentConfigurationError("NEXT_PUBLIC_BASE_PATH", "URL이 아닌 경로만 입력해야 합니다.");
  }

  const normalized = `${value.startsWith("/") ? "" : "/"}${value}`.replace(/\/+$/, "");
  const segments = normalized.split("/").filter(Boolean);
  if (segments.some((segment) => segment === "." || segment === "..") || !/^\/[A-Za-z0-9._~!$&'()*+,;=@%/-]+$/.test(normalized)) {
    throw new EnvironmentConfigurationError("NEXT_PUBLIC_BASE_PATH", "안전한 절대 경로 형식이어야 합니다.");
  }
  return normalized;
}

function normalizeUrl(value: string): string {
  const url = new URL(value);
  const pathname = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, "");
  return `${url.origin}${pathname}`;
}

function optionalValidatedValue<T>(
  key: EnvironmentKey,
  value: string | undefined,
  schema: z.ZodType<T>,
  warnings: string[],
): T | undefined {
  if (!value) return undefined;
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  warnings.push(`${key} 값이 유효하지 않아 사용하지 않았습니다.`);
  return undefined;
}

function preferPublicValue(
  raw: Partial<Record<EnvironmentKey, string | undefined>>,
  publicKey: EnvironmentKey,
  fallbackKey: EnvironmentKey,
  warnings: string[],
): { key: EnvironmentKey; value: string | undefined } {
  const publicValue = raw[publicKey];
  const fallbackValue = raw[fallbackKey];
  if (publicValue && fallbackValue && publicValue !== fallbackValue) {
    warnings.push(`${publicKey}와 ${fallbackKey}가 달라 공개 값을 우선했습니다.`);
  }
  return publicValue
    ? { key: publicKey, value: publicValue }
    : { key: fallbackKey, value: fallbackValue };
}

export function parseEnvironment(source: EnvironmentSource): EnvironmentConfig {
  const raw = rawEnvironmentSchema.parse(source);
  const warnings: string[] = [];

  const customDomainSetting = preferPublicValue(raw, "NEXT_PUBLIC_CUSTOM_DOMAIN", "CUSTOM_DOMAIN", warnings);
  const customDomain = customDomainSetting.value
    ? requiredParse(customDomainSetting.key, customDomainSchema, customDomainSetting.value)
    : undefined;

  const configuredBasePath = raw.NEXT_PUBLIC_BASE_PATH ?? raw.BASE_PATH;
  if (raw.NEXT_PUBLIC_BASE_PATH && raw.BASE_PATH && raw.NEXT_PUBLIC_BASE_PATH !== raw.BASE_PATH) {
    warnings.push("NEXT_PUBLIC_BASE_PATH와 BASE_PATH가 달라 NEXT_PUBLIC_BASE_PATH를 우선했습니다.");
  }

  let basePath = normalizeBasePath(configuredBasePath);
  if (customDomain && basePath) {
    warnings.push("CUSTOM_DOMAIN 빌드는 루트 경로를 사용하므로 base path를 비웠습니다.");
    basePath = "";
  }

  const configuredSiteUrl = raw.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;
  const parsedSiteUrl = normalizeUrl(requiredParse("NEXT_PUBLIC_SITE_URL", httpUrlSchema, configuredSiteUrl));
  const customDomainUrl = customDomain ? `https://${customDomain}` : undefined;
  if (customDomainUrl && parsedSiteUrl !== customDomainUrl) {
    warnings.push("CUSTOM_DOMAIN을 canonical 기준 URL로 사용했습니다.");
  }
  const siteUrl = customDomainUrl ?? parsedSiteUrl;

  const contactEmailSetting = preferPublicValue(raw, "NEXT_PUBLIC_CONTACT_EMAIL", "CONTACT_EMAIL", warnings);
  const contactUrlSetting = preferPublicValue(raw, "NEXT_PUBLIC_CONTACT_URL", "CONTACT_URL", warnings);
  const operatorNameSetting = preferPublicValue(raw, "NEXT_PUBLIC_OPERATOR_NAME", "OPERATOR_NAME", warnings);
  const contactEmail = optionalValidatedValue(contactEmailSetting.key, contactEmailSetting.value, emailSchema, warnings);
  const contactUrl = optionalValidatedValue(contactUrlSetting.key, contactUrlSetting.value, httpUrlSchema, warnings);
  const operatorName = optionalValidatedValue(operatorNameSetting.key, operatorNameSetting.value, operatorNameSchema, warnings)
    ?? DEFAULT_OPERATOR_NAME;

  const adsenseEnabledSetting = preferPublicValue(raw, "NEXT_PUBLIC_ADSENSE_ENABLED", "ADSENSE_ENABLED", warnings);
  const adsenseClientSetting = preferPublicValue(raw, "NEXT_PUBLIC_ADSENSE_CLIENT", "ADSENSE_CLIENT", warnings);
  const adsenseSlotSetting = preferPublicValue(raw, "NEXT_PUBLIC_ADSENSE_CONTENT_SLOT", "ADSENSE_CONTENT_SLOT", warnings);
  const enabledResult = adsenseEnabledSetting.value
    ? adsenseEnabledSchema.safeParse(adsenseEnabledSetting.value.toLowerCase())
    : undefined;
  if (enabledResult && !enabledResult.success) {
    warnings.push(`${adsenseEnabledSetting.key}는 true 또는 false여야 하므로 광고를 비활성화했습니다.`);
  }
  const adsenseEnabled = enabledResult?.success ? enabledResult.data === "true" : false;
  const adsenseRequested = adsenseEnabled || Boolean(adsenseEnabledSetting.value && adsenseEnabledSetting.value.toLowerCase() !== "false");
  const adsenseClient = optionalValidatedValue(adsenseClientSetting.key, adsenseClientSetting.value, adsenseClientSchema, warnings);
  const adsenseContentSlot = optionalValidatedValue(adsenseSlotSetting.key, adsenseSlotSetting.value, adsenseSlotSchema, warnings);
  const adsenseReady = adsenseEnabled && Boolean(adsenseClient && adsenseContentSlot);
  if (adsenseEnabled && !adsenseReady) {
    warnings.push("AdSense가 요청됐지만 유효한 client와 content slot이 모두 없어 광고를 렌더링하지 않습니다.");
  }

  const googleVerificationSetting = preferPublicValue(
    raw,
    "NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION",
    "GOOGLE_SITE_VERIFICATION",
    warnings,
  );
  const googleSiteVerification = optionalValidatedValue(
    googleVerificationSetting.key,
    googleVerificationSetting.value,
    siteVerificationSchema,
    warnings,
  );

  const naverValue = raw.NEXT_PUBLIC_NAVER_SITE_VERIFICATION ?? raw.NAVER_SITE_VERIFICATION;
  if (raw.NEXT_PUBLIC_NAVER_SITE_VERIFICATION && raw.NAVER_SITE_VERIFICATION && raw.NEXT_PUBLIC_NAVER_SITE_VERIFICATION !== raw.NAVER_SITE_VERIFICATION) {
    warnings.push("NEXT_PUBLIC_NAVER_SITE_VERIFICATION과 NAVER_SITE_VERIFICATION이 달라 공개 값을 우선했습니다.");
  }
  const naverSiteVerification = optionalValidatedValue(
    raw.NEXT_PUBLIC_NAVER_SITE_VERIFICATION ? "NEXT_PUBLIC_NAVER_SITE_VERIFICATION" : "NAVER_SITE_VERIFICATION",
    naverValue,
    siteVerificationSchema,
    warnings,
  );

  return Object.freeze({
    siteUrl,
    basePath,
    customDomain,
    contactEmail,
    contactUrl: contactUrl ? normalizeUrl(contactUrl) : DEFAULT_CONTACT_URL,
    operatorName,
    adsense: Object.freeze({
      requested: adsenseRequested,
      enabled: adsenseEnabled,
      client: adsenseClient,
      contentSlot: adsenseContentSlot,
      ready: adsenseReady,
    }),
    googleSiteVerification,
    naverSiteVerification,
    warnings: Object.freeze(warnings),
  });
}

export const env = parseEnvironment({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH,
  BASE_PATH: process.env.BASE_PATH,
  NEXT_PUBLIC_CUSTOM_DOMAIN: process.env.NEXT_PUBLIC_CUSTOM_DOMAIN,
  CUSTOM_DOMAIN: process.env.CUSTOM_DOMAIN,
  NEXT_PUBLIC_CONTACT_EMAIL: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
  CONTACT_EMAIL: process.env.CONTACT_EMAIL,
  NEXT_PUBLIC_OPERATOR_NAME: process.env.NEXT_PUBLIC_OPERATOR_NAME,
  OPERATOR_NAME: process.env.OPERATOR_NAME,
  NEXT_PUBLIC_CONTACT_URL: process.env.NEXT_PUBLIC_CONTACT_URL,
  CONTACT_URL: process.env.CONTACT_URL,
  NEXT_PUBLIC_ADSENSE_ENABLED: process.env.NEXT_PUBLIC_ADSENSE_ENABLED,
  ADSENSE_ENABLED: process.env.ADSENSE_ENABLED,
  NEXT_PUBLIC_ADSENSE_CLIENT: process.env.NEXT_PUBLIC_ADSENSE_CLIENT,
  ADSENSE_CLIENT: process.env.ADSENSE_CLIENT,
  NEXT_PUBLIC_ADSENSE_CONTENT_SLOT: process.env.NEXT_PUBLIC_ADSENSE_CONTENT_SLOT,
  ADSENSE_CONTENT_SLOT: process.env.ADSENSE_CONTENT_SLOT,
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  GOOGLE_SITE_VERIFICATION: process.env.GOOGLE_SITE_VERIFICATION,
  NEXT_PUBLIC_NAVER_SITE_VERIFICATION: process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION,
  NAVER_SITE_VERIFICATION: process.env.NAVER_SITE_VERIFICATION,
});
