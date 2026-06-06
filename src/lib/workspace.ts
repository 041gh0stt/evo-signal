import { cookies } from "next/headers";
import { auth } from "./auth";
import { prisma } from "./prisma";

export const ACTIVE_WORKSPACE_COOKIE = "evo-active-workspace";

/**
 * Returns the active workspace for the current user.
 * Priority: cookie → first workspace the user belongs to.
 */
export async function getActiveWorkspace() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const cookieStore = await cookies();
  const cookieWorkspaceId = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;

  // Fetch all workspaces the user belongs to
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });

  if (memberships.length === 0) return null;

  // Try to use cookie value if it belongs to this user
  if (cookieWorkspaceId) {
    const match = memberships.find((m) => m.workspaceId === cookieWorkspaceId);
    if (match) return match.workspace;
  }

  // Fallback: first workspace
  return memberships[0].workspace;
}

export async function getUserWorkspaces() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });

  return memberships.map((m) => ({ ...m.workspace, role: m.role }));
}
