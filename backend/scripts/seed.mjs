#!/usr/bin/env node
/**
 * Insere planos iniciais se a tabela plans estiver vazia. Roda automaticamente no startup do container.
 */
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[seed] DATABASE_URL não definida. Pulando seed.");
  process.exit(0);
}

const client = new pg.Client({ connectionString });

try {
  await client.connect();
  const count = await client.query("SELECT COUNT(*)::int AS n FROM plans");
  if (count.rows[0].n > 0) {
    console.log("[seed] Planos já existem. Nada a fazer.");
    process.exit(0);
  }

  await client.query(`
    INSERT INTO plans (name, description, price_monthly, max_properties, max_contacts, max_dispatches_per_month, max_agents, max_users, is_active)
    VALUES
      ('Corretor', 'Para corretores autônomos', 9900, 50, 500, 1000, 1, 1, true),
      ('Imobiliária', 'Para imobiliárias', 29900, 500, 5000, 5000, 3, 10, true)
  `);
  console.log("[seed] 2 planos inseridos.");
} catch (err) {
  console.error("[seed] Erro:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
