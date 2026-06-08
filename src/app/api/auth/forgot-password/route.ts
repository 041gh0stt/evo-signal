import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail, passwordResetEmailHtml } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Sempre responde com sucesso — não revela se o e-mail existe ou não
  // (evita que alguém descubra quais e-mails têm conta no sistema).
  if (user?.password) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const baseUrl = process.env.NEXTAUTH_URL ?? req.nextUrl.origin;
    const resetUrl = `${baseUrl}/reset-password/${token}`;

    await sendEmail({
      to: email,
      subject: "Redefinir sua senha — Pingo",
      html: passwordResetEmailHtml(resetUrl),
    });
  }

  return NextResponse.json({ ok: true });
}
