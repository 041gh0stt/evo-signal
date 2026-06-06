import axios from "axios";
import crypto from "crypto";

interface ConversionEvent {
  eventName: string;
  eventId: string;
  eventTime: number;
  phone: string;
  pixelId: string;
  accessToken: string;
  testEventCode?: string;
  customData?: Record<string, unknown>;
}

function hashPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  return crypto.createHash("sha256").update(cleaned).digest("hex");
}

export async function fireConversionEvent({
  eventName,
  eventId,
  eventTime,
  phone,
  pixelId,
  accessToken,
  testEventCode,
  customData = {},
}: ConversionEvent) {
  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: eventName,
        event_time: eventTime,
        event_id: eventId,
        action_source: "other",
        user_data: {
          ph: [hashPhone(phone)],
        },
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
