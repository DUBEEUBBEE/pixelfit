import { z } from "zod";

export const DEFAULT_CONTACT_EMAIL = "wodnd0823@gmail.com";
export const DEFAULT_OPERATOR_NAME = "DUBEEUBBEE";

const optionalString = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().optional(),
);

const identityEnvironmentSchema = z.object({
  NEXT_PUBLIC_CONTACT_EMAIL: optionalString,
  CONTACT_EMAIL: optionalString,
  NEXT_PUBLIC_OPERATOR_NAME: optionalString,
  OPERATOR_NAME: optionalString,
});

const emailSchema = z.string().email();
const operatorNameSchema = z.string()
  .min(1)
  .max(80)
  .refine((value) => !/[\u0000-\u001F\u007F]/u.test(value));

function preferredValue(source, publicKey, fallbackKey) {
  return source[publicKey] || source[fallbackKey];
}

function validatedValueOrDefault(value, schema, defaultValue) {
  if (!value) return defaultValue;
  const result = schema.safeParse(value);
  return result.success ? result.data : defaultValue;
}

export function resolveExpectedPublicIdentity(source = {}) {
  const environment = identityEnvironmentSchema.parse(source);
  const contactEmail = validatedValueOrDefault(
    preferredValue(environment, "NEXT_PUBLIC_CONTACT_EMAIL", "CONTACT_EMAIL"),
    emailSchema,
    DEFAULT_CONTACT_EMAIL,
  );
  const operatorName = validatedValueOrDefault(
    preferredValue(environment, "NEXT_PUBLIC_OPERATOR_NAME", "OPERATOR_NAME"),
    operatorNameSchema,
    DEFAULT_OPERATOR_NAME,
  );

  return Object.freeze({ contactEmail, operatorName });
}
