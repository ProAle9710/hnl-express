import { readFileSync } from "node:fs";

export function loadEnv() {
  const envFile = readFileSync(new URL("../.env", import.meta.url), "utf8");
  for (const line of envFile.split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const index = line.indexOf("=");
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value.replaceAll("\\n", "\n");
  }
}
