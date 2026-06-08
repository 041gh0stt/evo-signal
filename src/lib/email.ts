import { Resend } from "resend";

// Helper central de envio de e-mails transacionais (reset de senha, convites, etc).
// Usa o Resend se RESEND_API_KEY estiver configurado no ambiente. Caso contrário,
// não falha — apenas registra o conteúdo no log do servidor (útil em dev/local
// e evita quebrar o fluxo enquanto o provedor de e-mail não está configurado).
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.EMAIL_FROM ?? "Pingo <onboarding@resend.dev>";

export async function sendEmail(params: { to: string; subject: string; html: string }) {
  const { to, subject, html } = params;

  if (!resend) {
    console.warn(
      `[email] RESEND_API_KEY não configurada — e-mail NÃO enviado.\n` +
        `  Para: ${to}\n  Assunto: ${subject}\n  Conteúdo:\n${html}`
    );
    return { skipped: true };
  }

  try {
    await resend.emails.send({ from: FROM, to, subject, html });
    return { skipped: false };
  } catch (err) {
    console.error("[email] Falha ao enviar e-mail via Resend:", err);
    return { skipped: true, error: err };
  }
}

export function passwordResetEmailHtml(resetUrl: string) {
  return `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; color: #18181b;">
      <h2 style="color: #10b981;">Redefinir senha — Pingo</h2>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
      <p>Clique no botão abaixo para escolher uma nova senha. Este link expira em 1 hora.</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="background:#10b981;color:#09090b;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
          Redefinir minha senha
        </a>
      </p>
      <p style="font-size: 13px; color: #71717a;">Se você não solicitou isso, pode ignorar este e-mail com segurança.</p>
    </div>
  `;
}

export function workspaceInviteEmailHtml(params: { workspaceName: string; inviteUrl: string }) {
  const { workspaceName, inviteUrl } = params;
  return `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; color: #18181b;">
      <h2 style="color: #10b981;">Você foi convidado(a) para o Pingo</h2>
      <p>Você recebeu um convite para fazer parte do workspace <strong>${workspaceName}</strong>.</p>
      <p style="margin: 24px 0;">
        <a href="${inviteUrl}" style="background:#10b981;color:#09090b;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
          Aceitar convite
        </a>
      </p>
      <p style="font-size: 13px; color: #71717a;">Se você não esperava este convite, pode ignorá-lo com segurança.</p>
    </div>
  `;
}
