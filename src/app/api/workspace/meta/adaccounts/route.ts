import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActiveWorkspace } from "@/lib/workspace";
import axios from "axios";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getActiveWorkspace();
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  if (!workspace.metaUserToken) {
    return NextResponse.json({ error: "Meta não conectado" }, { status: 400 });
  }

  try {
    const { data } = await axios.get("https://graph.facebook.com/v24.0/me/adaccounts", {
      params: {
        fields: "id,name,account_id,currency,account_status",
        access_token: workspace.metaUserToken,
        limit: 200,
      },
    });

    const accounts = (data?.data ?? []).map((a: Record<string, unknown>) => ({
      id: a.id as string,
      accountId: a.account_id as string,
      name: a.name as string,
      currency: a.currency as string,
      status: a.account_status as number,
    }));

    return NextResponse.json({ accounts, selected: workspace.metaAdAccountId });
  } catch (err: unknown) {
    const msg = axios.isAxiosError(err) ? JSON.stringify(err.response?.data) : String(err);
    console.error("[meta/adaccounts]", msg);
    return NextResponse.json({ error: "Erro ao buscar contas de anúncio" }, { status: 500 });
  }
}
