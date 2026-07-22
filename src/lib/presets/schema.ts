import { z } from "zod";

export const operationValues = [
  "rotate",
  "crop",
  "resize",
  "compress",
  "face-detect",
  "background-remove",
  "background-replace",
  "blur-fill",
  "metadata-strip",
  "favicon-package",
  "retouch",
  "generative-fill",
] as const;

export const imageOperationSchema = z.enum(operationValues);
export type ImageOperation = z.infer<typeof imageOperationSchema>;

const outputFormatSchema = z.enum(["jpeg", "png", "webp", "ico", "zip"]);

export const imagePresetSchema = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  category: z.enum(["official", "id-photo", "social", "web", "privacy"]),
  title: z.string().min(1),
  shortDescription: z.string().min(1),
  searchTerms: z.array(z.string()).min(1),
  sourceKind: z.enum(["official", "convention"]),
  output: z.object({
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    dpi: z.number().int().positive().optional(),
    formats: z.array(outputFormatSchema).min(1),
    maxBytes: z.number().int().positive().optional(),
    physicalLabel: z.string().optional(),
  }),
  input: z.object({
    formats: z.array(z.enum(["jpeg", "png", "webp"])).min(1),
    maxBytes: z.number().int().positive(),
    maxPixels: z.number().int().positive(),
  }),
  source: z.object({
    authority: z.string().min(1),
    title: z.string().min(1),
    url: z.url(),
    lastVerifiedAt: z.iso.date(),
  }).optional(),
  allowedOperations: z.array(imageOperationSchema),
  forbiddenOperations: z.array(imageOperationSchema),
  compliance: z.object({
    approvalGuaranteed: z.literal(false),
    disclaimer: z.string().min(1),
  }),
  variants: z.array(z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    description: z.string().min(1),
  })).optional(),
  checks: z.array(z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    automated: z.boolean(),
    limitation: z.string().optional(),
  })).optional(),
  faqs: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })).min(2),
  limitations: z.array(z.string()).min(1),
}).superRefine((preset, context) => {
  if ((preset.output.width === undefined) !== (preset.output.height === undefined)) {
    context.addIssue({ code: "custom", path: ["output"], message: "width와 height는 함께 설정해야 합니다." });
  }
  const conflicts = preset.allowedOperations.filter((operation) => preset.forbiddenOperations.includes(operation));
  if (conflicts.length > 0) {
    context.addIssue({ code: "custom", path: ["allowedOperations"], message: `허용/금지 작업 충돌: ${conflicts.join(", ")}` });
  }
  if (preset.sourceKind === "official" && !preset.source) {
    context.addIssue({ code: "custom", path: ["source"], message: "공식 프리셋에는 출처와 확인일이 필요합니다." });
  }
  if (preset.id === "passport-photo") {
    const forbidden = ["background-remove", "background-replace", "retouch", "generative-fill"] satisfies ImageOperation[];
    const unsafe = forbidden.filter((operation) => preset.allowedOperations.includes(operation));
    if (unsafe.length > 0) {
      context.addIssue({ code: "custom", path: ["allowedOperations"], message: `여권사진 금지 작업: ${unsafe.join(", ")}` });
    }
  }
});

export type ImagePreset = z.infer<typeof imagePresetSchema>;

export function validatePresetRegistry(input: unknown): ImagePreset[] {
  const presets = z.array(imagePresetSchema).parse(input);
  const ids = new Set<string>();
  const slugs = new Set<string>();
  for (const preset of presets) {
    if (ids.has(preset.id)) throw new Error(`중복 preset id: ${preset.id}`);
    if (slugs.has(preset.slug)) throw new Error(`중복 preset slug: ${preset.slug}`);
    ids.add(preset.id);
    slugs.add(preset.slug);
  }
  return presets;
}
