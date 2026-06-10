import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActiveWorkspace } from "@/lib/workspace";
import axios from "axios";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getActiveWorkspace();
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  if (!workspace.metaUserToken || !workspace.metaAdAccountId) {
    return NextResponse.json({ campaigns: [] });
  }

  try {
    const { data } = await axios.get(
      `https://graph.facebook.com/v24.0/${workspace.metaAdAccountId}/campaigns`,
      {
        params: {
          fields: "id,name,status,objective",
          effective_status: ["ACTIVE", "PAUSED"],
          limit: 200,
          access_token: workspace.metaUserToken,
        },
      }
    );

    const campaigns = (data?.data ?? []).map((c: Record<string, unknown>) => ({
      id: c.id as string,
      name: c.name as string,
      status: c.status as string,
    }));

    return NextResponse.json({ campaigns });
  } catch (err: unknown) {
    const msg = axios.isAxiosError(err) ? JSON.stringify(err.response?.data) : String(err);
    console.error("[meta/campaigns]", msg);
    // Retorna lista vazia em vez de erro — link form continua funcionando sem a integração
    return NextResponse.json({ campaigns: [] });
  }
}
