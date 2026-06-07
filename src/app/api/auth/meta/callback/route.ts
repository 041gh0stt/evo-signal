import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import axios from "axios";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // workspaceId
  const error = searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(`${APP_URL}/settings?meta_error=1`);
  }

  const redirectUri = `${APP_URL}/api/auth/meta/callback`;

  try {
    // 1. Exchange code for short-lived user access token
    const tokenRes = await axios.get("https://graph.facebook.com/v24.0/oauth/access_token", {
      params: {
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        redirect_uri: redirectUri,
        code,
      },
    });

    const shortLivedToken = tokenRes.data?.access_token;
    if (!shortLivedToken) throw new Error("No access token returned");

    // 2. Exchange for long-lived token (~60 days)
    const longLivedRes = await axios.get("https://graph.facebook.com/v24.0/oauth/access_token", {
      params: {
        grant_type: "fb_exchange_token",
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        fb_exchange_token: shortLivedToken,
      },
    });

    const longLivedToken = longLivedRes.data?.access_token ?? shortLivedToken;

    // 3. Save token to workspace
    await prisma.workspace.update({
      where: { id: state },
      data: { metaUserToken: longLivedToken },
    });

    return NextResponse.redirect(`${APP_URL}/settings?meta_connected=1`);
  } catch (err: unknown) {
    const msg = axios.isAxiosError(err) ? JSON.stringify(err.response?.data) : String(err);
    console.error("[meta/callback]", msg);
    return NextResponse.redirect(`${APP_URL}/settings?meta_error=1`);
  }
}
