import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActiveWorkspace } from "@/lib/workspace";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getActiveWorkspace();
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const { metaAccessToken, metaUserToken, ...safe } = workspace;
  return NextResponse.json({
    ...safe,
    hasAccessToken: !!metaAccessToken,
    metaConnected: !!metaUserToken,
  });
}
