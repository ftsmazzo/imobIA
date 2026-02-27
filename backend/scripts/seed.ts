import "dotenv/config";
import { db } from "../src/db/index.js";
import { plans } from "../src/db/schema.js";

async function seed() {
  const existing = await db.select().from(plans).limit(1);
  if (existing.length > 0) {
    console.log("Planos já existem. Nada a fazer.");
    process.exit(0);
  }

  await db.insert(plans).values([
    {
      name: "Corretor",
      description: "Para corretores autônomos",
      priceMonthly: 9900,
      maxProperties: 50,
      maxContacts: 500,
      maxDispatchesPerMonth: 1000,
      maxAgents: 1,
      maxUsers: 1,
      isActive: true,
    },
    {
      name: "Imobiliária",
      description: "Para imobiliárias",
      priceMonthly: 29900,
      maxProperties: 500,
      maxContacts: 5000,
      maxDispatchesPerMonth: 5000,
      maxAgents: 3,
      maxUsers: 10,
      isActive: true,
    },
  ]);

  console.log("Seed concluído: 2 planos inseridos.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
