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

  const firstTenant = await client.query("SELECT id FROM tenants ORDER BY id LIMIT 1");
  if (firstTenant.rows.length > 0) {
    const tid = firstTenant.rows[0].id;
    const propsCount = await client.query("SELECT COUNT(*)::int AS n FROM properties WHERE tenant_id = $1", [tid]);
    if (propsCount.rows[0].n === 0) {
      await client.query(
        `INSERT INTO properties (tenant_id, type, title, address_street, address_number, address_neighborhood, address_city, address_state, value_sale, value_rent, status, description, bedrooms, bathrooms, parking_spaces, area_m2, code)
         VALUES
           ($1, 'apartment', 'Apartamento Centro - 2 quartos', 'Rua das Flores', '100', 'Centro', 'São Paulo', 'SP', 450000, 1800, 'available', 'Apartamento reformado, bem localizado. Varanda gourmet.', 2, 1, 1, 65, 'APT-001'),
           ($1, 'house', 'Casa com quintal - Jardins', 'Av. Brasil', '500', 'Jardins', 'São Paulo', 'SP', 1200000, null, 'available', 'Casa ampla, 3 suítes, jardim e churrasqueira.', 3, 3, 2, 180, 'CASA-002'),
           ($1, 'apartment', 'Studio para alugar - Pinheiros', 'Rua dos Pinheiros', '200', 'Pinheiros', 'São Paulo', 'SP', null, 2200, 'available', 'Studio mobiliado, próximo ao metrô.', 1, 1, 0, 35, 'APT-003'),
           ($1, 'apartment', 'Cobertura duplex - Centro', 'Rua do Comércio', '50', 'Centro', 'São Paulo', 'SP', 890000, 4500, 'available', 'Cobertura com vista, 2 vagas.', 3, 2, 2, 120, 'COB-004'),
           ($1, 'house', 'Casa térrea - até 500 mil', 'Rua das Palmeiras', '10', 'Vila Nova', 'Guarulhos', 'SP', 380000, 1500, 'available', 'Casa em condomínio fechado, 2 quartos.', 2, 2, 1, 95, 'CASA-005')`,
        [tid]
      );
      console.log("[seed] 5 imóveis de demonstração inseridos (tenant existente).");
    }
  }
} catch (err) {
  console.error("[seed] Erro:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
