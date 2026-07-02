import fs from "fs";
import path from "path";

const esARPath = path.join(process.cwd(), "messages", "es-AR.json");
const enUSPath = path.join(process.cwd(), "messages", "en-US.json");

function getKeys(obj: any, prefix = ""): string[] {
  return Object.keys(obj).reduce((res: string[], el) => {
    if (Array.isArray(obj[el])) {
      return res;
    } else if (typeof obj[el] === "object" && obj[el] !== null) {
      return [...res, ...getKeys(obj[el], prefix + el + ".")];
    }
    return [...res, prefix + el];
  }, []);
}

function checkKeys() {
  const esAR = JSON.parse(fs.readFileSync(esARPath, "utf-8"));
  const enUS = JSON.parse(fs.readFileSync(enUSPath, "utf-8"));

  const esKeys = getKeys(esAR);
  const enKeys = getKeys(enUS);

  const missingInEn = esKeys.filter((key) => !enKeys.includes(key));
  const missingInEs = enKeys.filter((key) => !esKeys.includes(key));

  if (missingInEn.length > 0) {
    console.error("❌ Missing keys in en-US.json:");
    missingInEn.forEach((k) => console.error(`  - ${k}`));
  }

  if (missingInEs.length > 0) {
    console.error("❌ Missing keys in es-AR.json:");
    missingInEs.forEach((k) => console.error(`  - ${k}`));
  }

  if (missingInEn.length === 0 && missingInEs.length === 0) {
    console.log("✅ All i18n keys match perfectly between es-AR and en-US.");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

checkKeys();
