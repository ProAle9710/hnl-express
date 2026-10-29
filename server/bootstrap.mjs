import { readFileSync } from "node:fs";

import { accessToken, projectId } from "./admin.mjs";

const RULES_HINT =
  "Concede al service account el rol roles/firebaserules.admin (Firebase Rules Admin).";
const INDEX_HINT =
  "Concede al service account el rol roles/datastore.indexAdmin (Cloud Datastore Index Admin).";

async function google(url, options = {}) {
  const token = await accessToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const text = await response.text();
  return { ok: response.ok, status: response.status, text };
}

function fail(status, hint, body) {
  throw new Error(`HTTP ${status}. ${hint}\n${body}`);
}

export async function publishRules() {
  const source = readFileSync(new URL("../firestore.rules", import.meta.url), "utf8").trim();
  const project = projectId();
  const releaseName = `projects/${project}/releases/cloud.firestore`;
  const current = await google(`https://firebaserules.googleapis.com/v1/${releaseName}`);
  if (current.status === 403) fail(current.status, RULES_HINT, current.text);
  if (current.ok) {
    const release = JSON.parse(current.text);
    const ruleset = await google(`https://firebaserules.googleapis.com/v1/${release.rulesetName}`);
    if (ruleset.status === 403) fail(ruleset.status, RULES_HINT, ruleset.text);
    if (ruleset.ok) {
      const payload = JSON.parse(ruleset.text);
      const live = payload.source?.files?.find((file) => file.name === "firestore.rules")?.content?.trim();
      if (live === source) {
        console.log("Reglas de Firestore ya publicadas.");
        return;
      }
    }
  } else if (current.status !== 404) {
    fail(current.status, RULES_HINT, current.text);
  }

  const created = await google(`https://firebaserules.googleapis.com/v1/projects/${project}/rulesets`, {
    method: "POST",
    body: JSON.stringify({ source: { files: [{ name: "firestore.rules", content: source }] } }),
  });
  if (!created.ok) fail(created.status, RULES_HINT, created.text);
  const rulesetName = JSON.parse(created.text).name;
  const releaseBody = JSON.stringify({ name: releaseName, rulesetName });
  const saved =
    current.status === 404
      ? await google(`https://firebaserules.googleapis.com/v1/projects/${project}/releases`, {
          method: "POST",
          body: releaseBody,
        })
      : await google(
          `https://firebaserules.googleapis.com/v1/${releaseName}?updateMask=rulesetName`,
          {
            method: "PATCH",
            body: JSON.stringify({ release: { name: releaseName, rulesetName } }),
          },
        );
  if (!saved.ok) fail(saved.status, RULES_HINT, saved.text);
  console.log("Reglas de Firestore publicadas.");
}

function sameIndex(live, wanted) {
  const fields = live.fields ?? [];
  if (fields.length !== wanted.fields.length) return false;
  return wanted.fields.every((field, index) => {
    return fields[index]?.fieldPath === field.fieldPath && fields[index]?.order === field.order;
  });
}

export async function publishIndexes() {
  const file = JSON.parse(readFileSync(new URL("../firestore.indexes.json", import.meta.url), "utf8"));
  const indexes = Array.isArray(file.indexes) ? file.indexes : [];
  const project = projectId();
  for (const index of indexes) {
    const group = index.collectionGroup;
    const url = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/collectionGroups/${group}/indexes`;
    const listed = await google(url);
    if (listed.status === 403) fail(listed.status, INDEX_HINT, listed.text);
    if (!listed.ok) fail(listed.status, INDEX_HINT, listed.text);
    const existing = JSON.parse(listed.text).indexes ?? [];
    if (existing.some((item) => sameIndex(item, index))) {
      console.log(`Índice ${group} ya existe.`);
      continue;
    }
    const created = await google(url, {
      method: "POST",
      body: JSON.stringify({ queryScope: index.queryScope, fields: index.fields }),
    });
    if (created.status === 409) {
      console.log(`Índice ${group} ya existe.`);
      continue;
    }
    if (!created.ok) fail(created.status, INDEX_HINT, created.text);
    console.log(`Índice ${group} en creación.`);
  }
}
