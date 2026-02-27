import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  numeric,
  timestamp,
  jsonb,
  primaryKey,
} from "drizzle-orm/pg-core";

// -----------------------------------------------------------------------------
// Núcleo: planos, tenants, usuários, agentes
// -----------------------------------------------------------------------------

export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  stripePriceId: varchar("stripe_price_id", { length: 100 }),
  priceMonthly: integer("price_monthly").notNull().default(0),
  maxProperties: integer("max_properties"),
  maxContacts: integer("max_contacts"),
  maxDispatchesPerMonth: integer("max_dispatches_per_month"),
  maxAgents: integer("max_agents").default(1),
  maxUsers: integer("max_users").default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull().references(() => plans.id),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  subdomain: varchar("subdomain", { length: 100 }).unique(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  passwordHash: text("password_hash"),
  isActivated: boolean("is_activated").notNull().default(false),
  evolutionInstanceName: varchar("evolution_instance_name", { length: 100 }),
  evolutionApiKey: text("evolution_api_key"),
  chatwootAgentId: integer("chatwoot_agent_id"),
  chatwootAgentBotId: integer("chatwoot_agent_bot_id"),
  chatwootAgentBotToken: text("chatwoot_agent_bot_token"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 100 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 255 }),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 30 }).notNull().default("corretor"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  isActive: boolean("is_active").notNull().default(true),
  chatwootInboxId: integer("chatwoot_inbox_id"),
  n8nWorkflowId: varchar("n8n_workflow_id", { length: 100 }),
  evolutionInstanceName: varchar("evolution_instance_name", { length: 100 }),
  evolutionApiKey: text("evolution_api_key"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const agentConfigs = pgTable("agent_configs", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().unique().references(() => agents.id, { onDelete: "cascade" }),
  systemPrompt: text("system_prompt"),
  companyInfo: text("company_info"),
  welcomeMessage: text("welcome_message"),
  enableHumanHandoff: boolean("enable_human_handoff").default(true),
  enableAudioTranscription: boolean("enable_audio_transcription").default(true),
  enableImageProcessing: boolean("enable_image_processing").default(true),
  openaiModel: varchar("openai_model", { length: 50 }).default("gpt-4o-mini"),
  toolsConfig: jsonb("tools_config"),
  schedulingConfig: jsonb("scheduling_config"),
  ragConfig: jsonb("rag_config"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// -----------------------------------------------------------------------------
// CRM: pipeline_stages primeiro (FK de contacts)
// -----------------------------------------------------------------------------

export const pipelineStages = pgTable("pipeline_stages", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 50 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// -----------------------------------------------------------------------------
// CRM: imóveis, contatos, tags, tarefas
// -----------------------------------------------------------------------------

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }),
  addressStreet: varchar("address_street", { length: 255 }),
  addressNumber: varchar("address_number", { length: 20 }),
  addressComplement: varchar("address_complement", { length: 100 }),
  addressNeighborhood: varchar("address_neighborhood", { length: 100 }),
  addressCity: varchar("address_city", { length: 100 }),
  addressState: varchar("address_state", { length: 2 }),
  addressZip: varchar("address_zip", { length: 20 }),
  valueSale: numeric("value_sale", { precision: 14, scale: 2 }),
  valueRent: numeric("value_rent", { precision: 14, scale: 2 }),
  status: varchar("status", { length: 30 }).notNull().default("available"),
  description: text("description"),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  parkingSpaces: integer("parking_spaces"),
  areaM2: numeric("area_m2", { precision: 10, scale: 2 }),
  code: varchar("code", { length: 50 }),
  isHighlight: boolean("is_highlight").default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const propertyPhotos = pgTable("property_photos", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }),
  color: varchar("color", { length: 7 }),
  category: varchar("category", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 320 }),
  source: varchar("source", { length: 100 }),
  pipelineStageId: integer("pipeline_stage_id").references(() => pipelineStages.id, { onDelete: "set null" }),
  leadScore: integer("lead_score").default(0),
  optIn: boolean("opt_in").default(true),
  optInAt: timestamp("opt_in_at", { withTimezone: true }),
  whatsappValidated: boolean("whatsapp_validated").default(false),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contactTagRelations = pgTable(
  "contact_tag_relations",
  {
    contactId: integer("contact_id").notNull().references(() => contacts.id, { onDelete: "cascade" }),
    tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.contactId, t.tagId] })]
);

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  contactId: integer("contact_id").references(() => contacts.id, { onDelete: "cascade" }),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "set null" }),
  assignedToId: integer("assigned_to_id").references(() => users.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }),
  dueAt: timestamp("due_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
