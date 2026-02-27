#!/usr/bin/env node
/**
 * Insere planos iniciais e (se não houver usuários) um tenant + usuário admin. Roda no startup do container.
 */
import pg from "pg";
import bcrypt from "bcrypt";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[seed] DATABASE_URL não definida. Pulando seed.");
  process.exit(0);
}

const client = new pg.Client({ connectionString });

try {
  await client.connect();

  const plansCount = await client.query("SELECT COUNT(*)::int AS n FROM plans");
  if (plansCount.rows[0].n === 0) {
    await client.query(`
      INSERT INTO plans (name, description, price_monthly, max_properties, max_contacts, max_dispatches_per_month, max_agents, max_users, is_active)
      VALUES
        ('Corretor', 'Para corretores autônomos', 9900, 50, 500, 1000, 1, 1, true),
        ('Imobiliária', 'Para imobiliárias', 29900, 500, 5000, 5000, 3, 10, true)
    `);
    console.log("[seed] 2 planos inseridos.");
  } else {
    console.log("[seed] Planos já existem.");
  }

  const usersCount = await client.query("SELECT COUNT(*)::int AS n FROM users");
  if (usersCount.rows[0].n === 0) {
    const planId = 1;
    const tenantRes = await client.query(
      `INSERT INTO tenants (plan_id, company_name, email, status, is_activated)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [planId, "Demo Imobiliária", "admin@demo.com", "active", true]
    );
    const tenantId = tenantRes.rows[0].id;
    const passwordHash = await bcrypt.hash("admin123", 10);
    await client.query(
      `INSERT INTO users (tenant_id, email, name, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)`,
      [tenantId, "admin@demo.com", "Admin Demo", passwordHash, "admin"]
    );
    await client.query(
      `INSERT INTO pipeline_stages (tenant_id, name, slug, sort_order)
       VALUES ($1, 'Lead', 'lead', 0), ($1, 'Qualificado', 'qualificado', 1), ($1, 'Visita', 'visita', 2), ($1, 'Proposta', 'proposta', 3), ($1, 'Fechado', 'fechado', 4)`,
      [tenantId]
    );
    console.log("[seed] Tenant, admin e etapas do pipeline criados. Login: admin@demo.com / admin123");
  } else {
    console.log("[seed] Usuários já existem.");
  }
} catch (err) {
  console.error("[seed] Erro:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
