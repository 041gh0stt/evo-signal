import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Validação básica de formato de e-mail
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { name, email, password } = body as Record<string, unknown>;

  if (
    typeof email !== "string" ||
    !email ||
    !isValidEmail(email) ||
    email.length > 254
  ) {
    return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
  }

  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    return NextResponse.json({ error: "Senha precisa ter entre 8 e 128 caracteres" }, { status: 400 });
  }

  if (name !== undefined && (typeof name !== "string" || name.length > 100)) {
    return NextResponse.json({ error: "Nome inválido" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    // Retorna 200 para evitar enumeração de e-mails (o registro falhou silenciosamente)
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name: name ? String(name).trim() : null, email: email.toLowerCase(), password: hashed },
  });

  return NextResponse.json({ id: user.id }, { status: 201 });
}
