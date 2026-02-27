#!/usr/bin/env node
/**
 * Executa schema.sql no PostgreSQL. Roda automaticamente no startup do container.
 * Idempotente: CREATE IF NOT EXISTS e DO $$ já tratam reexecução.
 */
import pg from "pg";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[migrate] DATABASE_URL não definida. Pulando migração.");
  process.exit(0);
}

const sqlPath = join(__dirname, "schema.sql");
let sql;
try {
  sql = readFileSync(sqlPath, "utf8");
} catch (err) {
  console.error("[migrate] schema.sql não encontrado:", err.message);
  process.exit(1);
}

// Remove comentários de linha e divide em blocos (respeitando DO $$ ... $$)
const lines = sql.split("\n");
const blocks = [];
let current = [];
let inDoBlock = false;

for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith("--") || trimmed === "") continue;

  if (trimmed.startsWith("DO $$")) {
    inDoBlock = true;
    current = [line];
    continue;
  }
  if (inDoBlock) {
    current.push(line);
    if (trimmed.startsWith("END $$")) {
      blocks.push(current.join("\n").trim());
      current = [];
      inDoBlock = false;
    }
    continue;
  }

  if (trimmed.endsWith(";")) {
    current.push(line);
    const stmt = current.join("\n").trim();
    if (stmt) blocks.push(stmt);
    current = [];
  } else {
    current.push(line);
  }
}
if (current.length > 0) {
  const stmt = current.join("\n").trim();
  if (stmt) blocks.push(stmt);
}

const client = new pg.Client({ connectionString });

try {
  await client.connect();
  for (const statement of blocks) {
    if (!statement) continue;
    try {
      await client.query(statement);
    } catch (err) {
      if (err.code === "42710" || err.message?.includes("already exists")) {
        // Constraint/object already exists - ok em reexecução
        continue;
      }
      console.error("[migrate] Erro em statement:", err.message);
      throw err;
    }
  }
  console.log("[migrate] Schema aplicado.");
} finally {
  await client.end();
}
