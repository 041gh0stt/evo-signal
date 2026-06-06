import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getQRCode } from "@/services/evolution";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true, name: true, whatsappInstanceId: true, whatsappConnected: true },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (workspace.whatsappConnected) {
    return NextResponse.json({ connected: true });
  }

  if (!workspace.whatsappInstanceId) {
    return NextResponse.json({ error: "Instance not initialized" }, { status: 400 });
  }

  try {
    const qrData = await getQRCode(workspace.whatsappInstanceId);
    if (!qrData?.qrDataUrl) {
      return NextResponse.json({ error: "QR not available" }, { status: 503 });
    }
    return NextResponse.json({
      qrCode: qrData.qrDataUrl,
      workspaceName: workspace.name,
    });
  } catch {
    return NextResponse.json({ error: "Failed to get QR" }, { status: 503 });
  }
}
