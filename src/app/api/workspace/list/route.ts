import { NextResponse } from "next/server";
import { getUserWorkspaces } from "@/lib/workspace";

export async function GET() {
  const workspaces = await getUserWorkspaces();
  return NextResponse.json(workspaces);
}
