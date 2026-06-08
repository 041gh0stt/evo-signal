import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || !password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

  if (
    !resetToken ||
    resetToken.usedAt ||
    resetToken.expiresAt.getTime() < Date.now()
  ) {
    return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { password: hashed } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
  ]);

  return NextResponse.json({ ok: true });
}
