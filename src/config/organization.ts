import { brand, publicUrl } from "./brand";

type OrganizationStructuredDataOptions = {
  includeContext?: boolean;
};

export function buildOrganizationStructuredData(
  { includeContext = false }: OrganizationStructuredDataOptions = {},
) {
  return {
    ...(includeContext ? { "@context": "https://schema.org" } : {}),
    "@type": "Organization",
    name: brand.name,
    alternateName: brand.alternateName,
    url: publicUrl("/"),
    email: brand.contactEmail,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: brand.contactEmail,
      availableLanguage: ["Korean"],
    },
  } as const;
}
