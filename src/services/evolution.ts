import axios from "axios";
import QRCode from "qrcode";

function getClient(instanceApiKey?: string) {
  return axios.create({
    baseURL: process.env.EVOLUTION_API_URL,
    headers: {
      apikey: instanceApiKey ?? process.env.EVOLUTION_API_KEY,
      "Content-Type": "application/json",
    },
  });
}

export async function createInstance(instanceName: string) {
  const { data } = await getClient().post("/instance/create", {
    instanceName,
    qrcode: false,
    integration: "WHATSAPP-BAILEYS",
  });
  // v2 response: { instance: { instanceName, instanceId, status }, hash: { apikey } }
  return data;
}

export async function getQRCode(instanceName: string, instanceApiKey?: string) {
  const { data } = await getClient(instanceApiKey).get(
    `/instance/connect/${instanceName}`
  );
  // v2 response: { pairingCode, code, count }
  // Generate QR image from the code string
  if (data?.code) {
    const qrDataUrl = await QRCode.toDataURL(data.code, {
      width: 280,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });
    return { qrDataUrl, pairingCode: data.pairingCode };
  }
  return data;
}

export async function getInstanceStatus(instanceName: string, instanceApiKey?: string) {
  const { data } = await getClient(instanceApiKey).get(
    `/instance/connectionState/${instanceName}`
  );
  // v2 response: { instance: { instanceName, state } }
  return data;
}

export async function findContacts(instanceName: string) {
  const { data } = await getClient().post(`/chat/findContacts/${instanceName}`, {});
  return Array.isArray(data) ? data : [];
}

export async function findMessages(instanceName: string, remoteJid: string, limit = 50) {
  const { data } = await getClient().post(`/chat/findMessages/${instanceName}`, {
    where: { key: { remoteJid } },
    limit,
  });
  // v2: { messages: { records: [...] } }
  return data?.messages?.records ?? data?.records ?? (Array.isArray(data) ? data : []);
}

export async function getInstanceInfo(instanceName: string) {
  // Retorna detalhes incluindo o número conectado (ownerJid / profileName)
  const { data } = await getClient().get(
    `/instance/fetchInstances?instanceName=${instanceName}`
  );
  // v2 response: array de instâncias — pega a primeira
  const instance = Array.isArray(data) ? data[0] : data;
  return instance;
}

export async function logoutInstance(instanceName: string, instanceApiKey?: string) {
  const { data } = await getClient(instanceApiKey).delete(
    `/instance/logout/${instanceName}`
  );
  return data;
}

export async function deleteInstance(instanceName: string) {
  const { data } = await getClient().delete(
    `/instance/delete/${instanceName}`
  );
  return data;
}

export async function setWebhook(instanceName: string, webhookUrl: string, instanceApiKey?: string) {
  const webhookSecret = process.env.EVOLUTION_WEBHOOK_SECRET;

  const { data } = await getClient(instanceApiKey).post(
    `/webhook/set/${instanceName}`,
    {
      webhook: {
        enabled: true,
        url: webhookUrl,
        webhookByEvents: false,
        webhookBase64: false,
        events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE", "MESSAGES_UPDATE"],
        // Envia o secret como header em cada requisição ao Pingo
        ...(webhookSecret && {
          headers: { apikey: webhookSecret },
        }),
      },
    }
  );
  return data;
}

export async function sendTextMessage(
  instanceName: string,
  phone: string,
  text: string,
  instanceApiKey?: string
) {
  const { data } = await getClient(instanceApiKey).post(
    `/message/sendText/${instanceName}`,
    { number: phone, text }
  );
  return data;
}
