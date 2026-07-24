import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const outputDirectory = path.resolve(process.cwd(), "out");
const cnamePath = path.join(outputDirectory, "CNAME");
const adsPath = path.join(outputDirectory, "ads.txt");

function selectedValue(publicKey, fallbackKey) {
  return process.env[publicKey]?.trim()
    || process.env[fallbackKey]?.trim()
    || "";
}

const domain = selectedValue("NEXT_PUBLIC_CUSTOM_DOMAIN", "CUSTOM_DOMAIN").toLowerCase();
const client = selectedValue("NEXT_PUBLIC_ADSENSE_CLIENT", "ADSENSE_CLIENT");

await mkdir(outputDirectory, { recursive: true });

if (domain) await writeFile(cnamePath, `${domain}\n`, "utf8");
else await rm(cnamePath, { force: true });

const canWriteAds = Boolean(domain)
  && /^ca-pub-\d{16}$/u.test(client);

if (canWriteAds) await writeFile(adsPath, `google.com, ${client.slice(3)}, DIRECT, f08c47fec0942fa0\n`, "utf8");
else await rm(adsPath, { force: true });
