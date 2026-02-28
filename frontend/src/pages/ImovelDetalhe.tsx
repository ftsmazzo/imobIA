import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import Button from "../components/Button";

type PropertyDetail = {
  id: number;
  type: string;
  title: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressNeighborhood: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZip: string | null;
  valueSale: string | null;
  valueRent: string | null;
  status: string;
  description: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpaces: number | null;
  areaM2: string | null;
  code: string | null;
  isHighlight: boolean;
  photos?: { id: number; url: string; sortOrder: number }[];
};

const TIPO_LABEL: Record<string, string> = {
  apartment: "Apartamento",
  house: "Casa",
  land: "Terreno",
  commercial: "Comercial",
};

const STATUS_LABEL: Record<string, string> = {
  available: "Disponível",
  reserved: "Reservado",
  sold: "Vendido",
  rented: "Alugado",
};

export default function ImovelDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [data, setData] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    apiFetch(`/api/properties/${id}`, { token: token ?? undefined })
      .then((r) => {
        if (!r.ok) throw new Error("Imóvel não encontrado");
        return r.json();
      })
      .then(setData)
      .catch(() => setError("Imóvel não encontrado"))
      .finally(() => setLoading(false));
  }, [id, token]);

  if (loading) return <p>Carregando…</p>;
  if (error || !data) return <p style={{ color: "#c00" }}>{error || "Não encontrado"}</p>;

  const endereco = [
    data.addressStreet,
    data.addressNumber,
    data.addressComplement,
    data.addressNeighborhood,
    data.addressCity,
    data.addressState,
    data.addressZip,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <Button variant="secondary" onClick={() => navigate("/imoveis")}>← Voltar aos imóveis</Button>
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        {data.photos && data.photos.length > 0 && (
          <div style={{ display: "flex", gap: 8, padding: "1rem", overflowX: "auto", background: "#fafafa" }}>
            {data.photos.map((ph) => (
              <img
                key={ph.id}
                src={ph.url}
                alt=""
                style={{ height: 180, width: 240, objectFit: "cover", borderRadius: 8 }}
              />
            ))}
          </div>
        )}
        <div style={{ padding: "1.5rem 2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <h1 style={{ margin: 0, fontSize: "1.5rem" }}>{data.title || `Imóvel #${data.id}`}</h1>
            {data.code && (
              <span style={{ fontSize: "0.85rem", color: "#888", background: "#eee", padding: "0.2rem 0.5rem", borderRadius: 4 }}>
                {data.code}
              </span>
            )}
            {data.isHighlight && (
              <span style={{ fontSize: "0.8rem", background: "#0f3460", color: "#fff", padding: "0.2rem 0.5rem", borderRadius: 4 }}>
                Destaque
              </span>
            )}
          </div>
          <p style={{ margin: "0 0 1rem", color: "#666", fontSize: "0.95rem" }}>
            {TIPO_LABEL[data.type] || data.type} · {STATUS_LABEL[data.status] || data.status}
          </p>
          {(data.valueSale || data.valueRent) && (
            <p style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 600, color: "#0f3460" }}>
              {data.valueSale && `Venda: R$ ${data.valueSale}`}
              {data.valueSale && data.valueRent && " · "}
              {data.valueRent && `Aluguel: R$ ${data.valueRent}`}
            </p>
          )}
          {endereco && (
            <p style={{ margin: "0 0 1rem", fontSize: "0.95rem", color: "#555" }}>
              <strong>Endereço:</strong> {endereco}
            </p>
          )}
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            {data.bedrooms != null && <span>Quartos: {data.bedrooms}</span>}
            {data.bathrooms != null && <span>Banheiros: {data.bathrooms}</span>}
            {data.parkingSpaces != null && <span>Vagas: {data.parkingSpaces}</span>}
            {data.areaM2 && <span>Área: {data.areaM2} m²</span>}
          </div>
          {data.description && (
            <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #eee" }}>
              <strong>Descrição</strong>
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.95rem", color: "#555", whiteSpace: "pre-wrap" }}>
                {data.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
