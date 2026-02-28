import { Router } from "express";
import { callMcpTool } from "../services/mcp-client.js";

const router = Router();

/**
 * Payload genérico para teste e futura integração Evolution/ChatWoot.
 * POST /api/webhook/message
 * Body: { from: string, message: string, tenantId?: number }
 * Resposta: { reply: string }
 */
router.post("/message", async (req, res) => {
  try {
    const { from, message, tenantId } = req.body as { from?: string; message?: string; tenantId?: number };
    const text = typeof message === "string" ? message.trim() : "";
    const fromId = typeof from === "string" ? from : "unknown";
    const tenant = Number.isInteger(tenantId) && tenantId! > 0 ? tenantId! : 1;

    if (!text) {
      res.json({
        reply: "Olá! Envie uma mensagem. Ex.: \"buscar imóveis\" ou um número para ver detalhes de um imóvel.",
      });
      return;
    }

    const lower = text.toLowerCase();
    let reply: string;

    // Regra simples: "buscar" ou "imóvel" → search_properties; número → get_property
    if (/\bbuscar\b|\bimóveis?\b|\balugar\b|\bcomprar\b/.test(lower)) {
      const neighborhood = extractNeighborhood(text) || "";
      const propertyType = extractPropertyType(text) || "";
      const result = await callMcpTool("search_properties", {
        tenant_id: tenant,
        neighborhood: neighborhood || undefined,
        property_type: propertyType || undefined,
      });
      reply = result.isError ? `Erro: ${result.text}` : result.text;
    } else if (/^\d+$/.test(text.trim())) {
      const id = parseInt(text.trim(), 10);
      const result = await callMcpTool("get_property", { property_id: id, tenant_id: tenant });
      reply = result.isError ? `Erro: ${result.text}` : result.text;
    } else {
      reply =
        "Não entendi. Digite \"buscar imóveis\" para listar ou um número (ex.: 1) para ver detalhes de um imóvel.";
    }

    console.log(`[webhook] from=${fromId} message="${text.slice(0, 50)}" reply_len=${reply.length}`);
    res.json({ reply });
  } catch (err) {
    console.error("[webhook]", err);
    const message = err instanceof Error ? err.message : "Erro ao processar mensagem";
    res.status(500).json({
      reply: `Desculpe, ocorreu um erro: ${message}. Tente novamente.`,
    });
  }
});

function extractNeighborhood(text: string): string {
  const match = text.match(/(?:bairro|no bairro|em)\s+([a-záàâãéêíóôõúç\s]+?)(?:\s|,|\.|$)/i);
  return match ? match[1].trim() : "";
}

function extractPropertyType(text: string): string {
  const lower = text.toLowerCase();
  if (/\bapartamento\b|apto\b/.test(lower)) return "apartment";
  if (/\bcasa\b/.test(lower)) return "house";
  if (/\bterreno\b/.test(lower)) return "land";
  if (/\bcomercial\b/.test(lower)) return "commercial";
  return "";
}

export default router;
