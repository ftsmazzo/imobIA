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
      const maxValue = extractMaxValue(text);
      const result = await callMcpTool("search_properties", {
        tenant_id: tenant,
        neighborhood: neighborhood || undefined,
        property_type: propertyType || undefined,
        ...(maxValue != null && maxValue > 0 ? { max_value: maxValue } : {}),
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

/** Extrai valor máximo da mensagem (ex.: "até 500 mil", "máximo 1 milhão", "até R$ 300000"). */
function extractMaxValue(text: string): number | undefined {
  const lower = text.replace(/\s+/g, " ").trim().toLowerCase();
  const milhao = lower.match(/(?:até|máximo|max|valor\s+)?(?:de\s+)?(?:r\$\s*)?(\d+(?:[.,]\d+)?)\s*(?:milh[oõ]es?|mi)/i);
  if (milhao) {
    const n = parseFloat(milhao[1].replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n * 1_000_000 : undefined;
  }
  const mil = lower.match(/(?:até|máximo|max|valor\s+)?(?:de\s+)?(?:r\$\s*)?(\d+(?:[.,]\d+)?)\s*(?:mil|k)/i);
  if (mil) {
    const n = parseFloat(mil[1].replace(",", "."));
    return n * 1000;
  }
  const num = lower.match(/(?:até|máximo|max|valor\s+)?(?:de\s+)?(?:r\$\s*)?(\d{4,})/);
  if (num) return parseInt(num[1].replace(/\D/g, ""), 10);
  return undefined;
}

export default router;
