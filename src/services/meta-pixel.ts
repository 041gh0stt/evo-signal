import axios from "axios";
import crypto from "crypto";

interface ConversionEvent {
  eventName: string;
  eventId: string;
  eventTime: number;
  phone?: string | null;   // opcional — eventos de site não têm telefone
  name?: string | null;
  pixelId: string;
  accessToken: string;
  testEventCode?: string;
  customData?: Record<string, unknown>;
  // Dados de contexto do clique — aumentam o match rate da Meta Conversions API
  clientIp?: string | null;
  clientUserAgent?: string | null;
  fbc?: string | null;
  gclid?: string | null; // Google Click ID — não enviado ao Meta, só para log/atribuição
}

function hash(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function hashPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  return crypto.createHash("sha256").update(cleaned).digest("hex");
}

// Deriva o código do país a partir do número de telefone
function countryFromPhone(phone: string): string | null {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("55")) return "br";
  if (cleaned.startsWith("1"))  return "us";
  if (cleaned.startsWith("351")) return "pt";
  if (cleaned.startsWith("54")) return "ar";
  if (cleaned.startsWith("52")) return "mx";
  if (cleaned.startsWith("57")) return "co";
  if (cleaned.startsWith("56")) return "cl";
  if (cleaned.startsWith("51")) return "pe";
  return null;
}

export async function fireConversionEvent({
  eventName,
  eventId,
  eventTime,
  phone,
  name,
  pixelId,
  accessToken,
  testEventCode,
  customData = {},
  clientIp,
  clientUserAgent,
  fbc,
}: ConversionEvent) {
  // user_data: quanto mais campos, melhor o match rate
  const userData: Record<string, unknown> = {};

  // Telefone e external_id — campos mais importantes, opcionais para eventos de site
  if (phone) {
    userData.ph = [hashPhone(phone)];
    userData.external_id = [hashPhone(phone)];
  }

  // Nome (primeiro + último) hasheados
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    userData.fn = [hash(parts[0])];
    if (parts.length > 1) {
      userData.ln = [hash(parts[parts.length - 1])];
    }
  }

  // País derivado do código do telefone (não precisa de hash)
  const country = phone ? countryFromPhone(phone) : null;
  if (country) {
    userData.country = [hash(country)];
  }

  // IP e user-agent do clique — não precisam de hash
  if (clientIp) userData.client_ip_address = clientIp;
  if (clientUserAgent) userData.client_user_agent = clientUserAgent;

  // FBC (Facebook Click ID) — identifica o clique exato no anúncio
  if (fbc) userData.fbc = fbc;

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: eventName,
        event_time: eventTime,
        event_id: eventId,
        // "website" quando temos IP+UA (clique via link), "other" quando só WhatsApp
        action_source: (clientIp && clientUserAgent) ? "website" : "other",
        user_data: userData,
        custom_data: {
          ...customData,
          source: "whatsapp",
        },
      },
    ],
  };

  if (testEventCode) {
    payload.test_event_code = testEventCode;
  }

  const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;

  console.log("[meta-pixel] firing", eventName, "userData keys:", Object.keys(userData));

  try {
    const { data } = await axios.post(url, payload);
    return data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response) {
      const detail = JSON.stringify(err.response.data);
      throw new Error(`Meta API ${err.response.status}: ${detail}`);
    }
    throw err;
  }
}

export const META_STANDARD_EVENTS = [
  "Lead",
  "Purchase",
  "InitiateCheckout",
  "AddToCart",
  "ViewContent",
  "Search",
  "Contact",
  "Schedule",
  "SubmitApplication",
  "CompleteRegistration",
  "Subscribe",
  "CustomizeProduct",
  "FindLocation",
  "StartTrial",
] as const;

export type MetaEventName = (typeof META_STANDARD_EVENTS)[number];
