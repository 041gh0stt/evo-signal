import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActiveWorkspace } from "@/lib/workspace";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL));

  const workspace = await getActiveWorkspace();
  if (!workspace) return NextResponse.redirect(new URL("/settings", process.env.NEXT_PUBLIC_APP_URL));

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`;
  const scope = "ads_read,ads_management";

  const url = new URL("https://www.facebook.com/v24.0/dialog/oauth");
  url.searchParams.set("client_id", process.env.META_APP_ID!);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scope);
  url.searchParams.set("state", workspace.id);
  url.searchParams.set("response_type", "code");

  return NextResponse.redirect(url.toString());
}
